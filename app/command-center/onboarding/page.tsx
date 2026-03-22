'use client';

import useSWR from 'swr';
import { useState } from 'react';
import Link from 'next/link';
import { ONBOARDING_STAGE_IDS, STAGE_LABELS } from '@/lib/onboarding-tasks';
import type { OnboardingTask, Phase } from '@/lib/onboarding-tasks';
import { StatCard, ProgressIndicator, DataCard, ScoreBadge } from '@/components/ui';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const PHASE_LABELS: Record<Phase, string> = {
  pre_launch: 'Pre-Launch',
  launch_day: 'Launch Day',
  post_launch: 'Post-Launch',
};

interface TaskRow extends OnboardingTask {
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
}

interface WorkloadEntry {
  member_id: number;
  member_name: string;
  member_email: string;
  role: string;
  active_deals: number;
  total_complexity: number;
  capacity_used_pct: number;
  capacity_status: 'green' | 'amber' | 'red';
  deals: Array<{
    deal_id: string;
    deal_name: string;
    dealstage: string;
    complexity_score: number;
    complexity_tier: string;
  }>;
}

const STATUS_COLORS = {
  green: 'emerald',
  amber: 'amber',
  red: 'red',
} as const;

// ── AXM Workload Dashboard ──────────────────────────────────────────────────
function WorkloadDashboard() {
  const { data, isLoading } = useSWR('/api/command-center/workload?role=AXM', fetcher, { refreshInterval: 43_200_000 });
  const [expandedMember, setExpandedMember] = useState<number | null>(null);

  if (isLoading) {
    return <div className="p-5 text-slate text-sm">Loading workload data...</div>;
  }

  const workload: WorkloadEntry[] = data?.workload ?? [];
  const maxCapacity: number = data?.maxCapacity ?? 250;

  if (workload.length === 0) {
    return (
      <DataCard className="text-center mb-7">
        <p className="text-slate text-sm">
          No active AXMs found. Add team members in the Team page to see workload balancing.
        </p>
      </DataCard>
    );
  }

  const totalAdvisors = workload.reduce((sum, w) => sum + w.active_deals, 0);
  const avgComplexity = workload.length > 0
    ? Math.round(workload.reduce((sum, w) => sum + w.total_complexity, 0) / workload.length)
    : 0;
  const overloaded = workload.filter(w => w.capacity_status === 'red').length;

  return (
    <div className="mb-7">
      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          title="Active AXMs"
          value={workload.length}
        />
        <StatCard
          title="Total Advisors"
          value={totalAdvisors}
        />
        <StatCard
          title="Avg Complexity Load"
          value={`${avgComplexity}/${maxCapacity}`}
        />
        <StatCard
          title={overloaded > 0 ? 'Overloaded' : 'Team Status'}
          value={overloaded > 0 ? `${overloaded} AXM${overloaded > 1 ? 's' : ''}` : 'Balanced'}
          className={overloaded > 0 ? 'bg-red-500/20 border-red-500/30' : 'bg-emerald-500/20 border-emerald-500/30'}
        />
      </div>

      {/* AXM Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {workload.map(w => {
          const isExpanded = expandedMember === w.member_id;
          const statusColor = STATUS_COLORS[w.capacity_status];

          return (
            <DataCard
              key={w.member_id}
              className={`border-${statusColor}-200`}
            >
              {/* Header */}
              <div
                onClick={() => setExpandedMember(isExpanded ? null : w.member_id)}
                className="cursor-pointer flex items-center justify-between mb-3"
              >
                <div>
                  <p className="text-sm font-bold text-charcoal mb-0.5">{w.member_name}</p>
                  <p className="text-xs text-slate">
                    {w.active_deals} advisor{w.active_deals !== 1 ? 's' : ''} · {w.total_complexity} pts
                  </p>
                </div>
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-${statusColor}-100 text-${statusColor}-700`}>
                    {w.capacity_status}
                  </span>
                </div>
              </div>

              {/* Capacity bar */}
              <ProgressIndicator
                label="Capacity"
                value={w.total_complexity}
                maxValue={maxCapacity}
                color={statusColor}
                markers={[
                  { value: maxCapacity * 0.6, label: 'Amber' },
                  { value: maxCapacity * 0.88, label: 'Red' },
                ]}
              />

              {/* Expanded: deal list */}
              {isExpanded && w.deals.length > 0 && (
                <div className="mt-4 pt-4 border-t border-cream-border">
                  <p className="text-[10px] font-semibold text-slate uppercase tracking-wider mb-2">
                    Assigned Advisors
                  </p>
                  {w.deals.map(d => (
                    <div key={d.deal_id} className="flex items-center justify-between py-1.5 border-b border-cream-border">
                      <Link
                        href={`/command-center/advisor/${d.deal_id}`}
                        className="text-xs text-teal no-underline font-medium hover:underline"
                      >
                        {d.deal_name}
                      </Link>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold">{d.complexity_score}</span>
                        <ScoreBadge
                          score={d.complexity_score}
                          maxScore={105}
                          label={d.complexity_tier}
                          showValue={false}
                          size="sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isExpanded && w.deals.length === 0 && (
                <div className="mt-4 pt-4 border-t border-cream-border text-slate text-xs">
                  No advisors currently assigned.
                </div>
              )}
            </DataCard>
          );
        })}
      </div>
    </div>
  );
}

// ── Phase Section ─────────────────────────────────────────────────────────────
function PhaseSection({ phase, tasks, onToggle }: {
  phase: Phase;
  tasks: TaskRow[];
  onToggle: (key: string, completed: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const phaseTasks = tasks.filter(t => t.phase === phase);
  const completedCount = phaseTasks.filter(t => t.completed).length;

  return (
    <div className="mb-3 border border-cream-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-cream-dark border-none cursor-pointer hover:bg-cream transition-smooth"
      >
        <span className="font-semibold text-charcoal text-sm">{PHASE_LABELS[phase]}</span>
        <div className="flex items-center gap-4 flex-1 ml-5">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-cream-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal rounded-full transition-smooth"
                  style={{ width: `${phaseTasks.length ? (completedCount / phaseTasks.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-slate min-w-9 text-right">{completedCount}/{phaseTasks.length}</span>
            </div>
          </div>
          <span className="text-slate text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div>
          {phaseTasks.map((task) => (
            <div
              key={task.key}
              className={`flex items-start gap-3 px-4 py-2.5 border-t border-cream-border ${
                task.completed ? 'bg-teal/5' : 'bg-white'
              }`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={e => onToggle(task.key, e.target.checked)}
                className="mt-0.5 accent-teal w-4 h-4 cursor-pointer shrink-0"
              />
              <div className="flex-1">
                <span className={`text-sm ${task.completed ? 'text-slate line-through' : 'text-charcoal'}`}>
                  {task.label}
                  {task.optional && <span className="ml-1.5 text-[10px] text-slate italic">(opt)</span>}
                </span>
                {task.completed && task.completed_by && (
                  <p className="text-xs text-teal mt-0.5">
                    ✓ {task.completed_by.split('@')[0]}
                    {task.completed_at && ` · ${new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Advisor Checklist ─────────────────────────────────────────────────────────
function AdvisorChecklist({ deal }: { deal: { id: string; dealname: string; dealstage: string } }) {
  const { data, mutate } = useSWR(`/api/command-center/checklist/${deal.id}`, fetcher, { refreshInterval: 43_200_000 });
  const tasks: TaskRow[] = data?.tasks ?? [];
  const completedCount = tasks.filter(t => t.completed).length;

  async function handleToggle(taskKey: string, completed: boolean) {
    // Optimistic update
    mutate({ ...data, tasks: tasks.map(t => t.key === taskKey ? { ...t, completed } : t) }, false);
    await fetch(`/api/command-center/checklist/${deal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskKey, completed }),
    });
    mutate();
  }

  const pct = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <DataCard className="mb-6">
      <div className="flex items-center justify-between pb-4 border-b border-cream-border mb-4">
        <div>
          <Link
            href={`/command-center/advisor/${deal.id}`}
            className="no-underline"
          >
            <h3 className="text-base font-bold text-charcoal font-serif mb-1 hover:text-teal cursor-pointer transition-smooth">
              {deal.dealname}
            </h3>
          </Link>
          <span className="text-xs text-teal font-medium">{STAGE_LABELS[deal.dealstage] ?? deal.dealstage}</span>
        </div>
        <div className="text-center">
          <div className={`w-14 h-14 rounded-full border-[3px] ${pct === 100 ? 'border-teal' : 'border-cream-border'} flex items-center justify-center flex-col`}>
            <span className={`text-sm font-bold ${pct === 100 ? 'text-teal' : 'text-charcoal'}`}>{pct}%</span>
          </div>
          <p className="text-[10px] text-slate mt-1">{completedCount}/43</p>
        </div>
      </div>
      <div>
        {(['pre_launch', 'launch_day', 'post_launch'] as Phase[]).map(phase => (
          <PhaseSection key={phase} phase={phase} tasks={tasks} onToggle={handleToggle} />
        ))}
      </div>
    </DataCard>
  );
}

/**
 * Onboarding Tracker - Workload dashboard and task checklists
 *
 * Migrated to Tremor components (removed all inline styles)
 */
export default function OnboardingTracker() {
  const { data, error, isLoading } = useSWR('/api/command-center/pipeline', fetcher, { refreshInterval: 43_200_000 });
  const [activeTab, setActiveTab] = useState<'workload' | 'checklists'>('workload');

  if (isLoading) {
    return <div className="px-10 py-16 text-slate">Loading…</div>;
  }

  if (error) {
    return <div className="px-10 py-16 text-red-600">Failed to load data.</div>;
  }

  const onboardingDeals = (data?.deals ?? []).filter(
    (d: { dealstage: string; dealname?: string; daysSinceLaunch?: number | null }) => {
      if (!ONBOARDING_STAGE_IDS.includes(d.dealstage)) return false;
      if (d.dealname?.toLowerCase().includes('test')) return false;
      // For launched advisors, only include those within 90-day graduation window
      if (d.dealstage === '100411705') {
        return d.daysSinceLaunch == null || d.daysSinceLaunch <= 90;
      }
      return true;
    }
  );

  return (
    <div className="px-10 py-10 min-h-screen bg-cream font-sans">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-charcoal font-serif mb-2">
            Active Onboarding
          </h1>
          <p className="text-slate text-sm">
            {onboardingDeals.length} advisor{onboardingDeals.length !== 1 ? 's' : ''} in onboarding · Team capacity tracking · 43-task checklist
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 glass-card rounded-lg p-1">
          {[
            { key: 'workload' as const, label: 'AXM Workload' },
            { key: 'checklists' as const, label: 'Checklists' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded text-xs font-medium transition-smooth border-none cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-teal text-white'
                  : 'bg-transparent text-slate hover:text-charcoal'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* AXM Workload Tab */}
      {activeTab === 'workload' && <WorkloadDashboard />}

      {/* Checklists Tab */}
      {activeTab === 'checklists' && (
        <>
          {onboardingDeals.length === 0 ? (
            <DataCard className="text-center py-16">
              <p className="text-slate">
                No advisors currently in onboarding (Offer Accepted or Launched stages).
              </p>
            </DataCard>
          ) : (
            onboardingDeals.map((deal: { id: string; dealname: string; dealstage: string }) => (
              <AdvisorChecklist key={deal.id} deal={deal} />
            ))
          )}
        </>
      )}
    </div>
  );
}
