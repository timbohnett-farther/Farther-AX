// Shared types for advisor detail components

export type ProfileTab = 'overview' | 'financials' | 'engagements' | 'tech' | 'team' | 'tasks' | 'onboarding';

export interface ComplexityFactor {
  category: string;
  factor: string;
  points: number;
  maxPoints: number;
  detail: string;
}

export interface ComplexityData {
  score: number;
  tier: string;
  tierColor: string;
  factors: ComplexityFactor[];
  staffingRec: string;
  estimatedDays: number;
}

export interface AssignmentRow {
  deal_id: string;
  role: string;
  member_id: string;
  member_name: string;
  member_email: string;
  member_phone: string | null;
  member_calendar: string | null;
  member_role: string;
}

export interface AssignmentMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  calendar_link: string | null;
}

export interface StaffRec {
  role: string;
  recommended: AssignmentMember | null;
  alternatives: AssignmentMember[];
  reason: string;
  current_load: number;
  projected_load: number;
  capacity_status: 'green' | 'amber' | 'red';
}

export const STAGE_LABELS: Record<string, string> = {
  '2496931': 'Step 1 – First Meeting',
  '2496932': 'Step 2 – Financial Model',
  '2496934': 'Step 3 – Advisor Demo',
  '100409509': 'Step 4 – Discovery Day',
  '2496935': 'Step 5 – Offer Review',
  '2496936': 'Step 6 – Offer Accepted',
  '100411705': 'Step 7 – Launched',
  '31214941': 'Holding Pattern',
  '2496937': 'Prospect Passed',
  '26572965': 'Farther Passed',
};

export const STAGE_ORDER = ['2496931', '2496932', '2496934', '100409509', '2496935', '2496936', '100411705'];

export function stageIndex(stageId: string): number {
  return STAGE_ORDER.indexOf(stageId);
}

export function formatAUM(n: string | number | null | undefined): string {
  const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  if (!v || isNaN(v)) return '—';
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

export function formatPct(n: string | number | null | undefined): string {
  const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  if (!v || isNaN(v)) return '—';
  return `${v.toFixed(1)}%`;
}
