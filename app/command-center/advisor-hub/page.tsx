'use client';

import { useState, useMemo, useCallback } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-provider';
import { getStageColors } from '@/lib/theme';
import { PHASES, PHASE_ORDER, TASKS, type Phase } from '@/lib/onboarding-tasks-v2';
const fetcher = (url: string) => fetch(url).then(r => r.json());

const SWR_OPTS = {
  refreshInterval: 8 * 60 * 60 * 1000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60 * 60 * 1000,
  keepPreviousData: true,
  errorRetryCount: 2,
} as const;

// Using centralized theme colors from lib/theme-colors.ts

// ── Sentiment tier config (mirrors lib/sentiment.ts) ─────────────────────────
const TIER_CONFIG: Record<string, { color: string; bgColor: string; icon: string }> = {
  'Advocate':  { color: '#4ade80', bgColor: 'rgba(74,222,128,0.2)',   icon: '★' },
  'Positive':  { color: '#5ec4cf', bgColor: 'rgba(78,112,130,0.2)',  icon: '▲' },
  'Neutral':   { color: '#fbbf24', bgColor: 'rgba(251,191,36,0.18)', icon: '●' },
  'At Risk':   { color: '#fb923c', bgColor: 'rgba(251,146,60,0.2)', icon: '◈' },
  'High Risk': { color: '#f87171', bgColor: 'rgba(248,113,113,0.2)',  icon: '▼' },
};

// ── Stage config ─────────────────────────────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  '2496931':   'Step 1 – First Meeting',
  '2496932':   'Step 2 – Financial Model',
  '2496934':   'Step 3 – Advisor Demo',
  '100409509': 'Step 4 – Discovery Day',
  '2496935':   'Step 5 – Offer Review',
  '2496936':   'Step 6 – Offer Accepted',
  '100411705': 'Step 7 – Launched',
};

// Stage colors imported from lib/theme-colors.ts

const EARLY_STAGE_IDS = ['2496931', '2496932', '2496934', '100409509'];
const LAUNCH_STAGE_IDS = ['2496935', '2496936', '100411705'];
const LAUNCHED_STAGE_ID = '100411705';
const GRADUATION_DAYS = 90;

// ── Types ────────────────────────────────────────────────────────────────────
interface Deal {
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

interface SentimentScore {
  deal_id: string;
  composite_score: number;
  tier: string;
  activity_score: number;
  tone_score: number;
  milestone_score: number;
  recency_score: number;
  updated_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getLastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1] || '').toLowerCase();
}

function formatAUM(n: number | null | undefined): string {
  if (!n || isNaN(n)) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function sortByLastName(deals: Deal[]): Deal[] {
  return [...deals].sort((a, b) => getLastName(a.dealname).localeCompare(getLastName(b.dealname)));
}

// ── Tab definitions ──────────────────────────────────────────────────────────
type TabKey = 'launch' | 'early' | 'completed' | 'aum' | 'advisor-tasks';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'launch', label: 'Launch to Graduation', icon: '▲' },
  { key: 'early', label: 'Early Deals', icon: '◈' },
  { key: 'completed', label: 'Completed Transitions', icon: '✓' },
  { key: 'aum', label: 'AUM Tracker', icon: '◎' },
  { key: 'advisor-tasks', label: 'Advisor Tasks', icon: '✦' },
];

// ── Sentiment Badge Component ────────────────────────────────────────────────
function SentimentBadge({ score, tier }: { score: number | null; tier: string | null }) {
  const { THEME } = useTheme();

  if (!tier || score === null) {
    return (
      <span style={{
        display: 'inline-block', padding: '4px 10px', borderRadius: 4,
        fontSize: 10, color: 'var(--color-text-secondary)', background: 'rgba(91,106,113,0.06)',
        fontStyle: 'italic',
      }}>
        Not scored
      </span>
    );
  }

  const config = TIER_CONFIG[tier] || { color: 'var(--color-text-secondary)', bgColor: 'rgba(91,106,113,0.08)', icon: '●' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 4,
        fontSize: 11, fontWeight: 600,
        background: config.bgColor, color: config.color,
      }}>
        <span style={{ fontSize: 10 }}>{config.icon}</span>
        {tier}
      </span>
      <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', paddingLeft: 2 }}>
        {Math.round(score)}/100
      </span>
    </div>
  );
}

// ── AUM Progress Bar Component ───────────────────────────────────────────────
function AumProgressBar({ expected, actual }: { expected: number | null; actual: number | null }) {
  const { THEME } = useTheme();

  if (!expected || !actual) {
    return <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>—</span>;
  }
  const pct = Math.min(Math.round((actual / expected) * 100), 200);
  const displayPct = Math.min(pct, 100); // cap bar at 100%
  const color = pct >= 90 ? THEME.colors.success : pct >= 60 ? THEME.colors.bronze400 : pct >= 30 ? THEME.colors.warning : THEME.colors.error;

  return (
    <div style={{ minWidth: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color }}>{pct}%</span>
        <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{formatAUM(actual)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(91,106,113,0.1)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3, background: color,
          width: `${displayPct}%`, transition: 'width 300ms ease',
        }} />
      </div>
    </div>
  );
}

// ── AUM Tracker types ────────────────────────────────────────────────────────
interface AumAdvisor {
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

// ── AUM Pace Warning Logic ──────────────────────────────────────────────────
// Master Merge:   95% within 14 days
// LPOA:           60% by 30d, 80% by 45d, 90% by 60d
// Repaper:        ~90% by graduation (90 days)

interface PaceTarget {
  days: number;
  expectedPct: number;
}

const PACE_TARGETS: Record<string, PaceTarget[]> = {
  'Master Merge': [
    { days: 14, expectedPct: 95 },
  ],
  'LPOA': [
    { days: 30, expectedPct: 60 },
    { days: 45, expectedPct: 80 },
    { days: 60, expectedPct: 90 },
  ],
  'Repaper': [
    { days: 90, expectedPct: 90 },
  ],
};

type PaceStatus = 'on-track' | 'warning' | 'behind' | 'unknown';

interface PaceResult {
  status: PaceStatus;
  label: string;
  detail: string;
  currentTarget: number | null;
  nextTarget: PaceTarget | null;
}

function evaluatePace(advisor: AumAdvisor): PaceResult {
  const { transition_type, transfer_pct, days_since_launch } = advisor;

  if (!transition_type || days_since_launch === null || transfer_pct === null) {
    return { status: 'unknown', label: '—', detail: 'Insufficient data', currentTarget: null, nextTarget: null };
  }

  // Normalize transition type to match keys
  const typeKey = Object.keys(PACE_TARGETS).find(
    k => transition_type.toLowerCase().includes(k.toLowerCase())
  );

  if (!typeKey) {
    return { status: 'unknown', label: '—', detail: `No pace targets for "${transition_type}"`, currentTarget: null, nextTarget: null };
  }

  const targets = PACE_TARGETS[typeKey];

  // Find the current applicable target (the latest target where days_since_launch >= target.days)
  // and the next upcoming target
  let currentTarget: PaceTarget | null = null;
  let nextTarget: PaceTarget | null = null;

  for (let i = 0; i < targets.length; i++) {
    if (days_since_launch >= targets[i].days) {
      currentTarget = targets[i];
    } else {
      nextTarget = targets[i];
      break;
    }
  }

  // If past all targets, use the final one
  if (!currentTarget && !nextTarget && targets.length > 0) {
    nextTarget = targets[0];
  }

  // If we haven't reached the first target yet, check if we're on pace
  if (!currentTarget && nextTarget) {
    // Interpolate: what % should they be at now based on linear pace to next target?
    const linearExpected = (days_since_launch / nextTarget.days) * nextTarget.expectedPct;
    const delta = transfer_pct - linearExpected;

    if (delta >= -5) {
      return {
        status: 'on-track',
        label: 'On Pace',
        detail: `${transfer_pct}% transferred — ${nextTarget.expectedPct}% target by day ${nextTarget.days}`,
        currentTarget: Math.round(linearExpected),
        nextTarget,
      };
    } else {
      return {
        status: 'warning',
        label: 'Slow Start',
        detail: `${transfer_pct}% transferred — should be ~${Math.round(linearExpected)}% to hit ${nextTarget.expectedPct}% by day ${nextTarget.days}`,
        currentTarget: Math.round(linearExpected),
        nextTarget,
      };
    }
  }

  // We've passed at least one target — check compliance
  if (currentTarget) {
    const delta = transfer_pct - currentTarget.expectedPct;

    if (delta >= -5) {
      // On track or ahead
      const detail = nextTarget
        ? `${transfer_pct}% transferred — next target: ${nextTarget.expectedPct}% by day ${nextTarget.days}`
        : `${transfer_pct}% transferred — meeting ${currentTarget.expectedPct}% target`;

      return {
        status: 'on-track',
        label: 'On Pace',
        detail,
        currentTarget: currentTarget.expectedPct,
        nextTarget,
      };
    } else if (delta >= -15) {
      return {
        status: 'warning',
        label: 'Off Pace',
        detail: `${transfer_pct}% transferred — should be ${currentTarget.expectedPct}% by day ${currentTarget.days}`,
        currentTarget: currentTarget.expectedPct,
        nextTarget,
      };
    } else {
      return {
        status: 'behind',
        label: 'Behind Target',
        detail: `${transfer_pct}% transferred — expected ${currentTarget.expectedPct}% by day ${currentTarget.days} (${Math.abs(delta)}% behind)`,
        currentTarget: currentTarget.expectedPct,
        nextTarget,
      };
    }
  }

  return { status: 'unknown', label: '—', detail: '', currentTarget: null, nextTarget: null };
}

const PACE_STYLES: Record<PaceStatus, { color: string; bg: string; icon: string }> = {
  'on-track': { color: '#27ae60', bg: 'rgba(39,174,96,0.10)', icon: '✓' },
  'warning':  { color: '#e67e22', bg: 'rgba(230,126,34,0.10)', icon: '⚠' },
  'behind':   { color: '#c0392b', bg: 'rgba(192,57,43,0.08)', icon: '▼' },
  'unknown':  { color: '#5b6a71', bg: 'rgba(91,106,113,0.06)', icon: '●' },
};

// ── AUM Tracker Tab Component ───────────────────────────────────────────────
function AumTrackerTab({ advisors, loading }: { advisors: AumAdvisor[]; loading: boolean; search: string }) {
  const { THEME } = useTheme();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)', fontSize: 14 }}>
        Loading AUM data...
      </div>
    );
  }

  if (advisors.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)', fontSize: 14 }}>
        No launched advisors found
      </div>
    );
  }

  // Count pace statuses for summary
  const paceResults = advisors.map(a => ({ advisor: a, pace: evaluatePace(a) }));
  const behindCount = paceResults.filter(r => r.pace.status === 'behind').length;
  const warningCount = paceResults.filter(r => r.pace.status === 'warning').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Pace warning summary bar */}
      {(behindCount > 0 || warningCount > 0) && (
        <div style={{
          display: 'flex', gap: 16, padding: '12px 20px', marginBottom: 8,
          background: behindCount > 0 ? 'rgba(192,57,43,0.05)' : 'rgba(230,126,34,0.05)',
          border: `1px solid ${behindCount > 0 ? 'rgba(192,57,43,0.15)' : 'rgba(230,126,34,0.15)'}`,
          borderRadius: 8, alignItems: 'center',
        }}>
          <span style={{ fontSize: 16 }}>{behindCount > 0 ? '⚠' : '◈'}</span>
          <span style={{ fontSize: 13, color: 'var(--color-text)' }}>
            {behindCount > 0 && <strong style={{ color: '#c0392b' }}>{behindCount} advisor{behindCount > 1 ? 's' : ''} behind target</strong>}
            {behindCount > 0 && warningCount > 0 && ' · '}
            {warningCount > 0 && <span style={{ color: '#e67e22' }}>{warningCount} off pace</span>}
          </span>
        </div>
      )}

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 0.9fr 0.7fr 1fr 1fr 0.6fr 0.7fr 0.8fr 1.1fr',
        gap: 12, padding: '12px 20px',
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'var(--color-text-secondary)', borderBottom: `1px solid ${'var(--color-border)'}`,
      }}>
        <span>Advisor</span>
        <span>Prior Firm</span>
        <span>Type</span>
        <span style={{ textAlign: 'right' }}>Expected AUM</span>
        <span>Transfer Progress</span>
        <span style={{ textAlign: 'center' }}>Days</span>
        <span style={{ textAlign: 'right' }}>Fee BPS</span>
        <span style={{ textAlign: 'right' }}>Current Rev</span>
        <span>Pace Status</span>
      </div>

      {/* Rows */}
      {paceResults.map(({ advisor, pace }) => {
        const paceStyle = PACE_STYLES[pace.status];

        return (
          <div key={advisor.deal_id} style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 0.9fr 0.7fr 1fr 1fr 0.6fr 0.7fr 0.8fr 1.1fr',
            gap: 12, padding: '16px 20px', alignItems: 'center',
            background: 'var(--color-surface)',
            border: `1px solid ${pace.status === 'behind' ? 'rgba(192,57,43,0.2)' : 'var(--color-border)'}`,
            borderRadius: 8,
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#3B5A69';
              e.currentTarget.style.background = 'rgba(78,112,130,0.04)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = pace.status === 'behind' ? 'rgba(192,57,43,0.2)' : 'var(--color-border)';
              e.currentTarget.style.background = 'var(--color-surface)';
            }}
          >
            {/* Advisor Name */}
            <Link href={`/command-center/advisor/${advisor.deal_id}`} style={{ textDecoration: 'none' }}>
              <div>
                <p style={{
                  fontSize: 15, fontWeight: 600, color: 'var(--color-text)',
                  fontFamily: "'Inter', system-ui, sans-serif", cursor: 'pointer',
                }}>
                  {advisor.advisor_name}
                </p>
                {advisor.households && (
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {advisor.households} household{advisor.households !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </Link>

            {/* Prior Firm */}
            <p style={{ fontSize: 13, color: 'var(--color-text)' }}>
              {advisor.prior_firm || '—'}
            </p>

            {/* Transition Type */}
            <div>
              {advisor.transition_type ? (
                <span style={{
                  display: 'inline-block', padding: '3px 8px', borderRadius: 4,
                  fontSize: 10, fontWeight: 600,
                  background: 'rgba(78,112,130,0.08)', color: '#3B5A69',
                  whiteSpace: 'nowrap',
                }}>
                  {advisor.transition_type}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>—</span>
              )}
            </div>

            {/* Expected AUM */}
            <p style={{
              fontSize: 14, fontWeight: 600, color: 'var(--color-text)', textAlign: 'right',
              fontFamily: "'Inter', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums',
            }}>
              {formatAUM(advisor.expected_aum)}
            </p>

            {/* Transfer Progress Bar */}
            <AumProgressBar expected={advisor.expected_aum} actual={advisor.actual_aum} />

            {/* Days Since Launch */}
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              {advisor.days_since_launch !== null ? (
                <span>
                  {advisor.days_since_launch}
                  <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginLeft: 2 }}>d</span>
                </span>
              ) : '—'}
            </p>

            {/* Fee Rate BPS */}
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', textAlign: 'right' }}>
              {advisor.fee_rate_bps != null ? `${advisor.fee_rate_bps}` : '—'}
              {advisor.fee_rate_bps != null && (
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginLeft: 2 }}>bps</span>
              )}
            </p>

            {/* Current Revenue */}
            <p style={{
              fontSize: 13, fontWeight: 600, color: advisor.current_revenue ? THEME.colors.success : 'var(--color-text-secondary)',
              textAlign: 'right', fontFamily: "'Inter', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums',
            }}>
              {advisor.current_revenue ? formatAUM(advisor.current_revenue) : '—'}
            </p>

            {/* Pace Status Badge + Tooltip */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 4,
                fontSize: 11, fontWeight: 600,
                background: paceStyle.bg, color: paceStyle.color,
              }}>
                <span style={{ fontSize: 10 }}>{paceStyle.icon}</span>
                {pace.label}
              </span>
              {pace.detail && pace.status !== 'unknown' && (
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', paddingLeft: 2, lineHeight: 1.3 }}>
                  {pace.detail}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Phase colors for expandable checklist ────────────────────────────────────
const PHASE_CONFIG: Record<Phase, { color: string; bg: string; border: string }> = {
  phase_0: { color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' },
  phase_1: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
  phase_2: { color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.2)' },
  phase_3: { color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
  phase_4: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  phase_5: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  phase_6: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  phase_7: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
};

interface ChecklistTask {
  id: string; label: string; phase: Phase; owner: string; timing: string; is_hard_gate: boolean;
  resources: string | null; completed: boolean; completed_by: string | null; completed_at: string | null;
  notes: string | null; due_date: string | null;
  responsible_person: { name: string; email: string; role: string } | null;
  countdown_display: string; days_remaining: number | null;
  status: 'upcoming' | 'due_soon' | 'overdue' | 'critical' | 'completed' | 'no_due_date';
}

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  upcoming: { color: '#5b6a71', bg: 'rgba(91,106,113,0.08)', border: 'rgba(91,106,113,0.15)' },
  due_soon: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
  overdue: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
  critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.2)', border: 'rgba(220,38,38,0.4)' },
  completed: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
  no_due_date: { color: '#5b6a71', bg: 'rgba(91,106,113,0.08)', border: 'rgba(91,106,113,0.15)' },
};

// ── Expandable Checklist Panel ──────────────────────────────────────────────
function ExpandableChecklist({ dealId }: { dealId: string }) {
  const { THEME } = useTheme();
  const { data, error, isLoading, mutate } = useSWR<
    { dealId: string; tasks: ChecklistTask[] } | { error: string; details?: string }
  >(
    `/api/command-center/checklist/${dealId}`, fetcher
  );
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [toggling, setToggling] = useState<string | null>(null);

  const togglePhase = (phase: string) => setCollapsedPhases(prev => ({ ...prev, [phase]: !prev[phase] }));

  const handleToggle = useCallback(async (taskId: string, currentCompleted: boolean) => {
    if (!data || 'error' in data) return;
    setToggling(taskId);
    const newCompleted = !currentCompleted;
    // Optimistic update
    mutate(
      { ...data, tasks: data.tasks.map(t => t.id === taskId ? { ...t, completed: newCompleted, completed_by: newCompleted ? 'you' : null, completed_at: newCompleted ? new Date().toISOString() : null, status: newCompleted ? 'completed' as const : 'upcoming' as const } : t) },
      false
    );
    try {
      await fetch(`/api/command-center/checklist/${dealId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed: newCompleted }),
      });
      mutate();
      // Also refresh the task summary counts in the parent
      globalMutate('/api/command-center/tasks/summary');
    } catch { mutate(); }
    setToggling(null);
  }, [data, dealId, mutate]);

  if (isLoading) {
    return (
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map(i => <div key={i} style={{ height: 40, borderRadius: 8, background: 'rgba(91,106,113,0.06)', animation: 'shimmer 1.5s infinite' }} />)}
      </div>
    );
  }
  // Type guard: check if data is an error response
  if (error || !data || 'error' in data) {
    const errorMsg = data && 'error' in data ? (data.details || data.error) : 'Failed to load tasks';
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
        Failed to load tasks
        {errorMsg && (
          <div style={{ fontSize: 11, marginTop: 8, color: '#ef4444' }}>
            {errorMsg}
          </div>
        )}
      </div>
    );
  }

  // Type guard: check if tasks array exists
  if (!data.tasks || !Array.isArray(data.tasks)) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
        No tasks available
      </div>
    );
  }

  const tasks = data.tasks;
  const totalCompleted = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const pctComplete = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const overdueCount = tasks.filter(t => !t.completed && (t.status === 'overdue' || t.status === 'critical')).length;

  const phases: { key: Phase; tasks: ChecklistTask[] }[] = PHASE_ORDER.map(phaseKey => ({
    key: phaseKey,
    tasks: tasks.filter(t => t.phase === phaseKey),
  }));

  return (
    <div style={{
      padding: '16px 20px 20px',
      borderTop: `1px solid ${'var(--color-border)'}`,
      background: 'rgba(91,106,113,0.02)',
    }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: 'var(--color-surface)', border: `1px solid ${'var(--color-border)'}` }}>
        {/* Mini progress ring */}
        <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke={'var(--color-border)'} strokeWidth="3" />
            <circle cx="20" cy="20" r="16" fill="none" stroke="#f59e0b" strokeWidth="3"
              strokeDasharray={`${(pctComplete / 100) * 100.5} 100.5`}
              strokeLinecap="round" transform="rotate(-90 20 20)" style={{ transition: 'stroke-dasharray 0.4s ease' }} />
          </svg>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>{pctComplete}%</span>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{totalCompleted}/{totalTasks} tasks</p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            {overdueCount > 0 ? <span style={{ color: '#ef4444', fontWeight: 600 }}>{overdueCount} overdue</span> : 'On track'}
          </p>
        </div>
        {/* Phase mini indicators */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {phases.filter(p => p.tasks.length > 0).map(p => {
            const cfg = PHASE_CONFIG[p.key];
            const done = p.tasks.filter(t => t.completed).length;
            const allDone = done === p.tasks.length;
            return (
              <span key={p.key} style={{
                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                background: allDone ? 'rgba(16,185,129,0.1)' : cfg.bg, color: allDone ? '#10b981' : cfg.color,
              }}>
                P{p.key.replace('phase_', '')} {done}/{p.tasks.length}
              </span>
            );
          })}
        </div>
      </div>

      {/* Phase sections */}
      {phases.filter(p => p.tasks.length > 0).map(p => {
        const cfg = PHASE_CONFIG[p.key];
        const done = p.tasks.filter(t => t.completed).length;
        const phasePct = p.tasks.length > 0 ? Math.round((done / p.tasks.length) * 100) : 0;
        const isCollapsed = collapsedPhases[p.key] ?? true; // Collapsed by default

        return (
          <div key={p.key} style={{ marginBottom: 8, borderRadius: 8, border: `1px solid ${cfg.border}`, overflow: 'hidden', background: 'var(--color-surface)' }}>
            {/* Phase header */}
            <button onClick={() => togglePhase(p.key)} style={{
              width: '100%', padding: '10px 16px', background: cfg.bg, border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 12, color: cfg.color, transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {PHASES[p.key].label}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{done}/{p.tasks.length}</span>
              <div style={{ flex: 1, height: 4, background: 'rgba(91,106,113,0.08)', borderRadius: 2, overflow: 'hidden', marginLeft: 4 }}>
                <div style={{ height: '100%', width: `${phasePct}%`, background: cfg.color, borderRadius: 2, transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, minWidth: 32, textAlign: 'right' }}>{phasePct}%</span>
            </button>

            {/* Task rows */}
            {!isCollapsed && (
              <div style={{ padding: '4px 0' }}>
                {p.tasks.map((task, ti) => {
                  const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.no_due_date;
                  return (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
                      borderBottom: ti < p.tasks.length - 1 ? `1px solid ${'var(--color-border)'}` : 'none',
                      opacity: toggling === task.id ? 0.6 : 1, transition: 'opacity 0.15s',
                    }}>
                      {/* Checkbox */}
                      <button onClick={() => handleToggle(task.id, task.completed)} style={{
                        width: 20, height: 20, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                        border: `2px solid ${task.completed ? cfg.color : 'rgba(91,106,113,0.3)'}`,
                        background: task.completed ? cfg.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}>
                        {task.completed && <span style={{ fontSize: 12, color: '#fff', lineHeight: 1 }}>✓</span>}
                      </button>

                      {/* Label */}
                      <span style={{
                        flex: 1, fontSize: 12, color: task.completed ? 'var(--color-text-secondary)' : 'var(--color-text)',
                        textDecoration: task.completed ? 'line-through' : 'none',
                        textDecorationColor: 'rgba(91,106,113,0.4)',
                      }}>
                        {task.label}
                      </span>

                      {/* Owner badge */}
                      <span style={{
                        fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
                        background: 'rgba(91,106,113,0.08)', color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                      }}>
                        {task.owner}
                      </span>

                      {/* Resource link icon */}
                      {task.resources && (
                        <a
                          href={task.resources}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                            background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                            fontSize: 12, textDecoration: 'none',
                            transition: 'background 0.15s ease',
                          }}
                          title="Open resource"
                        >
                          ↗
                        </a>
                      )}

                      {/* Status badge */}
                      {!task.completed && task.status !== 'no_due_date' && (
                        <span style={{
                          fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
                          background: statusStyle.bg, color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                        }}>
                          {task.countdown_display}
                        </span>
                      )}

                      {/* Hard gate indicator */}
                      {!task.is_hard_gate && (
                        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 3, background: 'rgba(91,106,113,0.06)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                          Optional
                        </span>
                      )}

                      {/* Completed date */}
                      {task.completed && task.completed_at && (
                        <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Advisor Tasks Tab Component ──────────────────────────────────────────────
function AdvisorTasksTab() {
  const { THEME } = useTheme();
  const { data } = useSWR('/api/command-center/pipeline', fetcher, SWR_OPTS);
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<Phase | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Get list of launched advisors from deals data
  const advisors = useMemo(() => {
    if (!data?.deals) return [];
    return (data.deals as Deal[])
      .filter(d => d.dealstage === '100411705') // Launched only
      .filter(d => !d.dealname?.toLowerCase().includes('test'))
      .sort((a, b) => (a.dealname ?? '').localeCompare(b.dealname ?? ''));
  }, [data]);

  // Get tasks from TASKS array that are advisor-visible (owner = 'Advisor')
  const advisorTasks = useMemo(() => {
    return TASKS.filter(t => t.owner === 'Advisor');
  }, []);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    let tasks = advisorTasks;
    if (selectedPhase !== 'all') {
      tasks = tasks.filter(t => t.phase === selectedPhase);
    }
    return tasks;
  }, [advisorTasks, selectedPhase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        {/* Advisor filter */}
        <select
          value={selectedAdvisor}
          onChange={e => setSelectedAdvisor(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: 8, border: `1px solid ${'var(--color-border)'}`,
            fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)',
            cursor: 'pointer', outline: 'none', flex: 1,
          }}
        >
          <option value="all">All Advisors</option>
          {advisors.map(a => (
            <option key={a.id} value={a.id}>{a.dealname}</option>
          ))}
        </select>

        {/* Phase filter */}
        <select
          value={selectedPhase}
          onChange={e => setSelectedPhase(e.target.value as Phase | 'all')}
          style={{
            padding: '8px 12px', borderRadius: 8, border: `1px solid ${'var(--color-border)'}`,
            fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)',
            cursor: 'pointer', outline: 'none', minWidth: 180,
          }}
        >
          <option value="all">All Phases</option>
          {PHASE_ORDER.map(phaseKey => (
            <option key={phaseKey} value={phaseKey}>{PHASES[phaseKey].label}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | 'pending' | 'completed')}
          style={{
            padding: '8px 12px', borderRadius: 8, border: `1px solid ${'var(--color-border)'}`,
            fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)',
            cursor: 'pointer', outline: 'none', minWidth: 140,
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Summary */}
      <div style={{
        padding: '16px 20px', background: 'rgba(59,90,105,0.05)',
        border: `1px solid ${'var(--color-border)'}`, borderRadius: 8,
      }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Total Advisor Tasks
            </p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#3B5A69', fontFamily: "'Inter', system-ui, sans-serif" }}>
              {filteredTasks.length}
            </p>
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {advisors.length} launched advisor{advisors.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Tasks list */}
      {filteredTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)', fontSize: 14 }}>
          No advisor tasks found for the selected filters
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredTasks.map(task => {
            const phase = PHASES[task.phase];
            return (
              <div
                key={task.id}
                style={{
                  padding: '16px 20px', background: 'var(--color-surface)',
                  border: `1px solid ${'var(--color-border)'}`, borderRadius: 8,
                  transition: 'border-color 150ms ease, box-shadow 150ms ease',
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* Phase badge */}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 4,
                    background: 'rgba(59,90,105,0.1)', color: '#3B5A69',
                    textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>
                    {phase.label.replace('Phase ', 'P')}
                  </span>

                  {/* Task info */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                      {task.label}
                    </p>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      <span>Timing: {task.timing}</span>
                      {task.is_hard_gate && (
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>★ Hard Gate</span>
                      )}
                    </div>
                  </div>

                  {/* Resource link */}
                  {task.resources && (
                    <a
                      href={task.resources}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                        background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                        fontSize: 14, textDecoration: 'none',
                        transition: 'background 0.15s ease',
                      }}
                      title="View resources"
                    >
                      ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdvisorHubPage() {
  const { THEME } = useTheme();
  const STAGE_COLORS = useMemo(() => getStageColors(), []);
  const { data, isLoading, error } = useSWR('/api/command-center/pipeline', fetcher, SWR_OPTS);
  const { data: sentimentData, mutate: mutateSentiment } = useSWR('/api/command-center/sentiment/scores', fetcher, SWR_OPTS);
  const { data: aumData, isLoading: aumLoading } = useSWR('/api/command-center/aum-tracker', fetcher, SWR_OPTS);
  const { data: taskSummaryData } = useSWR('/api/command-center/tasks/summary', fetcher, SWR_OPTS);
  const { data: alertsData } = useSWR('/api/command-center/alerts', fetcher, SWR_OPTS);
  const { data: graduationsData } = useSWR('/api/command-center/graduations', fetcher, SWR_OPTS);
  const [activeTab, setActiveTab] = useState<TabKey>('launch');
  const [search, setSearch] = useState('');
  const [scoring, setScoring] = useState<Record<string, boolean>>({});
  const [sortCol, setSortCol] = useState<string>('dealname');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [transitionFilter, setTransitionFilter] = useState('all');
  const [aumTierFilter, setAumTierFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [taskPhaseFilter, setTaskPhaseFilter] = useState('all');
  const [alertFilter, setAlertFilter] = useState('all');
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);

  // Build maps for task summary + alerts per deal
  const taskMap = useMemo(() => {
    return (taskSummaryData?.summary ?? {}) as Record<string, { open_tasks: number; completed_tasks: number; total_tasks: number; current_phase: string | null }>;
  }, [taskSummaryData]);

  const alertMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (alertsData?.alerts) {
      for (const a of alertsData.alerts) {
        if (a.deal_id) map[a.deal_id] = (map[a.deal_id] ?? 0) + 1;
      }
    }
    return map;
  }, [alertsData]);

  // Build a map of deal_id → sentiment score
  const sentimentMap = useMemo(() => {
    const map: Record<string, SentimentScore> = {};
    if (sentimentData?.scores) {
      for (const s of sentimentData.scores) {
        map[s.deal_id] = s;
      }
    }
    return map;
  }, [sentimentData]);

  // Set of deal IDs that have been graduated early
  const graduatedSet = useMemo(() => {
    const set = new Set<string>();
    if (graduationsData?.dealIds) {
      for (const id of graduationsData.dealIds) set.add(id);
    }
    return set;
  }, [graduationsData]);

  const { launchDeals, earlyDeals, completedDeals } = useMemo(() => {
    if (!data?.deals) return { launchDeals: [], earlyDeals: [], completedDeals: [] };
    const deals = (data.deals as Deal[]).filter(d => !d.dealname?.toLowerCase().includes('test'));

    const early = deals.filter(d => EARLY_STAGE_IDS.includes(d.dealstage));

    // Launch to Graduation: Steps 5-6 (all), Step 7 only if launched within 90 days AND not graduated
    const launch = deals.filter(d => {
      if (!LAUNCH_STAGE_IDS.includes(d.dealstage)) return false;
      if (d.dealstage === LAUNCHED_STAGE_ID) {
        if (graduatedSet.has(d.id)) return false; // graduated → goes to completed
        return d.daysSinceLaunch !== null && d.daysSinceLaunch <= GRADUATION_DAYS;
      }
      return true;
    });

    // Completed Transitions: Launched advisors > 90 days, launched with no date set, OR graduated early
    const completed = deals.filter(d => {
      if (d.dealstage !== LAUNCHED_STAGE_ID) return false;
      if (graduatedSet.has(d.id)) return true; // graduated early → always completed
      if (d.daysSinceLaunch === null) return true;
      return d.daysSinceLaunch > GRADUATION_DAYS;
    });

    return {
      launchDeals: sortByLastName(launch),
      earlyDeals: sortByLastName(early),
      completedDeals: sortByLastName(completed),
    };
  }, [data, graduatedSet]);

  const currentDeals = useMemo(() => {
    if (activeTab === 'aum') return [];
    let pool = activeTab === 'launch' ? launchDeals : activeTab === 'early' ? earlyDeals : completedDeals;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      pool = pool.filter(d =>
        d.dealname?.toLowerCase().includes(q) ||
        d.current_firm__cloned_?.toLowerCase().includes(q) ||
        d.ownerName?.toLowerCase().includes(q)
      );
    }

    // Transition type filter
    if (transitionFilter !== 'all') {
      pool = pool.filter(d => d.transition_type === transitionFilter);
    }

    // AUM tier filter
    if (aumTierFilter !== 'all') {
      pool = pool.filter(d => {
        const aum = parseFloat(d.transferable_aum ?? '0') || 0;
        if (aumTierFilter === '0-50') return aum < 50_000_000;
        if (aumTierFilter === '50-100') return aum >= 50_000_000 && aum < 100_000_000;
        if (aumTierFilter === '100-200') return aum >= 100_000_000 && aum < 200_000_000;
        if (aumTierFilter === '200+') return aum >= 200_000_000;
        return true;
      });
    }

    // Sentiment filter
    if (sentimentFilter !== 'all') {
      pool = pool.filter(d => {
        const s = sentimentMap[d.id];
        if (sentimentFilter === 'unscored') return !s;
        return s?.tier === sentimentFilter;
      });
    }

    // Task phase filter
    if (taskPhaseFilter !== 'all') {
      pool = pool.filter(d => taskMap[d.id]?.current_phase === taskPhaseFilter);
    }

    // Alert filter
    if (alertFilter !== 'all') {
      pool = pool.filter(d => {
        const count = alertMap[d.id] ?? 0;
        return alertFilter === 'has_alerts' ? count > 0 : count === 0;
      });
    }

    // Sort
    return [...pool].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortCol === 'dealname') return (a.dealname ?? '').localeCompare(b.dealname ?? '') * dir;
      if (sortCol === 'firm') return (a.current_firm__cloned_ ?? '').localeCompare(b.current_firm__cloned_ ?? '') * dir;
      if (sortCol === 'aum') return ((parseFloat(a.transferable_aum ?? '0') || 0) - (parseFloat(b.transferable_aum ?? '0') || 0)) * dir;
      if (sortCol === 'stage') return (STAGE_LABELS[a.dealstage] ?? '').localeCompare(STAGE_LABELS[b.dealstage] ?? '') * dir;
      if (sortCol === 'sentiment') {
        const sa = sentimentMap[a.id]?.composite_score ?? -1;
        const sb = sentimentMap[b.id]?.composite_score ?? -1;
        return (sa - sb) * dir;
      }
      if (sortCol === 'date') {
        const da = a.desired_start_date ?? a.actual_launch_date ?? '';
        const db = b.desired_start_date ?? b.actual_launch_date ?? '';
        return da.localeCompare(db) * dir;
      }
      if (sortCol === 'tasks') return ((taskMap[a.id]?.open_tasks ?? 0) - (taskMap[b.id]?.open_tasks ?? 0)) * dir;
      if (sortCol === 'alerts') return ((alertMap[a.id] ?? 0) - (alertMap[b.id] ?? 0)) * dir;
      if (sortCol === 'recruiter') return (a.ownerName ?? '').localeCompare(b.ownerName ?? '') * dir;
      return 0;
    });
  }, [activeTab, launchDeals, earlyDeals, completedDeals, search, transitionFilter, aumTierFilter, sentimentFilter, sentimentMap, sortCol, sortDir]);

  // Filtered AUM advisors
  const filteredAumAdvisors = useMemo(() => {
    if (!aumData?.advisors) return [];
    const advisors = (aumData.advisors as AumAdvisor[]).filter(a => !a.advisor_name?.toLowerCase().includes('test'));
    if (!search.trim()) return advisors;
    const q = search.toLowerCase();
    return advisors.filter(a =>
      a.advisor_name?.toLowerCase().includes(q) ||
      a.prior_firm?.toLowerCase().includes(q)
    );
  }, [aumData, search]);

  // Score a single advisor
  const scoreAdvisor = useCallback(async (dealId: string) => {
    setScoring(prev => ({ ...prev, [dealId]: true }));
    try {
      await fetch('/api/command-center/sentiment/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      });
      mutateSentiment();
    } catch (err) {
      console.error('Scoring failed:', err);
    } finally {
      setScoring(prev => ({ ...prev, [dealId]: false }));
    }
  }, [mutateSentiment]);

  // Score all advisors in current tab
  const [batchScoring, setBatchScoring] = useState(false);
  const scoreAll = useCallback(async () => {
    const deals = activeTab === 'launch' ? launchDeals : completedDeals;
    if (deals.length === 0) return;
    setBatchScoring(true);
    try {
      // Score sequentially to avoid rate limits
      for (const deal of deals) {
        setScoring(prev => ({ ...prev, [deal.id]: true }));
        try {
          await fetch('/api/command-center/sentiment/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dealId: deal.id }),
          });
        } catch {
          // Continue scoring others even if one fails
        }
        setScoring(prev => ({ ...prev, [deal.id]: false }));
      }
      mutateSentiment();
    } finally {
      setBatchScoring(false);
    }
  }, [activeTab, launchDeals, completedDeals, mutateSentiment]);

  // Show sentiment column for launch and completed tabs
  const showSentiment = activeTab === 'launch' || activeTab === 'completed';
  const gridCols = showSentiment
    ? '1.6fr 1fr 0.7fr 0.9fr 0.7fr 0.7fr 0.8fr 0.8fr 0.8fr'
    : '1.8fr 1.2fr 0.8fr 1fr 0.7fr 0.7fr 0.9fr 0.9fr';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '40px 48px', maxWidth: '100vw', overflowX: 'hidden', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-light.png"
          alt=""
          className="hidden dark:block"
          style={{ position: 'absolute', top: 0, right: 0, opacity: 0.5, width: '120px', height: 'auto' }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-dark.png"
          alt=""
          className="block dark:hidden"
          style={{ position: 'absolute', top: 0, right: 0, opacity: 0.5, width: '120px', height: 'auto' }}
        />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-text)', fontFamily: "'Inter', system-ui, sans-serif", marginBottom: 6 }}>
            Advisor Hub
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Full directory of advisors across all pipeline stages
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Launch to Graduation', value: String(launchDeals.length), sub: undefined, color: '#3B5A69', icon: '▲' },
          { label: 'Early Deals', value: String(earlyDeals.length), sub: undefined, color: '#4383b4', icon: '◈' },
          { label: 'Completed Transitions', value: String(completedDeals.length), sub: undefined, color: THEME.colors.success, icon: '✓' },
        ].map(card => (
          <div key={card.label} style={{
            background: 'var(--color-surface)', border: `1px solid ${'var(--color-border)'}`, borderRadius: 8,
            padding: '20px 24px', position: 'relative',
          }}>
            <span style={{ position: 'absolute', top: 16, right: 18, fontSize: 20, opacity: 0.25, color: card.color }}>
              {card.icon}
            </span>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {card.label}
            </p>
            <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', fontFamily: "'Inter', system-ui, sans-serif" }}>
              {card.value}
            </p>
            {card.sub && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{card.sub}</p>}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {(() => {
          const advisors = (aumData?.advisors ?? []) as AumAdvisor[];
          let totalExpectedRevenue = 0;
          for (const adv of advisors) {
            if (adv.expected_aum && adv.fee_rate_bps && adv.fee_rate_bps > 0) {
              totalExpectedRevenue += adv.expected_aum * (adv.fee_rate_bps / 10000);
            }
          }
          const realizedPct = totalExpectedRevenue > 0 && aumData?.summary?.total_current_revenue
            ? Math.round((aumData.summary.total_current_revenue / totalExpectedRevenue) * 100)
            : null;
          return [
            {
              label: 'AUM Transfer Rate',
              value: aumData?.summary?.overall_transfer_pct != null ? `${aumData.summary.overall_transfer_pct}%` : '—',
              sub: aumData?.summary ? `${formatAUM(aumData.summary.total_actual_aum)} of ${formatAUM(aumData.summary.total_expected_aum)}` : undefined,
              color: THEME.colors.bronze400, icon: '◎',
            },
            {
              label: 'On Book Revenue',
              value: aumData?.summary?.total_current_revenue ? formatAUM(aumData.summary.total_current_revenue) : '—',
              sub: aumData?.summary?.advisors_with_actual ? `${aumData.summary.advisors_with_actual} advisor${aumData.summary.advisors_with_actual > 1 ? 's' : ''} reporting` : undefined,
              color: THEME.colors.success, icon: '$',
            },
            {
              label: 'Expected Revenue',
              value: totalExpectedRevenue > 0 ? formatAUM(Math.round(totalExpectedRevenue)) : '—',
              sub: realizedPct != null ? `${realizedPct}% realized` : 'At full AUM transfer',
              color: THEME.colors.bronze400, icon: '★',
            },
          ];
        })().map(card => (
          <div key={card.label} style={{
            background: 'var(--color-surface)', border: `1px solid ${'var(--color-border)'}`, borderRadius: 8,
            padding: '20px 24px', position: 'relative',
          }}>
            <span style={{ position: 'absolute', top: 16, right: 18, fontSize: 20, opacity: 0.25, color: card.color }}>
              {card.icon}
            </span>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {card.label}
            </p>
            <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', fontFamily: "'Inter', system-ui, sans-serif" }}>
              {card.value}
            </p>
            {card.sub && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs + Search + Score All */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${'var(--color-border)'}` }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = tab.key === 'launch' ? launchDeals.length : tab.key === 'early' ? earlyDeals.length : tab.key === 'completed' ? completedDeals.length : tab.key === 'aum' ? (aumData?.total ?? 0) : 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '12px 24px', fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#3B5A69' : 'var(--color-text-secondary)', background: 'none', border: 'none',
                  borderBottom: isActive ? `2px solid ${'#3B5A69'}` : '2px solid transparent',
                  marginBottom: -2, cursor: 'pointer',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  transition: 'color 150ms ease, border-color 150ms ease',
                }}
              >
                <span style={{ marginRight: 6, fontSize: 11 }}>{tab.icon}</span>
                {tab.label}
                <span style={{
                  marginLeft: 8, fontSize: 11, fontWeight: 600,
                  padding: '2px 8px', borderRadius: 10,
                  background: isActive ? 'rgba(78,112,130,0.1)' : 'rgba(91,106,113,0.08)',
                  color: isActive ? '#3B5A69' : 'var(--color-text-secondary)',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {showSentiment && (
            <button
              onClick={scoreAll}
              disabled={batchScoring}
              style={{
                padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                background: batchScoring ? 'var(--color-border)' : '#3B5A69', color: "#FFFFFF",
                border: 'none', cursor: batchScoring ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', system-ui, sans-serif",
                transition: 'background 150ms ease',
              }}
            >
              {batchScoring ? 'Scoring...' : '✦ Score All Sentiment'}
            </button>
          )}
          <input
            type="text"
            placeholder="Search advisors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: 240, padding: '10px 16px', fontSize: 13, borderRadius: 8,
              border: `1px solid ${'var(--color-border)'}`, background: 'var(--color-surface)', color: 'var(--color-text)',
              fontFamily: "'Inter', system-ui, sans-serif",
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* ── Filter Dropdowns ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Transition Type */}
        <select value={transitionFilter} onChange={e => setTransitionFilter(e.target.value)} style={{
          padding: '8px 12px', borderRadius: 8, border: `1px solid ${'var(--color-border)'}`,
          fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', outline: 'none',
        }}>
          <option value="all">All Merge Types</option>
          {(() => {
            const pool = activeTab === 'launch' ? launchDeals : activeTab === 'early' ? earlyDeals : completedDeals;
            const types = Array.from(new Set(pool.map(d => d.transition_type).filter(Boolean))) as string[];
            return types.sort().map(t => <option key={t} value={t}>{t}</option>);
          })()}
        </select>

        {/* AUM Tier */}
        <select value={aumTierFilter} onChange={e => setAumTierFilter(e.target.value)} style={{
          padding: '8px 12px', borderRadius: 8, border: `1px solid ${'var(--color-border)'}`,
          fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', outline: 'none',
        }}>
          <option value="all">All AUM Tiers</option>
          <option value="0-50">$0 - $50M</option>
          <option value="50-100">$50M - $100M</option>
          <option value="100-200">$100M - $200M</option>
          <option value="200+">$200M+</option>
        </select>

        {/* Sentiment */}
        {showSentiment && (
          <select value={sentimentFilter} onChange={e => setSentimentFilter(e.target.value)} style={{
            padding: '8px 12px', borderRadius: 8, border: `1px solid ${'var(--color-border)'}`,
            fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', outline: 'none',
          }}>
            <option value="all">All Sentiment</option>
            <option value="Advocate">Advocate</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="At Risk">At Risk</option>
            <option value="High Risk">High Risk</option>
            <option value="unscored">Not Scored</option>
          </select>
        )}

        {/* Task Phase */}
        <select value={taskPhaseFilter} onChange={e => setTaskPhaseFilter(e.target.value)} style={{
          padding: '8px 12px', borderRadius: 8, border: `1px solid ${'var(--color-border)'}`,
          fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', outline: 'none',
        }}>
          <option value="all">All Task Phases</option>
          <option value="phase_0">Phase 0 - Sales Handoff</option>
          <option value="phase_1">Phase 1 - Post-Signing</option>
          <option value="phase_2">Phase 2 - Kick-Off</option>
          <option value="phase_3">Phase 3 - Pre-Launch</option>
          <option value="phase_4">Phase 4 - Final Countdown</option>
          <option value="phase_5">Phase 5 - Launch Day</option>
          <option value="phase_6">Phase 6 - Active Transition</option>
          <option value="phase_7">Phase 7 - Graduation</option>
        </select>

        {/* Open Alerts */}
        <select value={alertFilter} onChange={e => setAlertFilter(e.target.value)} style={{
          padding: '8px 12px', borderRadius: 8, border: `1px solid ${'var(--color-border)'}`,
          fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', outline: 'none',
        }}>
          <option value="all">All Alerts</option>
          <option value="has_alerts">Has Alerts</option>
          <option value="no_alerts">No Alerts</option>
        </select>

        {/* Result count */}
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: '8px 0', marginLeft: 'auto' }}>
          {currentDeals.length} advisor{currentDeals.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Loading / Error */}
      {isLoading && activeTab !== 'aum' && activeTab !== 'advisor-tasks' && (
        <div className="px-4 py-4 space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="shimmer h-16 rounded-lg" />)}
        </div>
      )}
      {error && activeTab !== 'aum' && activeTab !== 'advisor-tasks' && (
        <div style={{ textAlign: 'center', padding: 60, color: THEME.colors.error, fontSize: 14 }}>
          Failed to load pipeline data
        </div>
      )}

      {/* ═══════ AUM TRACKER TAB ═══════ */}
      {activeTab === 'aum' && (
        <AumTrackerTab advisors={filteredAumAdvisors} loading={aumLoading} search={search} />
      )}

      {/* ═══════ ADVISOR TASKS TAB ═══════ */}
      {activeTab === 'advisor-tasks' && (
        <AdvisorTasksTab />
      )}

      {/* ═══════ PIPELINE TABS (Launch / Early / Completed) ═══════ */}
      {activeTab !== 'aum' && activeTab !== 'advisor-tasks' && !isLoading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Table header — sortable */}
          {(() => {
            const handleSort = (col: string) => {
              if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
              else { setSortCol(col); setSortDir('asc'); }
            };
            const arrow = (col: string) => sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';
            const cols = [
              { key: 'dealname', label: 'Advisor' },
              { key: 'firm', label: 'Current Firm' },
              { key: 'aum', label: 'AUM', align: 'right' as const },
              { key: 'stage', label: 'Stage' },
              ...(showSentiment ? [{ key: 'sentiment', label: 'Sentiment' }] : []),
              { key: 'tasks', label: 'Tasks' },
              { key: 'alerts', label: 'Alerts' },
              { key: 'date', label: activeTab === 'completed' ? 'Launched' : 'Target Date' },
              { key: 'recruiter', label: 'Recruiter' },
            ];
            return (
              <div style={{
                display: 'grid', gridTemplateColumns: gridCols,
                gap: 16, padding: '12px 20px',
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--color-text-secondary)', borderBottom: `1px solid ${'var(--color-border)'}`,
              }}>
                {cols.map(col => (
                  <span
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{ cursor: 'pointer', userSelect: 'none', textAlign: col.align }}
                  >
                    {col.label}{arrow(col.key)}
                  </span>
                ))}
              </div>
            );
          })()}

          {currentDeals.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)', fontSize: 14 }}>
              {search ? 'No advisors match your search' : 'No advisors in this category'}
            </div>
          )}

          {currentDeals.map(deal => {
            const stageColor = STAGE_COLORS[deal.dealstage] ?? 'var(--color-text-secondary)';
            const stageLabel = STAGE_LABELS[deal.dealstage] ?? deal.dealstage;
            const shortStage = stageLabel.replace(/Step \d+ – /, '');
            const aum = deal.transferable_aum ? Number(deal.transferable_aum) : null;
            const dateVal = activeTab === 'completed'
              ? (deal.actual_launch_date || deal.desired_start_date)
              : deal.desired_start_date;
            const sentiment = sentimentMap[deal.id];
            const isScoring = scoring[deal.id];
            const isExpanded = expandedDealId === deal.id;

            return (
              <div key={deal.id} style={{
                borderRadius: 8, overflow: 'hidden',
                border: `1px solid ${isExpanded ? '#3B5A69' : 'var(--color-border)'}`,
                background: 'var(--color-surface)',
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
              }}>
                {/* Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: gridCols,
                  gap: 16, padding: '16px 20px', alignItems: 'center',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => {
                    if (!isExpanded) e.currentTarget.style.background = 'rgba(78,112,130,0.04)';
                  }}
                  onMouseLeave={e => {
                    if (!isExpanded) e.currentTarget.style.background = '';
                  }}
                  onClick={() => setExpandedDealId(isExpanded ? null : deal.id)}
                >
                  {/* Name — clickable link + expand chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 12, color: 'var(--color-text-secondary)', flexShrink: 0,
                      transition: 'transform 0.2s ease',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}>
                      ▶
                    </span>
                    <Link href={`/command-center/advisor/${deal.id}`} style={{ textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', fontFamily: "'Inter', system-ui, sans-serif", cursor: 'pointer' }}>
                          {deal.dealname || '—'}
                        </p>
                        {deal.firm_type && (
                          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{deal.firm_type}</p>
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* Current Firm */}
                  <p style={{ fontSize: 13, color: 'var(--color-text)' }}>
                    {deal.current_firm__cloned_ || '—'}
                  </p>

                  {/* AUM */}
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', textAlign: 'right', fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {formatAUM(aum)}
                  </p>

                  {/* Stage Badge */}
                  <div>
                    <span style={{
                      display: 'inline-block', padding: '4px 10px', borderRadius: 4,
                      fontSize: 11, fontWeight: 600,
                      background: `${stageColor}18`, color: stageColor,
                    }}>
                      {shortStage}
                    </span>
                    {activeTab === 'launch' && deal.daysSinceLaunch !== null && (
                      <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 3 }}>
                        Day {deal.daysSinceLaunch}
                      </p>
                    )}
                    {activeTab === 'completed' && deal.daysSinceLaunch !== null && (
                      <p style={{ fontSize: 10, color: THEME.colors.success, marginTop: 3 }}>
                        {deal.daysSinceLaunch} days
                      </p>
                    )}
                  </div>

                  {/* Sentiment — only for launch & completed tabs */}
                  {showSentiment && (
                    <div onClick={e => e.stopPropagation()}>
                      {isScoring ? (
                        <span style={{ fontSize: 11, color: '#3B5A69', fontStyle: 'italic' }}>
                          Analyzing...
                        </span>
                      ) : sentiment ? (
                        <SentimentBadge
                          score={Number(sentiment.composite_score)}
                          tier={sentiment.tier}
                        />
                      ) : (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); scoreAdvisor(deal.id); }}
                          style={{
                            padding: '4px 10px', fontSize: 10, fontWeight: 600,
                            borderRadius: 4, border: `1px solid ${'var(--color-border)'}`,
                            background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer',
                            fontFamily: "'Inter', system-ui, sans-serif",
                            transition: 'color 150ms ease, border-color 150ms ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#3B5A69'; e.currentTarget.style.borderColor = '#3B5A69'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                        >
                          ✦ Score
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tasks */}
                  {(() => {
                    const t = taskMap[deal.id];
                    if (!t) return <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>—</span>;
                    const phaseLabel = t.current_phase ? t.current_phase.replace('phase_', 'P') : '—';
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: t.open_tasks > 0 ? THEME.colors.warning : THEME.colors.success }}>
                          {t.open_tasks} open
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                          {phaseLabel} · {t.completed_tasks}/{t.total_tasks}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Alerts */}
                  {(() => {
                    const count = alertMap[deal.id] ?? 0;
                    if (count === 0) return <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>—</span>;
                    return (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: THEME.colors.errorBg, color: THEME.colors.error,
                      }}>
                        {count}
                      </span>
                    );
                  })()}

                  {/* Date */}
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    {formatDate(dateVal)}
                  </p>

                  {/* Recruiter */}
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    {deal.ownerName || '—'}
                  </p>
                </div>

                {/* Expanded checklist panel */}
                {isExpanded && <ExpandableChecklist dealId={deal.id} />}
              </div>
            );
          })}
        </div>
      )}

      {/* Total footer */}
      {activeTab !== 'aum' && activeTab !== 'advisor-tasks' && !isLoading && !error && data?.deals && (
        <div style={{
          marginTop: 24, padding: '12px 20px',
          fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'right',
          borderTop: `1px solid ${'var(--color-border)'}`,
        }}>
          {data.deals.length} total advisors across all stages
        </div>
      )}
    </div>
  );
}
