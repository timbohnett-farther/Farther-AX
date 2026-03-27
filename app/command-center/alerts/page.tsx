'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DataCard, StatCard } from '@/components/ui';
import { useTheme } from '@/lib/theme-provider';
import { getThemeColors } from '@/lib/design-tokens';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Types ───────────────────────────────────────────────────────────────────

interface TaskAlert {
  type: 'task_overdue';
  deal_id: string;
  deal_name: string;
  task_key: string;
  task_label: string;
  phase: string;
  phase_label: string;
  owner: string;
  due_date: string;
  days_overdue: number;
  is_hard_gate: boolean;
}

interface SentimentAlert {
  type: 'sentiment_drop';
  deal_id: string;
  deal_name: string;
  previous_tier: string;
  current_tier: string;
  previous_score: number;
  current_score: number;
  score_change: number;
  changed_at: string;
}

interface AumAlert {
  type: 'aum_behind';
  deal_id: string;
  deal_name: string;
  transfer_pct: number;
  expected_pct: number;
  deficit: number;
  days_since_launch: number;
  transition_type: string;
  pace_status: 'warning' | 'behind';
  expected_aum: number;
  actual_aum: number;
}

type Alert = TaskAlert | SentimentAlert | AumAlert;

type AlertTab = 'all' | 'task_overdue' | 'sentiment_drop' | 'aum_behind';

// ── Role badge colors ───────────────────────────────────────────────────────

const ROLE_BADGE_COLORS: Record<string, string> = {
  AXM: 'bg-teal/15 text-teal',
  AXA: 'bg-cyan-400/15 text-cyan-400',
  CTM: 'bg-amber-400/15 text-amber-400',
  CTA: 'bg-yellow-500/15 text-yellow-500',
  CXM: 'bg-purple-400/15 text-purple-400',
  Recruiter: 'bg-emerald-400/15 text-emerald-400',
  Director: 'bg-rose-400/15 text-rose-400',
  IT: 'bg-blue-400/15 text-blue-400',
  HR: 'bg-pink-400/15 text-pink-400',
  Finance: 'bg-green-400/15 text-green-400',
  Marketing: 'bg-orange-400/15 text-orange-400',
  Compliance: 'bg-red-400/15 text-red-400',
  'Investment Team': 'bg-indigo-400/15 text-indigo-400',
  'FP Team': 'bg-violet-400/15 text-violet-400',
  Advisor: 'bg-sky-400/15 text-sky-400',
  'RIA Leadership': 'bg-fuchsia-400/15 text-fuchsia-400',
};

// ── Sentiment tier colors ───────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  'Advocate': 'bg-emerald-500/15 text-emerald-400',
  'Positive': 'bg-teal/15 text-teal',
  'Neutral': 'bg-amber-500/15 text-amber-400',
  'At Risk': 'bg-orange-500/15 text-orange-400',
  'High Risk': 'bg-red-500/15 text-red-400',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d.includes('T') ? d : d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCurrency(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

// ── Task Alert Row ──────────────────────────────────────────────────────────

function TaskAlertRow({ alert }: { alert: TaskAlert }) {
  const { theme } = useTheme();
  const C = useMemo(() => getThemeColors(theme === 'dark'), [theme]);

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0"
      style={{
        backgroundColor: alert.is_hard_gate ? C.redBg : 'transparent',
        borderColor: C.border,
        borderLeft: alert.is_hard_gate ? `2px solid ${C.red}` : 'none'
      }}
    >
      {alert.is_hard_gate && (
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: C.teal }} title="Hard gate" />
      )}
      <div className="flex-1 min-w-0">
        <span className="text-sm" style={{ color: C.cream }}>{alert.task_label}</span>
        <span className="text-[10px] ml-2" style={{ color: C.slate }}>{alert.phase_label}</span>
      </div>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${ROLE_BADGE_COLORS[alert.owner] ?? 'bg-slate/15 text-slate'}`}>
        {alert.owner}
      </span>
      <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: C.red }}>
        {alert.days_overdue}d overdue
      </span>
      <span className="text-[10px] whitespace-nowrap" style={{ color: C.slate }}>
        Due {formatDate(alert.due_date)}
      </span>
    </div>
  );
}

// ── Sentiment Alert Row ─────────────────────────────────────────────────────

function SentimentAlertRow({ alert }: { alert: SentimentAlert }) {
  const { theme } = useTheme();
  const C = useMemo(() => getThemeColors(theme === 'dark'), [theme]);

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0"
      style={{
        backgroundColor: C.amberBg,
        borderColor: C.border,
        borderLeft: `2px solid ${C.amber}`
      }}
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm" style={{ color: C.cream }}>Sentiment dropped</span>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${TIER_COLORS[alert.previous_tier] ?? 'bg-slate/15 text-slate'}`}>
            {alert.previous_tier}
          </span>
          <span className="text-[10px]" style={{ color: C.slate }}>&rarr;</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${TIER_COLORS[alert.current_tier] ?? 'bg-slate/15 text-slate'}`}>
            {alert.current_tier}
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className="text-[10px] font-bold block" style={{ color: C.red }}>
          {alert.score_change > 0 ? '+' : ''}{alert.score_change.toFixed(1)} pts
        </span>
        <span className="text-[10px]" style={{ color: C.slate }}>
          {alert.current_score.toFixed(0)}/100
        </span>
      </div>
      {alert.changed_at && (
        <span className="text-[10px] whitespace-nowrap" style={{ color: C.slate }}>
          {formatDate(alert.changed_at)}
        </span>
      )}
    </div>
  );
}

// ── AUM Alert Row ───────────────────────────────────────────────────────────

function AumAlertRow({ alert }: { alert: AumAlert }) {
  const { theme } = useTheme();
  const C = useMemo(() => getThemeColors(theme === 'dark'), [theme]);
  const isCritical = alert.pace_status === 'behind';

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0"
      style={{
        backgroundColor: isCritical ? C.redBg : C.amberBg,
        borderColor: C.border,
        borderLeft: `2px solid ${isCritical ? C.red : C.amber}`
      }}
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm" style={{ color: C.cream }}>
          AUM transfer {isCritical ? 'behind target' : 'slower than expected'}
        </span>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px]" style={{ color: C.slate }}>
            {alert.transfer_pct}% transferred · expected {alert.expected_pct}% by day {alert.days_since_launch}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="text-[10px] font-bold block" style={{ color: isCritical ? C.red : C.amber }}>
          {alert.deficit}% behind
        </span>
        <span className="text-[10px] tabular-nums" style={{ color: C.slate }}>
          {formatCurrency(alert.actual_aum)} / {formatCurrency(alert.expected_aum)}
        </span>
      </div>
      <span
        className="text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
        style={{
          backgroundColor: isCritical ? C.redBg : C.amberBg,
          color: isCritical ? C.red : C.amber
        }}
      >
        {alert.transition_type}
      </span>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const { theme } = useTheme();
  const C = useMemo(() => getThemeColors(theme === 'dark'), [theme]);

  const { data, isLoading, error } = useSWR('/api/command-center/alerts', fetcher, { refreshInterval: 300_000 });
  const [activeTab, setActiveTab] = useState<AlertTab>('all');

  if (isLoading) return <div className="px-10 py-16" style={{ color: C.slate }}>Loading alerts...</div>;
  if (error) return <div className="px-10 py-16" style={{ color: C.red }}>Failed to load alerts.</div>;

  const allAlerts: Alert[] = data?.alerts ?? [];
  const counts = data?.counts ?? { task_overdue: 0, hard_gates: 0, sentiment_drop: 0, aum_behind: 0, aum_critical: 0 };

  // Filter by tab
  let filtered = allAlerts;
  if (activeTab !== 'all') filtered = filtered.filter(a => a.type === activeTab);

  // Group by advisor
  const grouped = new Map<string, { deal_id: string; deal_name: string; alerts: Alert[] }>();
  for (const a of filtered) {
    if (!grouped.has(a.deal_id)) {
      grouped.set(a.deal_id, { deal_id: a.deal_id, deal_name: a.deal_name, alerts: [] });
    }
    grouped.get(a.deal_id)!.alerts.push(a);
  }

  const tabs: { key: AlertTab; label: string; count: number }[] = [
    { key: 'all', label: 'All Alerts', count: allAlerts.length },
    { key: 'task_overdue', label: 'Overdue Tasks', count: counts.task_overdue },
    { key: 'sentiment_drop', label: 'Sentiment Drops', count: counts.sentiment_drop },
    { key: 'aum_behind', label: 'AUM Pace', count: counts.aum_behind },
  ];

  return (
    <div className="px-10 py-10 min-h-screen bg-transparent font-sans">
      <div className="relative mb-6">
        <Image src="/images/Farther_Symbol_RGB_Cream.svg" alt="" width={32} height={32} className="absolute top-0 right-0 opacity-50" />
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold font-serif mb-2" style={{ color: C.cream }}>
            Onboarding Alerts
          </h1>
          <p className="text-sm" style={{ color: C.slate }}>
            Overdue tasks, sentiment shifts, and AUM transfer pace
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard
          title="Total Alerts"
          value={allAlerts.length}
          className={allAlerts.length > 0 ? 'bg-red-500/10 border-red-500/20' : ''}
        />
        <StatCard
          title="Overdue Tasks"
          value={counts.task_overdue}
          className={counts.task_overdue > 0 ? 'bg-red-500/10 border-red-500/20' : ''}
        />
        <StatCard
          title="Hard Gate Blockers"
          value={counts.hard_gates}
          className={counts.hard_gates > 0 ? 'bg-amber-500/10 border-amber-500/20' : ''}
        />
        <StatCard
          title="Sentiment Drops"
          value={counts.sentiment_drop}
          className={counts.sentiment_drop > 0 ? 'bg-orange-500/10 border-orange-500/20' : ''}
        />
        <StatCard
          title="AUM Off Pace"
          value={counts.aum_behind}
          className={counts.aum_behind > 0 ? 'bg-amber-500/10 border-amber-500/20' : ''}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1 mb-6 w-fit" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-3.5 py-1.5 rounded text-xs font-medium transition-smooth border-none cursor-pointer flex items-center gap-1.5"
            style={{
              backgroundColor: activeTab === tab.key ? C.teal : 'transparent',
              color: activeTab === tab.key ? C.white : C.slate
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.key) e.currentTarget.style.color = C.cream;
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.key) e.currentTarget.style.color = C.slate;
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className="text-[9px] px-1 py-0.5 rounded-sm font-bold"
                style={{
                  backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : C.redBg,
                  color: activeTab === tab.key ? 'inherit' : C.red
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <DataCard className="text-center py-16">
          <p className="text-sm" style={{ color: C.slate }}>
            {allAlerts.length === 0
              ? 'No alerts. All advisors are on track!'
              : 'No alerts in this category.'}
          </p>
        </DataCard>
      ) : (
        Array.from(grouped.values()).map(group => (
          <DataCard key={group.deal_id} className="mb-4">
            <div className="flex items-center justify-between pb-3 border-b mb-0" style={{ borderColor: C.border }}>
              <Link href={`/command-center/advisor/${group.deal_id}`} className="no-underline">
                <h3
                  className="text-sm font-bold font-serif cursor-pointer transition-smooth"
                  style={{ color: C.cream }}
                  onMouseEnter={(e) => e.currentTarget.style.color = C.teal}
                  onMouseLeave={(e) => e.currentTarget.style.color = C.cream}
                >
                  {group.deal_name}
                </h3>
              </Link>
              <div className="flex items-center gap-2">
                {group.alerts.some(a => a.type === 'task_overdue') && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-bold"
                    style={{ backgroundColor: C.redBg, color: C.red }}
                  >
                    {group.alerts.filter(a => a.type === 'task_overdue').length} overdue
                  </span>
                )}
                {group.alerts.some(a => a.type === 'sentiment_drop') && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-bold"
                    style={{ backgroundColor: C.amberBg, color: C.amber }}
                  >
                    Sentiment
                  </span>
                )}
                {group.alerts.some(a => a.type === 'aum_behind') && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-bold"
                    style={{ backgroundColor: C.amberBg, color: C.amber }}
                  >
                    AUM Pace
                  </span>
                )}
              </div>
            </div>
            <div>
              {group.alerts.map((alert, i) => {
                if (alert.type === 'task_overdue') return <TaskAlertRow key={`t-${i}`} alert={alert} />;
                if (alert.type === 'sentiment_drop') return <SentimentAlertRow key={`s-${i}`} alert={alert} />;
                if (alert.type === 'aum_behind') return <AumAlertRow key={`a-${i}`} alert={alert} />;
                return null;
              })}
            </div>
          </DataCard>
        ))
      )}
    </div>
  );
}
