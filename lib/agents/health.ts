// lib/agents/health.ts — Agent health monitoring, zombie recovery, success/failure tracking

import pool from '@/lib/db';
import type { DbAgentSchedule, DbAgentRun, AgentHealth, HealthStatus } from './types';

/**
 * Recover zombie agents — running agents whose heartbeat or started_at exceeds timeout.
 * Marks them as 'failed' and increments consecutive_failures on agent_schedule.
 * Returns array of recovered agent names.
 */
export async function recoverZombies(): Promise<string[]> {
  const recovered: string[] = [];

  // Find running agents that have exceeded their timeout
  const { rows: zombies } = await pool.query<DbAgentRun & { timeout_minutes: number }>(`
    SELECT r.id, r.agent_name, r.started_at, r.last_heartbeat,
           COALESCE(s.timeout_minutes, 30) AS timeout_minutes
    FROM agent_runs r
    LEFT JOIN agent_schedule s ON s.agent_name = r.agent_name
    WHERE r.run_status = 'running'
      AND (
        COALESCE(r.last_heartbeat, r.started_at) < NOW() - (COALESCE(s.timeout_minutes, 30) || ' minutes')::INTERVAL
      )
  `);

  for (const zombie of zombies) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Mark run as failed
      await client.query(`
        UPDATE agent_runs
        SET run_status = 'failed',
            completed_at = NOW(),
            duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER * 1000,
            error_message = 'Recovered zombie: heartbeat timeout exceeded'
        WHERE id = $1
      `, [zombie.id]);

      // Increment consecutive_failures on schedule
      await client.query(`
        UPDATE agent_schedule
        SET consecutive_failures = consecutive_failures + 1,
            updated_at = NOW()
        WHERE agent_name = $1
      `, [zombie.agent_name]);

      await client.query('COMMIT');
      recovered.push(zombie.agent_name);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[Health] Failed to recover zombie ${zombie.agent_name}:`, err);
    } finally {
      client.release();
    }
  }

  if (recovered.length > 0) {
    console.log(`[Health] Recovered ${recovered.length} zombie agents: ${recovered.join(', ')}`);
  }

  return recovered;
}

/**
 * Mark an agent as successfully completed.
 * Resets consecutive_failures, updates last_success_at, computes next_due_at.
 */
export async function markAgentSuccess(agentName: string, runId: number, recordsProcessed: number = 0, output?: Record<string, unknown>): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update the run record
    await client.query(`
      UPDATE agent_runs
      SET run_status = 'completed',
          completed_at = NOW(),
          duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER * 1000,
          records_processed = $2,
          output = $3
      WHERE id = $1
    `, [runId, recordsProcessed, output ? JSON.stringify(output) : null]);

    // Update the schedule: reset failures, set next_due_at
    await client.query(`
      UPDATE agent_schedule
      SET last_success_at = NOW(),
          consecutive_failures = 0,
          next_due_at = NOW() + (freshness_interval_hours || ' hours')::INTERVAL,
          updated_at = NOW()
      WHERE agent_name = $1
    `, [agentName]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[Health] Failed to mark success for ${agentName}:`, err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Mark an agent as failed.
 * Increments consecutive_failures. If >= max_retries, logs a critical alert.
 */
export async function markAgentFailure(agentName: string, runId: number, errorMessage: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update the run record
    await client.query(`
      UPDATE agent_runs
      SET run_status = 'failed',
          completed_at = NOW(),
          duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER * 1000,
          error_message = $2
      WHERE id = $1
    `, [runId, errorMessage]);

    // Increment consecutive_failures
    const { rows } = await client.query<{ consecutive_failures: number; max_retries: number }>(`
      UPDATE agent_schedule
      SET consecutive_failures = consecutive_failures + 1,
          updated_at = NOW()
      WHERE agent_name = $1
      RETURNING consecutive_failures, max_retries
    `, [agentName]);

    await client.query('COMMIT');

    // Log critical alert if max retries exceeded
    if (rows.length > 0 && rows[0].consecutive_failures >= rows[0].max_retries) {
      console.error(`[Health] CRITICAL: Agent ${agentName} has failed ${rows[0].consecutive_failures} times (max: ${rows[0].max_retries}). Error: ${errorMessage}`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[Health] Failed to mark failure for ${agentName}:`, err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Update heartbeat for a running agent.
 */
export async function updateHeartbeat(runId: number): Promise<void> {
  await pool.query(`
    UPDATE agent_runs SET last_heartbeat = NOW() WHERE id = $1
  `, [runId]);
}

/**
 * Compute health status for an agent based on its schedule and run history.
 */
function computeHealth(schedule: DbAgentSchedule, latestRun: DbAgentRun | null, dependenciesFresh: boolean): HealthStatus {
  if (!schedule.enabled) return 'disabled';

  // Check if currently running
  if (latestRun?.run_status === 'running') return 'running';

  // Critical: exceeded max retries
  if (schedule.consecutive_failures >= schedule.max_retries) return 'critical';

  // Warning: has failures but under max retries
  if (schedule.consecutive_failures > 0) return 'warning';

  // Stale: never run or last success exceeds 2x freshness interval
  if (!schedule.last_success_at) return 'stale';
  const hoursSinceSuccess = (Date.now() - new Date(schedule.last_success_at).getTime()) / (1000 * 60 * 60);
  if (hoursSinceSuccess > schedule.freshness_interval_hours * 2) return 'stale';

  // Check dependencies
  if (!dependenciesFresh) return 'warning';

  return 'healthy';
}

/**
 * Get full dashboard data — all 8 agents with health status, dependencies, and recent runs.
 */
export async function getAgentDashboard(): Promise<AgentHealth[]> {
  // Fetch all schedules
  const { rows: schedules } = await pool.query<DbAgentSchedule>(`
    SELECT * FROM agent_schedule ORDER BY agent_group, agent_name
  `);

  // Fetch latest run per agent
  const { rows: latestRuns } = await pool.query<DbAgentRun>(`
    SELECT DISTINCT ON (agent_name) *
    FROM agent_runs
    ORDER BY agent_name, started_at DESC
  `);

  // Fetch 5 most recent runs per agent
  const { rows: recentRuns } = await pool.query<DbAgentRun>(`
    SELECT * FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY agent_name ORDER BY started_at DESC) AS rn
      FROM agent_runs
    ) sub
    WHERE rn <= 5
    ORDER BY agent_name, started_at DESC
  `);

  // Build lookup maps
  const latestRunMap = new Map<string, DbAgentRun>();
  for (const run of latestRuns) {
    latestRunMap.set(run.agent_name, run);
  }

  const recentRunsMap = new Map<string, DbAgentRun[]>();
  for (const run of recentRuns) {
    const existing = recentRunsMap.get(run.agent_name) ?? [];
    existing.push(run);
    recentRunsMap.set(run.agent_name, existing);
  }

  const scheduleMap = new Map<string, DbAgentSchedule>();
  for (const s of schedules) {
    scheduleMap.set(s.agent_name, s);
  }

  // Build health for each agent
  return schedules.map((schedule) => {
    const latestRun = latestRunMap.get(schedule.agent_name) ?? null;
    const recent = recentRunsMap.get(schedule.agent_name) ?? [];

    // Check if dependencies are fresh
    const dependenciesFresh = schedule.depends_on.every((dep) => {
      const depSchedule = scheduleMap.get(dep);
      if (!depSchedule?.last_success_at) return false;
      const hoursSince = (Date.now() - new Date(depSchedule.last_success_at).getTime()) / (1000 * 60 * 60);
      return hoursSince <= depSchedule.freshness_interval_hours;
    });

    return {
      agent_name: schedule.agent_name,
      display_name: schedule.display_name,
      description: schedule.description,
      agent_group: schedule.agent_group,
      enabled: schedule.enabled,
      health: computeHealth(schedule, latestRun, dependenciesFresh),
      consecutive_failures: schedule.consecutive_failures,
      max_retries: schedule.max_retries,
      freshness_interval_hours: schedule.freshness_interval_hours,
      last_success_at: schedule.last_success_at,
      next_due_at: schedule.next_due_at,
      depends_on: schedule.depends_on,
      dependencies_fresh: dependenciesFresh,
      is_running: latestRun?.run_status === 'running',
      latest_run: latestRun,
      recent_runs: recent,
    };
  });
}
