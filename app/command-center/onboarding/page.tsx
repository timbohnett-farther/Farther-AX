'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { ONBOARDING_TASKS, ONBOARDING_STAGE_IDS, STAGE_LABELS } from '@/lib/onboarding-tasks';
import type { OnboardingTask, Phase } from '@/lib/onboarding-tasks';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const C = {
  dark: '#333333', white: '#ffffff', slate: '#5b6a71',
  teal: '#1d7682', bg: '#FAF7F2', cardBg: '#ffffff', border: '#e8e2d9',
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
          {phaseTasks.map((task, i) => (
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
  const { data, mutate } = useSWR(`/api/command-center/checklist/${deal.id}`, fetcher, { refreshInterval: 30_000 });
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
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 4 }}>
            {deal.dealname}
          </h3>
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
  const { data, error, isLoading } = useSWR('/api/command-center/pipeline', fetcher, { refreshInterval: 30_000 });

  if (isLoading) return <div style={{ padding: '60px 40px', color: C.slate }}>Loading…</div>;
  if (error) return <div style={{ padding: '60px 40px', color: '#c0392b' }}>Failed to load data.</div>;

  const onboardingDeals = (data?.deals ?? []).filter(
    (d: { dealstage: string }) => ONBOARDING_STAGE_IDS.includes(d.dealstage)
  );

  return (
    <div style={{ padding: '40px 40px', minHeight: '100vh', background: C.bg, fontFamily: "'Fakt', system-ui, sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 6 }}>
          Active Onboarding
        </h1>
        <p style={{ color: C.slate, fontSize: 14 }}>
          {onboardingDeals.length} advisor{onboardingDeals.length !== 1 ? 's' : ''} in onboarding · 43-task checklist · real-time sync
        </p>
      </div>

      {onboardingDeals.length === 0 ? (
        <div style={{ padding: '60px 40px', textAlign: 'center', color: C.slate, background: C.cardBg, borderRadius: 8, border: `1px solid ${C.border}` }}>
          No advisors currently in onboarding (Offer Accepted or Launched stages).
        </div>
      ) : (
        onboardingDeals.map((deal: { id: string; dealname: string; dealstage: string }) => (
          <AdvisorChecklist key={deal.id} deal={deal} />
        ))
      )}
    </div>
  );
}
