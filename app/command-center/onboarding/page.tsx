'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ONBOARDING_STAGE_IDS, STAGE_LABELS, PHASE_ORDER, PHASE_META } from '@/lib/onboarding-tasks';
import type { OnboardingTask, Phase, TaskRole } from '@/lib/onboarding-tasks';
import { StatCard, ProgressIndicator, DataCard, ScoreBadge } from '@/components/ui';
import { useTheme } from '@/lib/theme-provider';
import { getThemeColors } from '@/lib/design-tokens';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Task row type (definition + saved state + computed due date) ─────────────
interface TaskRow extends OnboardingTask {
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  due_date: string | null;
}

// ── Workload types ──────────────────────────────────────────────────────────
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

const BORDER_CLASSES: Record<string, string> = {
  emerald: 'border-emerald-400/30',
  amber: 'border-amber-400/30',
  red: 'border-red-400/30',
};
const BADGE_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-500/20 text-emerald-400',
  amber: 'bg-amber-500/20 text-amber-400',
  red: 'bg-red-500/20 text-red-400',
};

const CAPACITY_ROLES = ['AXM', 'AXA', 'CTM', 'CTA'] as const;
const WORKLOAD_ROLE_LABELS: Record<string, string> = {
  AXM: 'Advisor Experience Managers',
  AXA: 'Advisor Experience Associates',
  CTM: 'Client Transition Managers',
  CTA: 'Client Transition Associates',
};

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

// Primary roles shown as buttons, the rest go in a dropdown
const PRIMARY_ROLES: string[] = ['all', 'AXM', 'AXA', 'CTM', 'CTA', 'CXM'];
const DROPDOWN_ROLES: TaskRole[] = ['Recruiter', 'Director', 'IT', 'HR', 'Finance', 'Marketing', 'Compliance', 'Investment Team', 'FP Team', 'Advisor', 'RIA Leadership'];

// ── Helpers ─────────────────────────────────────────────────────────────────
function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate + 'T23:59:59') < new Date();
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '';
  const d = new Date(dueDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Capacity Planning Dashboard ─────────────────────────────────────────────
function WorkloadDashboard() {
  const { theme } = useTheme();
  const C = useMemo(() => getThemeColors(theme === 'dark'), [theme]);

  const [activeRole, setActiveRole] = useState<string>('AXM');
  const { data, isLoading } = useSWR(`/api/command-center/workload?role=${activeRole}`, fetcher, { refreshInterval: 43_200_000 });
  const [expandedMember, setExpandedMember] = useState<number | null>(null);

  if (isLoading) {
    return <div className="p-5 text-sm" style={{ color: C.slate }}>Loading workload data...</div>;
  }

  const workload: WorkloadEntry[] = data?.workload ?? [];
  const maxCapacity: number = data?.maxCapacity ?? 250;

  const totalAdvisors = workload.reduce((sum, w) => sum + w.active_deals, 0);
  const avgComplexity = workload.length > 0
    ? Math.round(workload.reduce((sum, w) => sum + w.total_complexity, 0) / workload.length)
    : 0;
  const overloaded = workload.filter(w => w.capacity_status === 'red').length;

  return (
    <div className="mb-7">
      {/* Role Tabs */}
      <div className="flex gap-0 border-b-2 mb-5" style={{ borderColor: C.borderSubtle }}>
        {CAPACITY_ROLES.map(role => {
          const isActive = activeRole === role;
          return (
            <button
              key={role}
              onClick={() => { setActiveRole(role); setExpandedMember(null); }}
              className="px-5 py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer bg-transparent transition-all"
              style={{
                color: isActive ? C.teal : C.slate,
                borderColor: isActive ? C.teal : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = C.cream;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = C.slate;
              }}
            >
              {role}
            </button>
          );
        })}
      </div>

      {workload.length === 0 ? (
        <DataCard className="text-center mb-4">
          <p className="text-sm" style={{ color: C.slate }}>
            No active {activeRole}s found. Add team members with the {activeRole} role in the Team page.
          </p>
        </DataCard>
      ) : (
      <>
      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          title={`Active ${activeRole}s`}
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
          value={overloaded > 0 ? `${overloaded} member${overloaded > 1 ? 's' : ''}` : 'Balanced'}
          className={overloaded > 0 ? 'bg-red-500/20 border-red-500/30' : 'bg-emerald-500/20 border-emerald-500/30'}
        />
      </div>

      {/* Role description */}
      <p className="text-xs mb-4" style={{ color: C.slate }}>{WORKLOAD_ROLE_LABELS[activeRole] ?? activeRole}</p>

      {/* Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {workload.map(w => {
          const isExpanded = expandedMember === w.member_id;
          const statusColor = STATUS_COLORS[w.capacity_status];

          return (
            <DataCard
              key={w.member_id}
              className={BORDER_CLASSES[statusColor] ?? ''}
            >
              {/* Header */}
              <div
                onClick={() => setExpandedMember(isExpanded ? null : w.member_id)}
                className="cursor-pointer flex items-center justify-between mb-3"
              >
                <div>
                  <p className="text-sm font-bold mb-0.5" style={{ color: C.cream }}>{w.member_name}</p>
                  <p className="text-xs tabular-nums" style={{ color: C.slate }}>
                    {w.active_deals} advisor{w.active_deals !== 1 ? 's' : ''} · {w.total_complexity} pts
                  </p>
                </div>
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${BADGE_CLASSES[statusColor] ?? ''}`}>
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
                <div className="mt-4 pt-4 border-t" style={{ borderColor: C.border }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.slate }}>
                    Assigned Advisors
                  </p>
                  {w.deals.map(d => (
                    <div key={d.deal_id} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: C.border }}>
                      <Link
                        href={`/command-center/advisor/${d.deal_id}`}
                        className="text-xs no-underline font-medium hover:underline"
                        style={{ color: C.teal }}
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
                <div className="mt-4 pt-4 border-t text-xs" style={{ borderColor: C.border, color: C.slate }}>
                  No advisors currently assigned.
                </div>
              )}
            </DataCard>
          );
        })}
      </div>
      </>
      )}
    </div>
  );
}

// ── Phase Section ───────────────────────────────────────────────────────────
function PhaseSection({ phase, tasks, onToggle, roleFilter }: {
  phase: Phase;
  tasks: TaskRow[];
  onToggle: (key: string, completed: boolean) => void;
  roleFilter: string;
}) {
  const { theme } = useTheme();
  const C = useMemo(() => getThemeColors(theme === 'dark'), [theme]);

  const [open, setOpen] = useState(true);
  const meta = PHASE_META[phase];
  const allPhaseTasks = tasks.filter(t => t.phase === phase);
  const phaseTasks = roleFilter === 'all' ? allPhaseTasks : allPhaseTasks.filter(t => t.owner === roleFilter);
  const completedCount = phaseTasks.filter(t => t.completed).length;
  const hardGatesRemaining = phaseTasks.filter(t => t.is_hard_gate && !t.completed).length;
  const overdueCount = phaseTasks.filter(t => !t.completed && isOverdue(t.due_date)).length;

  if (phaseTasks.length === 0) return null;

  return (
    <div className="mb-3 border rounded-lg overflow-hidden" style={{ borderColor: C.border }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 border-none cursor-pointer transition-smooth"
        style={{ backgroundColor: C.cardBg }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.cardBgHover}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.cardBg}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm" style={{ color: C.cream }}>{meta.label}</span>
          <span className="text-[10px]" style={{ color: C.slate }}>{meta.timing}</span>
          {hardGatesRemaining > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: C.teal + '25', color: C.teal }}>
              {hardGatesRemaining} gate{hardGatesRemaining > 1 ? 's' : ''}
            </span>
          )}
          {overdueCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: C.redBg, color: C.red }}>
              {overdueCount} overdue
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 flex-1 ml-5">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                <div
                  className="h-full rounded-full transition-smooth"
                  style={{
                    width: `${phaseTasks.length ? (completedCount / phaseTasks.length) * 100 : 0}%`,
                    backgroundColor: C.teal
                  }}
                />
              </div>
              <span className="text-xs min-w-9 text-right" style={{ color: C.slate }}>{completedCount}/{phaseTasks.length}</span>
            </div>
          </div>
          <span className="text-xs" style={{ color: C.slate }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div>
          {phaseTasks.map((task) => {
            const overdue = !task.completed && isOverdue(task.due_date);
            const taskBg = overdue ? C.redBg : task.completed ? C.greenBg : C.cardBgAlt;
            return (
              <div
                key={task.key}
                className="flex items-start gap-3 px-4 py-2.5 border-t"
                style={{
                  backgroundColor: taskBg,
                  borderColor: C.border,
                  borderLeft: overdue ? `2px solid ${C.red}` : 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={e => onToggle(task.key, e.target.checked)}
                  className="mt-0.5 accent-teal w-4 h-4 cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.is_hard_gate && (
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: C.teal }} title="Hard gate" />
                    )}
                    <span className={`text-sm ${task.completed ? 'line-through' : ''}`} style={{ color: task.completed ? C.slate : C.cream }}>
                      {task.label}
                    </span>
                    {roleFilter === 'all' && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${ROLE_BADGE_COLORS[task.owner] ?? 'bg-slate/15 text-slate'}`}>
                        {task.owner}
                      </span>
                    )}
                    {task.due_date && !task.completed && (
                      <span
                        className={`text-[10px] whitespace-nowrap ${overdue ? 'font-bold' : ''}`}
                        style={{ color: overdue ? C.red : C.slate }}
                      >
                        Due {formatDueDate(task.due_date)}
                      </span>
                    )}
                  </div>
                  {task.completed && task.completed_by && (
                    <p className="text-xs mt-0.5" style={{ color: C.teal }}>
                      {task.completed_by.split('@')[0]}
                      {task.completed_at && ` · ${new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </p>
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

// ── Advisor Checklist ───────────────────────────────────────────────────────
interface DealWithDates {
  id: string;
  dealname: string;
  dealstage: string;
  closedate?: string;
  desired_start_date?: string;
  actual_launch_date?: string;
}

function AdvisorChecklist({ deal, roleFilter }: { deal: DealWithDates; roleFilter: string }) {
  const { theme } = useTheme();
  const C = useMemo(() => getThemeColors(theme === 'dark'), [theme]);

  const day0 = deal.closedate || null;
  const launch = deal.actual_launch_date || deal.desired_start_date || null;
  const qp = new URLSearchParams();
  if (day0) qp.set('day0_date', day0);
  if (launch) qp.set('launch_date', launch);

  const { data, mutate } = useSWR(
    `/api/command-center/checklist/${deal.id}${qp.toString() ? `?${qp}` : ''}`,
    fetcher,
    { refreshInterval: 43_200_000 }
  );
  const tasks: TaskRow[] = data?.tasks ?? [];
  const filteredTasks = roleFilter === 'all' ? tasks : tasks.filter(t => t.owner === roleFilter);
  const completedCount = filteredTasks.filter(t => t.completed).length;
  const overdueCount = filteredTasks.filter(t => !t.completed && isOverdue(t.due_date)).length;
  const hardGatesRemaining = filteredTasks.filter(t => t.is_hard_gate && !t.completed).length;

  async function handleToggle(taskKey: string, completed: boolean) {
    mutate({ ...data, tasks: tasks.map(t => t.key === taskKey ? { ...t, completed } : t) }, false);
    await fetch(`/api/command-center/checklist/${deal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskKey, completed }),
    });
    mutate();
  }

  const pct = filteredTasks.length ? Math.round((completedCount / filteredTasks.length) * 100) : 0;

  return (
    <DataCard className="mb-6">
      <div className="flex items-center justify-between pb-4 border-b mb-4" style={{ borderColor: C.border }}>
        <div>
          <Link href={`/command-center/advisor/${deal.id}`} className="no-underline">
            <h3
              className="text-base font-bold font-serif mb-1 cursor-pointer transition-smooth"
              style={{ color: C.cream }}
              onMouseEnter={(e) => e.currentTarget.style.color = C.teal}
              onMouseLeave={(e) => e.currentTarget.style.color = C.cream}
            >
              {deal.dealname}
            </h3>
          </Link>
          <span className="text-xs font-medium" style={{ color: C.teal }}>{STAGE_LABELS[deal.dealstage] ?? deal.dealstage}</span>
          {day0 && (
            <span className="text-[10px] ml-3" style={{ color: C.slate }}>
              Signed {new Date(day0 + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {launch && (
            <span className="text-[10px] ml-3" style={{ color: C.slate }}>
              Launch {new Date(launch + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Summary stats */}
          <div className="flex items-center gap-3 text-[10px]">
            {overdueCount > 0 && (
              <span className="px-2 py-0.5 rounded font-bold" style={{ backgroundColor: C.redBg, color: C.red }}>
                {overdueCount} overdue
              </span>
            )}
            {hardGatesRemaining > 0 && (
              <span className="px-2 py-0.5 rounded font-bold" style={{ backgroundColor: C.teal + '25', color: C.teal }}>
                {hardGatesRemaining} gate{hardGatesRemaining > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="text-center">
            <div
              className="w-14 h-14 rounded-full border-[3px] flex items-center justify-center flex-col"
              style={{ borderColor: pct === 100 ? C.teal : C.border }}
            >
              <span className="text-sm font-bold" style={{ color: pct === 100 ? C.teal : C.cream }}>{pct}%</span>
            </div>
            <p className="text-[10px] mt-1" style={{ color: C.slate }}>{completedCount}/{filteredTasks.length}</p>
          </div>
        </div>
      </div>
      <div>
        {PHASE_ORDER.map(phase => (
          <PhaseSection key={phase} phase={phase} tasks={tasks} onToggle={handleToggle} roleFilter={roleFilter} />
        ))}
      </div>
    </DataCard>
  );
}

/**
 * Onboarding Tracker - Workload dashboard and 8-phase task checklists
 */
export default function OnboardingTracker() {
  const { theme } = useTheme();
  const C = useMemo(() => getThemeColors(theme === 'dark'), [theme]);

  const { data, error, isLoading } = useSWR('/api/command-center/pipeline', fetcher, { refreshInterval: 43_200_000 });
  const [activeTab, setActiveTab] = useState<'workload' | 'checklists'>('workload');
  const [checklistRoleFilter, setChecklistRoleFilter] = useState<string>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (isLoading) {
    return <div className="px-10 py-16" style={{ color: C.slate }}>Loading…</div>;
  }

  if (error) {
    return <div className="px-10 py-16" style={{ color: C.red }}>Failed to load data.</div>;
  }

  const onboardingDeals = (data?.deals ?? []).filter(
    (d: { dealstage: string; dealname?: string; daysSinceLaunch?: number | null }) => {
      if (!ONBOARDING_STAGE_IDS.includes(d.dealstage)) return false;
      if (d.dealname?.toLowerCase().includes('test')) return false;
      if (d.dealstage === '100411705') {
        return d.daysSinceLaunch == null || d.daysSinceLaunch <= 90;
      }
      return true;
    }
  );

  const isDropdownRole = DROPDOWN_ROLES.includes(checklistRoleFilter as TaskRole);

  return (
    <div className="px-10 py-10 min-h-screen bg-transparent font-sans">
      <div className="relative mb-6">
        <Image src="/images/Farther_Symbol_RGB_Cream.svg" alt="" width={32} height={32} className="absolute top-0 right-0 opacity-50" />
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold font-serif mb-2" style={{ color: C.cream }}>
            Active Onboarding
          </h1>
          <p className="text-sm" style={{ color: C.slate }}>
            {onboardingDeals.length} advisor{onboardingDeals.length !== 1 ? 's' : ''} in onboarding · 8-phase checklist · Due-date tracking
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center">
          <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
            {[
              { key: 'workload' as const, label: 'AXM Workload' },
              { key: 'checklists' as const, label: 'Checklists' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-3.5 py-1.5 rounded text-xs font-medium transition-smooth border-none cursor-pointer"
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
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AXM Workload Tab */}
      {activeTab === 'workload' && <WorkloadDashboard />}

      {/* Checklists Tab */}
      {activeTab === 'checklists' && (
        <>
          {/* Role filter */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider mr-2" style={{ color: C.slate }}>Filter by role:</span>
            {PRIMARY_ROLES.map(role => {
              const isActive = checklistRoleFilter === role;
              return (
                <button
                  key={role}
                  onClick={() => { setChecklistRoleFilter(role); setDropdownOpen(false); }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer transition-smooth"
                  style={{
                    backgroundColor: isActive ? C.teal : C.cardBg,
                    color: isActive ? C.white : C.slate
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = C.cream;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = C.slate;
                  }}
                >
                  {role === 'all' ? 'All Tasks' : role}
                </button>
              );
            })}
            {/* Dropdown for additional roles */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="px-3 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer transition-smooth"
                style={{
                  backgroundColor: isDropdownRole ? C.teal : C.cardBg,
                  color: isDropdownRole ? C.white : C.slate
                }}
                onMouseEnter={(e) => {
                  if (!isDropdownRole) e.currentTarget.style.color = C.cream;
                }}
                onMouseLeave={(e) => {
                  if (!isDropdownRole) e.currentTarget.style.color = C.slate;
                }}
              >
                {isDropdownRole ? checklistRoleFilter : 'More ▾'}
              </button>
              {dropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-1 border rounded-lg shadow-xl z-50 min-w-[160px] py-1"
                  style={{ backgroundColor: C.cardBg, borderColor: C.border }}
                >
                  {DROPDOWN_ROLES.map(role => (
                    <button
                      key={role}
                      onClick={() => { setChecklistRoleFilter(role); setDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer transition-smooth"
                      style={{
                        backgroundColor: checklistRoleFilter === role ? C.teal + '25' : 'transparent',
                        color: checklistRoleFilter === role ? C.teal : C.slate
                      }}
                      onMouseEnter={(e) => {
                        if (checklistRoleFilter !== role) {
                          e.currentTarget.style.color = C.cream;
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (checklistRoleFilter !== role) {
                          e.currentTarget.style.color = C.slate;
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {onboardingDeals.length === 0 ? (
            <DataCard className="text-center py-16">
              <p style={{ color: C.slate }}>
                No advisors currently in onboarding (Offer Accepted or Launched stages).
              </p>
            </DataCard>
          ) : (
            onboardingDeals.map((deal: DealWithDates) => (
              <AdvisorChecklist key={deal.id} deal={deal} roleFilter={checklistRoleFilter} />
            ))
          )}
        </>
      )}
    </div>
  );
}
