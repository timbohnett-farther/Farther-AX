// Shared types for Advisor Hub components

import type { Phase } from '@/lib/onboarding-tasks-v2';

export interface Deal {
  id: string;
  dealname: string;
  dealstage: string;
  transferable_aum: string | null;
  t12_revenue: string | null;
  current_firm__cloned_: string | null;
  firm_type: string | null;
  client_households: string | null;
  transition_type: string | null;
  desired_start_date: string | null;
  actual_launch_date: string | null;
  ownerName: string | null;
  daysSinceLaunch: number | null;
}

export interface SentimentScore {
  deal_id: string;
  composite_score: number;
  tier: string;
  activity_score: number;
  tone_score: number;
  milestone_score: number;
  recency_score: number;
  updated_at: string;
}

export interface AumAdvisor {
  deal_id: string;
  advisor_name: string;
  expected_aum: number | null;
  actual_aum: number | null;
  transfer_pct: number | null;
  launch_date: string | null;
  days_since_launch: number | null;
  prior_firm: string | null;
  households: number | null;
  transition_type: string | null;
  fee_rate_bps: number | null;
  current_revenue: number | null;
}

export interface ChecklistTask {
  id: string;
  label: string;
  phase: Phase;
  owner: string;
  timing: string;
  is_hard_gate: boolean;
  resources: string | null;
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
  due_date: string | null;
  responsible_person: { name: string; email: string; role: string } | null;
  countdown_display: string;
  days_remaining: number | null;
  status: 'upcoming' | 'due_soon' | 'overdue' | 'critical' | 'completed' | 'no_due_date';
}

export interface TaskSummary {
  open_tasks: number;
  completed_tasks: number;
  total_tasks: number;
  current_phase: string | null;
}

export type TabKey = 'launch' | 'early' | 'completed' | 'aum' | 'advisor-tasks';
