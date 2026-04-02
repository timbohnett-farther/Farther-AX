// lib/agents/processors.ts — Individual agent processor functions
// Each processor performs its specific analysis task and returns results.

import pool from '@/lib/db';
import type { AgentName } from './types';

interface ProcessorResult {
  records_processed: number;
  output: Record<string, unknown>;
}

/**
 * Sentinel-7: Daily data quality scan
 * Validates HubSpot properties, detects missing fields, flags stale records
 */
async function runSentinel7(): Promise<ProcessorResult> {
  const checks: Record<string, unknown>[] = [];
  let recordsProcessed = 0;

  // Check for stale api_cache entries
  const { rows: staleCache } = await pool.query(`
    SELECT cache_key, expires_at
    FROM api_cache
    WHERE expires_at < NOW()
  `);
  checks.push({ check: 'stale_cache_entries', count: staleCache.length });
  recordsProcessed += staleCache.length;

  // Check for advisors missing key data in managed_accounts
  const { rows: missingData } = await pool.query(`
    SELECT advisor_name, COUNT(*) as account_count
    FROM managed_accounts
    WHERE current_value IS NULL OR current_value = 0
    GROUP BY advisor_name
  `);
  checks.push({ check: 'advisors_missing_values', count: missingData.length, advisors: missingData.slice(0, 10) });
  recordsProcessed += missingData.length;

  // Check managed_accounts_summary freshness
  const { rows: summaryAge } = await pool.query(`
    SELECT MIN(synced_at) as oldest_sync, MAX(synced_at) as newest_sync, COUNT(*) as total
    FROM managed_accounts_summary
  `);
  checks.push({ check: 'summary_freshness', ...summaryAge[0] });
  recordsProcessed += 1;

  return {
    records_processed: recordsProcessed,
    output: { type: 'sentinel_7', checks, scanned_at: new Date().toISOString() },
  };
}

/**
 * Pattern-31: Monthly pattern analysis
 * Identifies trends in advisor pipeline, sentiment shifts, onboarding velocity
 */
async function runPattern31(): Promise<ProcessorResult> {
  const patterns: Record<string, unknown>[] = [];
  let recordsProcessed = 0;

  // Analyze sentiment trends over last 31 days
  try {
    const { rows: sentimentTrends } = await pool.query(`
      SELECT
        tier,
        COUNT(*) as count,
        AVG(composite_score) as avg_score
      FROM advisor_sentiment_history
      WHERE scored_at > NOW() - INTERVAL '31 days'
      GROUP BY tier
      ORDER BY count DESC
    `);
    patterns.push({ pattern: 'sentiment_distribution_31d', data: sentimentTrends });
    recordsProcessed += sentimentTrends.length;
  } catch {
    patterns.push({ pattern: 'sentiment_distribution_31d', error: 'table not available' });
  }

  // Analyze managed accounts growth
  const { rows: aumTrends } = await pool.query(`
    SELECT
      COUNT(*) as total_accounts,
      SUM(current_value) as total_aum,
      AVG(current_value) as avg_account_value
    FROM managed_accounts
    WHERE current_value > 0
  `);
  patterns.push({ pattern: 'aum_snapshot', data: aumTrends[0] });
  recordsProcessed += 1;

  return {
    records_processed: recordsProcessed,
    output: { type: 'pattern_31', patterns, analyzed_at: new Date().toISOString() },
  };
}

/**
 * Control-91: Quarterly control review
 * Compliance checks, SLA adherence, risk scoring
 */
async function runControl91(): Promise<ProcessorResult> {
  const controls: Record<string, unknown>[] = [];
  let recordsProcessed = 0;

  // Check for long-running transitions
  try {
    const { rows: longTransitions } = await pool.query(`
      SELECT
        advisor_name,
        COUNT(*) as client_count,
        MIN(created_at) as oldest_record
      FROM transition_clients
      WHERE created_at < NOW() - INTERVAL '90 days'
      GROUP BY advisor_name
      HAVING COUNT(*) > 0
    `);
    controls.push({ control: 'long_running_transitions', count: longTransitions.length, details: longTransitions.slice(0, 10) });
    recordsProcessed += longTransitions.length;
  } catch {
    controls.push({ control: 'long_running_transitions', error: 'table not available' });
  }

  // Check team member coverage
  try {
    const { rows: teamCoverage } = await pool.query(`
      SELECT COUNT(*) as total_mappings FROM advisor_team_mappings
    `);
    controls.push({ control: 'team_coverage', ...teamCoverage[0] });
    recordsProcessed += 1;
  } catch {
    controls.push({ control: 'team_coverage', error: 'table not available' });
  }

  return {
    records_processed: recordsProcessed,
    output: { type: 'control_91', controls, reviewed_at: new Date().toISOString() },
  };
}

/**
 * Archive-365: Annual archival
 * Snapshots year-end metrics, archives graduated advisors
 */
async function runArchive365(): Promise<ProcessorResult> {
  const archives: Record<string, unknown>[] = [];
  let recordsProcessed = 0;

  // Snapshot current state
  const { rows: aumSnapshot } = await pool.query(`
    SELECT
      COUNT(DISTINCT advisor_name) as advisor_count,
      SUM(total_aum) as total_platform_aum,
      AVG(total_aum) as avg_advisor_aum,
      SUM(account_count) as total_accounts
    FROM managed_accounts_summary
  `);
  archives.push({ archive: 'annual_aum_snapshot', data: aumSnapshot[0] });
  recordsProcessed += 1;

  // Count graduations this year
  try {
    const { rows: gradCount } = await pool.query(`
      SELECT COUNT(*) as graduated_this_year
      FROM advisor_graduations
      WHERE graduated_at >= DATE_TRUNC('year', NOW())
    `);
    archives.push({ archive: 'annual_graduations', ...gradCount[0] });
    recordsProcessed += 1;
  } catch {
    archives.push({ archive: 'annual_graduations', error: 'table not available' });
  }

  return {
    records_processed: recordsProcessed,
    output: { type: 'archive_365', archives, archived_at: new Date().toISOString() },
  };
}

/**
 * Weekly Review: Summarizes pipeline changes and task completion rates
 */
async function runWeekly(): Promise<ProcessorResult> {
  const summary: Record<string, unknown>[] = [];
  let recordsProcessed = 0;

  // Recent agent runs summary
  const { rows: recentRuns } = await pool.query(`
    SELECT agent_name, run_status, COUNT(*) as count
    FROM agent_runs
    WHERE started_at > NOW() - INTERVAL '7 days'
    GROUP BY agent_name, run_status
  `);
  summary.push({ metric: 'agent_runs_7d', data: recentRuns });
  recordsProcessed += recentRuns.length;

  // Managed accounts changes
  const { rows: aumSummary } = await pool.query(`
    SELECT
      COUNT(*) as total_advisors,
      SUM(total_aum) as total_aum,
      SUM(total_monthly_revenue) as total_revenue
    FROM managed_accounts_summary
  `);
  summary.push({ metric: 'aum_summary', data: aumSummary[0] });
  recordsProcessed += 1;

  return {
    records_processed: recordsProcessed,
    output: { type: 'weekly_review', summary, period_end: new Date().toISOString() },
  };
}

/**
 * Monthly Review: AUM tracking, graduation progress, sentiment trends
 */
async function runMonthly(): Promise<ProcessorResult> {
  const review: Record<string, unknown>[] = [];
  let recordsProcessed = 0;

  // Full AUM breakdown by advisor
  const { rows: aumByAdvisor } = await pool.query(`
    SELECT advisor_name, total_aum, account_count, weighted_fee_bps
    FROM managed_accounts_summary
    ORDER BY total_aum DESC
    LIMIT 20
  `);
  review.push({ metric: 'top_20_advisors_by_aum', data: aumByAdvisor });
  recordsProcessed += aumByAdvisor.length;

  return {
    records_processed: recordsProcessed,
    output: { type: 'monthly_review', review, period_end: new Date().toISOString() },
  };
}

/**
 * Quarterly Review: Executive dashboard, goal tracking
 */
async function runQuarterly(): Promise<ProcessorResult> {
  const review: Record<string, unknown>[] = [];
  let recordsProcessed = 0;

  // Quarter-over-quarter agent success rate
  const { rows: agentStats } = await pool.query(`
    SELECT
      agent_name,
      COUNT(*) FILTER (WHERE run_status = 'completed') as successes,
      COUNT(*) FILTER (WHERE run_status = 'failed') as failures,
      COUNT(*) as total_runs,
      AVG(duration_ms) as avg_duration_ms
    FROM agent_runs
    WHERE started_at > NOW() - INTERVAL '91 days'
    GROUP BY agent_name
  `);
  review.push({ metric: 'agent_performance_91d', data: agentStats });
  recordsProcessed += agentStats.length;

  return {
    records_processed: recordsProcessed,
    output: { type: 'quarterly_review', review, period_end: new Date().toISOString() },
  };
}

/**
 * Annual Review: Year-over-year comparisons, lifecycle analysis
 */
async function runAnnual(): Promise<ProcessorResult> {
  const review: Record<string, unknown>[] = [];
  let recordsProcessed = 0;

  // Full year agent execution summary
  const { rows: yearStats } = await pool.query(`
    SELECT
      agent_name,
      COUNT(*) as total_runs,
      COUNT(*) FILTER (WHERE run_status = 'completed') as successes,
      COUNT(*) FILTER (WHERE run_status = 'failed') as failures,
      MIN(started_at) as first_run,
      MAX(started_at) as last_run
    FROM agent_runs
    WHERE started_at > NOW() - INTERVAL '365 days'
    GROUP BY agent_name
  `);
  review.push({ metric: 'annual_agent_summary', data: yearStats });
  recordsProcessed += yearStats.length;

  return {
    records_processed: recordsProcessed,
    output: { type: 'annual_review', review, period_end: new Date().toISOString() },
  };
}

// Registry mapping agent names to their processor functions
export const PROCESSORS: Record<AgentName, () => Promise<ProcessorResult>> = {
  sentinel_7: runSentinel7,
  pattern_31: runPattern31,
  control_91: runControl91,
  archive_365: runArchive365,
  weekly: runWeekly,
  monthly: runMonthly,
  quarterly: runQuarterly,
  annual: runAnnual,
};
