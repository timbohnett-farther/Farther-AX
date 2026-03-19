'use client';

import useSWR from 'swr';
import { useState } from 'react';
import Link from 'next/link';
import { ONBOARDING_STAGE_IDS, STAGE_LABELS } from '@/lib/onboarding-tasks';
import type { OnboardingTask, Phase } from '@/lib/onboarding-tasks';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const C = {
  dark: '#333333', white: '#ffffff', slate: '#5b6a71',
  teal: '#1d7682', bg: '#FAF7F2', cardBg: '#ffffff', border: '#e8e2d9',
  red: '#c0392b', redBg: 'rgba(192,57,43,0.08)',
  amber: '#b27d2e', amberBg: 'rgba(178,125,46,0.08)',
  green: '#27ae60', greenBg: 'rgba(39,174,96,0.10)',
};

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

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  green: { bg: C.greenBg, color: C.green, border: 'rgba(39,174,96,0.2)' },
  amber: { bg: C.amberBg, color: C.amber, border: 'rgba(178,125,46,0.2)' },
  red: { bg: C.redBg, color: C.red, border: 'rgba(192,57,43,0.2)' },
};

// ── AXM Workload Dashboard ──────────────────────────────────────────────────
function WorkloadDashboard() {
  const { data, isLoading } = useSWR('/api/command-center/workload?role=AXM', fetcher, { refreshInterval: 43_200_000 });
  const [expandedMember, setExpandedMember] = useState<number | null>(null);

  if (isLoading) return <div style={{ padding: 20, color: C.slate, fontSize: 13 }}>Loading workload data...</div>;

  const workload: WorkloadEntry[] = data?.workload ?? [];
  const maxCapacity: number = data?.maxCapacity ?? 250;

  if (workload.length === 0) {
    return (
      <div style={{
        padding: '24px 20px', background: C.cardBg, border: `1px solid ${C.border}`,
        borderRadius: 10, marginBottom: 28, textAlign: 'center', color: C.slate, fontSize: 13,
      }}>
        No active AXMs found. Add team members in the Team page to see workload balancing.
      </div>
    );
  }

  const totalAdvisors = workload.reduce((sum, w) => sum + w.active_deals, 0);
  const avgComplexity = workload.length > 0
    ? Math.round(workload.reduce((sum, w) => sum + w.total_complexity, 0) / workload.length)
    : 0;
  const overloaded = workload.filter(w => w.capacity_status === 'red').length;

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: '14px 16px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8 }}>
          <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Active AXMs</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: C.teal, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>{workload.length}</p>
        </div>
        <div style={{ padding: '14px 16px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8 }}>
          <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Total Advisors</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>{totalAdvisors}</p>
        </div>
        <div style={{ padding: '14px 16px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8 }}>
          <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Avg Complexity Load</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>{avgComplexity}/{maxCapacity}</p>
        </div>
        <div style={{ padding: '14px 16px', background: overloaded > 0 ? C.redBg : C.greenBg, border: `1px solid ${overloaded > 0 ? 'rgba(192,57,43,0.15)' : 'rgba(39,174,96,0.15)'}`, borderRadius: 8 }}>
          <p style={{ fontSize: 11, color: overloaded > 0 ? C.red : C.green, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {overloaded > 0 ? 'Overloaded' : 'Team Status'}
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: overloaded > 0 ? C.red : C.green, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
            {overloaded > 0 ? `${overloaded} AXM${overloaded > 1 ? 's' : ''}` : 'Balanced'}
          </p>
        </div>
      </div>

      {/* AXM Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {workload.map(w => {
          const sc = STATUS_COLORS[w.capacity_status];
          const isExpanded = expandedMember === w.member_id;

          return (
            <div key={w.member_id} style={{
              background: C.cardBg, border: `1px solid ${sc.border}`,
              borderRadius: 10, overflow: 'hidden',
            }}>
              {/* Header */}
              <div
                onClick={() => setExpandedMember(isExpanded ? null : w.member_id)}
                style={{
                  padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 2 }}>{w.member_name}</p>
                  <p style={{ fontSize: 11, color: C.slate }}>
                    {w.active_deals} advisor{w.active_deals !== 1 ? 's' : ''} · {w.total_complexity} pts
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    background: sc.bg, color: sc.color,
                  }}>
                    {w.capacity_status}
                  </span>
                </div>
              </div>

              {/* Capacity bar */}
              <div style={{ padding: '0 16px 12px' }}>
                <div style={{ height: 8, background: '#e8e2d9', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                  {/* Amber threshold marker */}
                  <div style={{
                    position: 'absolute', left: '60%', top: 0, bottom: 0,
                    width: 1, background: C.amber, opacity: 0.4,
                  }} />
                  {/* Red threshold marker */}
                  <div style={{
                    position: 'absolute', left: '88%', top: 0, bottom: 0,
                    width: 1, background: C.red, opacity: 0.4,
                  }} />
                  {/* Fill */}
                  <div style={{
                    height: '100%', borderRadius: 4, transition: 'width 0.3s',
                    width: `${Math.min(w.capacity_used_pct, 100)}%`,
                    background: sc.color,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: C.slate }}>{w.capacity_used_pct}% capacity</span>
                  <span style={{ fontSize: 10, color: C.slate }}>{w.total_complexity}/{maxCapacity} pts</span>
                </div>
              </div>

              {/* Expanded: deal list */}
              {isExpanded && w.deals.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Assigned Advisors
                  </p>
                  {w.deals.map(d => {
                    const tierColor = d.complexity_tier === 'Critical' ? '#8e44ad'
                      : d.complexity_tier === 'High' ? C.red
                      : d.complexity_tier === 'Moderate' ? C.amber
                      : C.green;
                    return (
                      <div key={d.deal_id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 0', borderBottom: `1px solid ${C.border}`,
                      }}>
                        <Link
                          href={`/command-center/advisor/${d.deal_id}`}
                          style={{ fontSize: 12, color: C.teal, textDecoration: 'none', fontWeight: 500 }}
                        >
                          {d.deal_name}
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: tierColor }}>{d.complexity_score}</span>
                          <span style={{
                            fontSize: 9, padding: '1px 5px', borderRadius: 3,
                            background: `${tierColor}15`, color: tierColor, fontWeight: 600,
                          }}>
                            {d.complexity_tier}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {isExpanded && w.deals.length === 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 16px', color: C.slate, fontSize: 12 }}>
                  No advisors currently assigned.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#e8e2d9', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: C.teal, borderRadius: 3, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: C.slate, minWidth: 36, textAlign: 'right' }}>{completed}/{total}</span>
    </div>
  );
}

function PhaseSection({ phase, tasks, onToggle }: {
  phase: Phase;
  tasks: TaskRow[];
  onToggle: (key: string, completed: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const phaseTasks = tasks.filter(t => t.phase === phase);
  const completedCount = phaseTasks.filter(t => t.completed).length;

  return (
    <div style={{ marginBottom: 12, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: '#f7f4ef', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontWeight: 600, color: C.dark, fontSize: 13 }}>{PHASE_LABELS[phase]}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, marginLeft: 20 }}>
          <div style={{ flex: 1 }}>
            <ProgressBar completed={completedCount} total={phaseTasks.length} />
          </div>
          <span style={{ color: C.slate, fontSize: 12 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div>
          {phaseTasks.map((task) => (
            <div
              key={task.key}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 16px',
                borderTop: `1px solid ${C.border}`,
                background: task.completed ? 'rgba(29,118,130,0.04)' : C.white,
              }}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={e => onToggle(task.key, e.target.checked)}
                style={{ marginTop: 2, accentColor: C.teal, width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <span style={{
                  fontSize: 13, color: task.completed ? C.slate : C.dark,
                  textDecoration: task.completed ? 'line-through' : 'none',
                }}>
                  {task.label}
                  {task.optional && <span style={{ marginLeft: 6, fontSize: 10, color: C.slate, fontStyle: 'italic' }}>(opt)</span>}
                </span>
                {task.completed && task.completed_by && (
                  <p style={{ fontSize: 11, color: C.teal, marginTop: 2 }}>
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
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 24, overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Link
            href={`/command-center/advisor/${deal.id}`}
            style={{ textDecoration: 'none' }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 4, cursor: 'pointer' }}>
              {deal.dealname}
            </h3>
          </Link>
          <span style={{ fontSize: 11, color: C.teal, fontWeight: 500 }}>{STAGE_LABELS[deal.dealstage] ?? deal.dealstage}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', border: `3px solid ${pct === 100 ? C.teal : C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: pct === 100 ? C.teal : C.dark }}>{pct}%</span>
          </div>
          <p style={{ fontSize: 10, color: C.slate, marginTop: 4 }}>{completedCount}/43</p>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {(['pre_launch', 'launch_day', 'post_launch'] as Phase[]).map(phase => (
          <PhaseSection key={phase} phase={phase} tasks={tasks} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  );
}

export default function OnboardingTracker() {
  const { data, error, isLoading } = useSWR('/api/command-center/pipeline', fetcher, { refreshInterval: 43_200_000 });
  const [activeTab, setActiveTab] = useState<'workload' | 'checklists'>('workload');

  if (isLoading) return <div style={{ padding: '60px 40px', color: C.slate }}>Loading…</div>;
  if (error) return <div style={{ padding: '60px 40px', color: '#c0392b' }}>Failed to load data.</div>;

  const onboardingDeals = (data?.deals ?? []).filter(
    (d: { dealstage: string }) => ONBOARDING_STAGE_IDS.includes(d.dealstage)
  );

  return (
    <div style={{ padding: '40px 40px', minHeight: '100vh', background: C.bg, fontFamily: "'Fakt', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 6 }}>
            Active Onboarding
          </h1>
          <p style={{ color: C.slate, fontSize: 14 }}>
            {onboardingDeals.length} advisor{onboardingDeals.length !== 1 ? 's' : ''} in onboarding · Team capacity tracking · 43-task checklist
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 6, padding: 3 }}>
          {[
            { key: 'workload' as const, label: 'AXM Workload' },
            { key: 'checklists' as const, label: 'Checklists' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                background: activeTab === tab.key ? C.teal : 'transparent',
                color: activeTab === tab.key ? C.white : C.slate,
                border: 'none', cursor: 'pointer', transition: 'all 150ms',
              }}
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
            <div style={{ padding: '60px 40px', textAlign: 'center', color: C.slate, background: C.cardBg, borderRadius: 8, border: `1px solid ${C.border}` }}>
              No advisors currently in onboarding (Offer Accepted or Launched stages).
            </div>
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
