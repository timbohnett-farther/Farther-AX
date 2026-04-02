-- 007_agent_scheduler.sql
-- Autonomous AI Agent Orchestration System
-- Creates agent_runs + agent_schedule tables for the 8-agent system

-- ============================================================================
-- 1. agent_runs — Audit log of every agent execution
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_runs (
  id              SERIAL PRIMARY KEY,
  agent_name      VARCHAR(50) NOT NULL CHECK (agent_name IN (
                    'sentinel_7', 'pattern_31', 'control_91', 'archive_365',
                    'weekly', 'monthly', 'quarterly', 'annual',
                    'hubspot_sync'
                  )),
  run_status      VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (run_status IN ('running', 'completed', 'failed')),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  duration_ms     INTEGER,
  records_processed INTEGER DEFAULT 0,
  output          JSONB,
  error_message   TEXT,
  triggered_by    VARCHAR(20) DEFAULT 'scheduler' CHECK (triggered_by IN ('scheduler', 'manual', 'cron')),
  last_heartbeat  TIMESTAMPTZ DEFAULT NOW(),
  retry_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_name_status ON agent_runs (agent_name, run_status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_name_started ON agent_runs (agent_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_heartbeat ON agent_runs (run_status, last_heartbeat) WHERE run_status = 'running';

-- ============================================================================
-- 2. agent_schedule — Per-agent configuration for autonomous scheduling
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_schedule (
  agent_name              VARCHAR(50) PRIMARY KEY,
  display_name            VARCHAR(100) NOT NULL,
  description             TEXT,
  agent_group             VARCHAR(20) NOT NULL DEFAULT 'blueprint' CHECK (agent_group IN ('blueprint', 'review')),
  cron_expression         VARCHAR(50),
  enabled                 BOOLEAN NOT NULL DEFAULT TRUE,
  max_retries             INTEGER NOT NULL DEFAULT 3,
  retry_delay_minutes     INTEGER NOT NULL DEFAULT 5,
  timeout_minutes         INTEGER NOT NULL DEFAULT 30,
  depends_on              VARCHAR(50)[] DEFAULT '{}',
  freshness_interval_hours INTEGER NOT NULL,
  last_success_at         TIMESTAMPTZ,
  next_due_at             TIMESTAMPTZ,
  consecutive_failures    INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. Seed all 8 agents
-- ============================================================================

INSERT INTO agent_schedule (agent_name, display_name, description, agent_group, cron_expression, freshness_interval_hours, depends_on, timeout_minutes)
VALUES
  -- Blueprint Agents (dependency chain: sentinel_7 → pattern_31 → control_91)
  ('sentinel_7',   'Sentinel-7',   'Daily data quality scan — validates HubSpot properties, detects missing fields, flags stale records within 7-day window',
   'blueprint', '0 2 * * *', 24, '{}', 30),

  ('pattern_31',   'Pattern-31',   'Monthly pattern analysis — identifies trends in advisor pipeline, sentiment shifts, and onboarding velocity across 31-day rolling window',
   'blueprint', '0 3 1 * *', 744, '{sentinel_7}', 45),

  ('control_91',   'Control-91',   'Quarterly control review — compliance checks, SLA adherence, risk scoring, and executive summary across 91-day quarter',
   'blueprint', '0 4 1 */3 *', 2184, '{pattern_31}', 60),

  ('archive_365',  'Archive-365',  'Annual archival — snapshots year-end metrics, archives graduated advisors, generates annual performance report',
   'blueprint', '0 5 1 1 *', 8760, '{}', 90),

  -- Review Agents (independent, time-based)
  ('weekly',       'Weekly Review',     'Weekly digest — summarizes pipeline changes, new deals, task completion rates, and team workload distribution',
   'review', '0 6 * * 1', 168, '{}', 20),

  ('monthly',      'Monthly Review',    'Monthly deep-dive — AUM tracking, advisor graduation progress, sentiment trends, and capacity planning',
   'review', '0 7 1 * *', 744, '{}', 30),

  ('quarterly',    'Quarterly Review',  'Quarterly business review — executive dashboard, goal tracking, risk assessment, and strategic recommendations',
   'review', '0 8 1 */3 *', 2184, '{}', 45),

  ('annual',       'Annual Review',     'Annual retrospective — year-over-year comparisons, advisor lifecycle analysis, and next-year planning inputs',
   'review', '0 9 1 1 *', 8760, '{}', 60)

ON CONFLICT (agent_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  agent_group = EXCLUDED.agent_group,
  cron_expression = EXCLUDED.cron_expression,
  freshness_interval_hours = EXCLUDED.freshness_interval_hours,
  depends_on = EXCLUDED.depends_on,
  timeout_minutes = EXCLUDED.timeout_minutes,
  updated_at = NOW();
