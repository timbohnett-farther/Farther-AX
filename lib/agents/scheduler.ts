// lib/agents/scheduler.ts — The core autonomy logic: scheduling brain
// Called every 5 minutes by Railway cron via /api/scheduler/tick

import pool from '@/lib/db';
import { recoverZombies, markAgentSuccess, markAgentFailure, updateHeartbeat } from './health';
import { PROCESSORS } from './processors';
import type { DbAgentSchedule, DbAgentRun, AgentName, TickResult } from './types';

/**
 * Check if an agent is currently running.
 */
async function isAgentRunning(agentName: string): Promise<boolean> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM agent_runs WHERE agent_name = $1 AND run_status = 'running'`,
    [agentName]
  );
  return parseInt(rows[0].count, 10) > 0;
}

/**
 * Check if an agent is due to run based on freshness interval.
 * An agent is due if: never run, or last_success_at + freshness_interval exceeds NOW.
 */
function isAgentDue(schedule: DbAgentSchedule): boolean {
  if (!schedule.last_success_at) return true;
  const msSinceSuccess = Date.now() - new Date(schedule.last_success_at).getTime();
  const intervalMs = schedule.freshness_interval_hours * 60 * 60 * 1000;
  return msSinceSuccess >= intervalMs;
}

/**
 * Check if a failed agent should be retried with exponential backoff.
 * Backoff formula: retry_delay_minutes * 2^(consecutive_failures - 1)
 */
async function shouldRetry(schedule: DbAgentSchedule): Promise<boolean> {
  if (schedule.consecutive_failures <= 0) return false;
  if (schedule.consecutive_failures >= schedule.max_retries) return false;

  // Get the last failed run's completion time
  const { rows } = await pool.query<{ completed_at: Date }>(
    `SELECT completed_at FROM agent_runs
     WHERE agent_name = $1 AND run_status = 'failed'
     ORDER BY completed_at DESC LIMIT 1`,
    [schedule.agent_name]
  );

  if (rows.length === 0 || !rows[0].completed_at) return true;

  const backoffMinutes = schedule.retry_delay_minutes * Math.pow(2, schedule.consecutive_failures - 1);
  const backoffMs = backoffMinutes * 60 * 1000;
  const msSinceFailure = Date.now() - new Date(rows[0].completed_at).getTime();

  return msSinceFailure >= backoffMs;
}

/**
 * Check if all dependencies for an agent are fresh.
 * A dependency is fresh if its last_success_at is within its freshness_interval.
 */
async function areDependenciesMet(schedule: DbAgentSchedule): Promise<{ met: boolean; stale: string[] }> {
  if (!schedule.depends_on || schedule.depends_on.length === 0) {
    return { met: true, stale: [] };
  }

  const stale: string[] = [];
  for (const dep of schedule.depends_on) {
    const { rows } = await pool.query<DbAgentSchedule>(
      `SELECT last_success_at, freshness_interval_hours FROM agent_schedule WHERE agent_name = $1`,
      [dep]
    );

    if (rows.length === 0 || !rows[0].last_success_at) {
      stale.push(dep);
      continue;
    }

    const hoursSince = (Date.now() - new Date(rows[0].last_success_at).getTime()) / (1000 * 60 * 60);
    if (hoursSince > rows[0].freshness_interval_hours) {
      stale.push(dep);
    }
  }

  return { met: stale.length === 0, stale };
}

/**
 * Execute an agent with heartbeat monitoring.
 * Creates the run record, starts heartbeat interval, runs processor, then marks success/failure.
 */
async function executeAgentWithHeartbeat(
  agentName: AgentName,
  triggeredBy: 'scheduler' | 'manual' | 'cron' = 'scheduler'
): Promise<void> {
  // Create the agent_runs record
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO agent_runs (agent_name, run_status, triggered_by, last_heartbeat)
     VALUES ($1, 'running', $2, NOW())
     RETURNING id`,
    [agentName, triggeredBy]
  );
  const runId = rows[0].id;

  // Start heartbeat interval (every 60 seconds)
  const heartbeatInterval = setInterval(async () => {
    try {
      await updateHeartbeat(runId);
    } catch (err) {
      console.error(`[Scheduler] Heartbeat update failed for ${agentName} run ${runId}:`, err);
    }
  }, 60_000);

  try {
    const processor = PROCESSORS[agentName];
    if (!processor) {
      throw new Error(`No processor registered for agent: ${agentName}`);
    }

    console.log(`[Scheduler] Starting ${agentName} (run #${runId})...`);
    const result = await processor();
    console.log(`[Scheduler] ${agentName} completed — ${result.records_processed} records processed`);

    await markAgentSuccess(agentName, runId, result.records_processed, result.output);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[Scheduler] ${agentName} failed:`, errorMessage);
    await markAgentFailure(agentName, runId, errorMessage);
  } finally {
    clearInterval(heartbeatInterval);
  }
}

/**
 * Main scheduler tick — called every 5 minutes by Railway cron.
 *
 * 1. Recover zombie agents
 * 2. Evaluate each enabled agent
 * 3. Execute eligible agents sequentially
 * 4. Return tick result
 */
export async function runSchedulerTick(): Promise<TickResult> {
  const result: TickResult = {
    timestamp: new Date().toISOString(),
    agents_triggered: [],
    agents_skipped: [],
    zombies_recovered: [],
    errors: [],
  };

  try {
    // Step 1: Recover zombie agents
    result.zombies_recovered = await recoverZombies();

    // Step 2: Load all enabled agent schedules
    const { rows: schedules } = await pool.query<DbAgentSchedule>(
      `SELECT * FROM agent_schedule WHERE enabled = TRUE ORDER BY agent_name`
    );

    // Step 3: Evaluate each agent
    for (const schedule of schedules) {
      const agentName = schedule.agent_name as AgentName;

      try {
        // Lock check: skip if already running
        if (await isAgentRunning(agentName)) {
          result.agents_skipped.push({ name: agentName, reason: 'already_running' });
          continue;
        }

        // Dependency check
        const deps = await areDependenciesMet(schedule);
        if (!deps.met) {
          result.agents_skipped.push({ name: agentName, reason: `dependencies_stale: ${deps.stale.join(', ')}` });
          continue;
        }

        // Determine if agent should run
        let shouldRun = false;
        let reason = '';

        if (isAgentDue(schedule)) {
          shouldRun = true;
          reason = 'due';
        } else if (schedule.consecutive_failures > 0 && await shouldRetry(schedule)) {
          shouldRun = true;
          reason = `retry_${schedule.consecutive_failures}/${schedule.max_retries}`;
        }

        if (!shouldRun) {
          result.agents_skipped.push({ name: agentName, reason: 'not_due' });
          continue;
        }

        // Step 4: Execute the agent
        console.log(`[Scheduler] Triggering ${agentName} (${reason})`);
        await executeAgentWithHeartbeat(agentName, 'scheduler');
        result.agents_triggered.push(agentName);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        result.errors.push({ name: agentName, error: errorMessage });
        console.error(`[Scheduler] Error evaluating ${agentName}:`, errorMessage);
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[Scheduler] Critical tick error:`, errorMessage);
    result.errors.push({ name: 'scheduler_tick', error: errorMessage });
  }

  console.log(`[Scheduler] Tick complete — triggered: ${result.agents_triggered.length}, skipped: ${result.agents_skipped.length}, zombies: ${result.zombies_recovered.length}`);
  return result;
}

/**
 * Manually trigger a specific agent (for the "Run Now" button).
 * Bypasses freshness/retry checks but respects running lock.
 */
export async function triggerAgent(agentName: AgentName): Promise<{ success: boolean; error?: string; run_id?: number }> {
  // Check if agent is registered
  if (!PROCESSORS[agentName]) {
    return { success: false, error: `Unknown agent: ${agentName}` };
  }

  // Check if already running
  if (await isAgentRunning(agentName)) {
    return { success: false, error: `${agentName} is already running` };
  }

  try {
    await executeAgentWithHeartbeat(agentName, 'manual');
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMessage };
  }
}
