// lib/agents/types.ts — Type definitions for the agent orchestration system

export interface DbAgentSchedule {
  agent_name: string;
  display_name: string;
  description: string;
  agent_group: 'blueprint' | 'review';
  cron_expression: string | null;
  enabled: boolean;
  max_retries: number;
  retry_delay_minutes: number;
  timeout_minutes: number;
  depends_on: string[];
  freshness_interval_hours: number;
  last_success_at: Date | null;
  next_due_at: Date | null;
  consecutive_failures: number;
  created_at: Date;
  updated_at: Date;
}

export interface DbAgentRun {
  id: number;
  agent_name: string;
  run_status: 'running' | 'completed' | 'failed';
  started_at: Date;
  completed_at: Date | null;
  duration_ms: number | null;
  records_processed: number;
  output: Record<string, unknown> | null;
  error_message: string | null;
  triggered_by: 'scheduler' | 'manual' | 'cron';
  last_heartbeat: Date;
  retry_count: number;
  created_at: Date;
}

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'stale' | 'disabled' | 'running';

export interface AgentHealth {
  agent_name: string;
  display_name: string;
  description: string;
  agent_group: 'blueprint' | 'review';
  enabled: boolean;
  health: HealthStatus;
  consecutive_failures: number;
  max_retries: number;
  freshness_interval_hours: number;
  last_success_at: Date | null;
  next_due_at: Date | null;
  depends_on: string[];
  dependencies_fresh: boolean;
  is_running: boolean;
  latest_run: DbAgentRun | null;
  recent_runs: DbAgentRun[];
}

export interface TickResult {
  timestamp: string;
  agents_triggered: string[];
  agents_skipped: { name: string; reason: string }[];
  zombies_recovered: string[];
  errors: { name: string; error: string }[];
}

export type AgentName =
  | 'sentinel_7'
  | 'pattern_31'
  | 'control_91'
  | 'archive_365'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annual';

export const ALL_AGENT_NAMES: AgentName[] = [
  'sentinel_7', 'pattern_31', 'control_91', 'archive_365',
  'weekly', 'monthly', 'quarterly', 'annual',
];
