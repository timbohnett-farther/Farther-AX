'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-provider';
import { getStageColors } from '@/lib/theme';
import { PHASES, PHASE_ORDER, type Phase } from '@/lib/onboarding-tasks-v2';
import type { Deal, SentimentScore, ChecklistTask, TaskSummary, TabKey } from './types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Stage config ─────────────────────────────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  '2496931': 'Step 1 – First Meeting',
  '2496932': 'Step 2 – Financial Model',
  '2496934': 'Step 3 – Advisor Demo',
  '100409509': 'Step 4 – Discovery Day',
  '2496935': 'Step 5 – Offer Review',
  '2496936': 'Step 6 – Offer Accepted',
  '100411705': 'Step 7 – Launched',
};

// ── Sentiment tier config (mirrors lib/sentiment.ts) ─────────────────────────
const TIER_CONFIG: Record<string, { color: string; bgColor: string; icon: string }> = {
  Advocate: { color: '#4ade80', bgColor: 'rgba(74,222,128,0.2)', icon: '★' },
  Positive: { color: '#5ec4cf', bgColor: 'rgba(78,112,130,0.2)', icon: '▲' },
  Neutral: { color: '#fbbf24', bgColor: 'rgba(251,191,36,0.18)', icon: '●' },
  'At Risk': { color: '#fb923c', bgColor: 'rgba(251,146,60,0.2)', icon: '◈' },
  'High Risk': { color: '#f87171', bgColor: 'rgba(248,113,113,0.2)', icon: '▼' },
};

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

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  upcoming: { color: '#5b6a71', bg: 'rgba(91,106,113,0.08)', border: 'rgba(91,106,113,0.15)' },
  due_soon: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
  overdue: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
  critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.2)', border: 'rgba(220,38,38,0.4)' },
  completed: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
  no_due_date: { color: '#5b6a71', bg: 'rgba(91,106,113,0.08)', border: 'rgba(91,106,113,0.15)' },
};

// ── Helper Functions ──────────────────────────────────────────────────────────
function formatAUM(n: number | null | undefined): string {
  if (!n || isNaN(n)) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Sentiment Badge Component ────────────────────────────────────────────────
function SentimentBadge({ score, tier }: { score: number | null; tier: string | null }) {
  if (!tier || score === null) {
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: 4,
          fontSize: 10,
          color: 'var(--color-text-secondary)',
          background: 'rgba(91,106,113,0.06)',
          fontStyle: 'italic',
        }}
      >
        Not scored
      </span>
    );
  }

  const config = TIER_CONFIG[tier] || {
    color: 'var(--color-text-secondary)',
    bgColor: 'rgba(91,106,113,0.08)',
    icon: '●',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          background: config.bgColor,
          color: config.color,
        }}
      >
        <span style={{ fontSize: 10 }}>{config.icon}</span>
        {tier}
      </span>
      <span
        style={{ fontSize: 10, color: 'var(--color-text-secondary)', paddingLeft: 2 }}
      >
        {Math.round(score)}/100
      </span>
    </div>
  );
}

// ── Expandable Checklist Panel ──────────────────────────────────────────────
function ExpandableChecklist({ dealId }: { dealId: string }) {
  const { THEME } = useTheme();
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<{ dealId: string; tasks: ChecklistTask[] } | { error: string; details?: string }>(
    `/api/command-center/checklist/${dealId}`,
    fetcher
  );
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [toggling, setToggling] = useState<string | null>(null);

  const togglePhase = (phase: string) =>
    setCollapsedPhases(prev => ({ ...prev, [phase]: !prev[phase] }));

  const handleToggle = useCallback(
    async (taskId: string, currentCompleted: boolean) => {
      if (!data || 'error' in data) return;
      setToggling(taskId);
      const newCompleted = !currentCompleted;
      // Optimistic update
      mutate(
        {
          ...data,
          tasks: data.tasks.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  completed: newCompleted,
                  completed_by: newCompleted ? 'you' : null,
                  completed_at: newCompleted ? new Date().toISOString() : null,
                  status: newCompleted ? ('completed' as const) : ('upcoming' as const),
                }
              : t
          ),
        },
        false
      );
      try {
        await fetch(`/api/command-center/checklist/${dealId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, completed: newCompleted }),
        });
        mutate();
        // Also refresh the task summary counts in the parent
        globalMutate('/api/command-center/tasks/summary');
      } catch {
        mutate();
      }
      setToggling(null);
    },
    [data, dealId, mutate]
  );

  if (isLoading) {
    return (
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              height: 40,
              borderRadius: 8,
              background: 'rgba(91,106,113,0.06)',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        ))}
      </div>
    );
  }
  // Type guard: check if data is an error response
  if (error || !data || 'error' in data) {
    const errorMsg = data && 'error' in data ? data.details || data.error : 'Failed to load tasks';
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: 13,
        }}
      >
        Failed to load tasks
        {errorMsg && (
          <div style={{ fontSize: 11, marginTop: 8, color: '#ef4444' }}>{errorMsg}</div>
        )}
      </div>
    );
  }

  // Type guard: check if tasks array exists
  if (!data.tasks || !Array.isArray(data.tasks)) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: 13,
        }}
      >
        No tasks available
      </div>
    );
  }

  const tasks = data.tasks;
  const totalCompleted = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const pctComplete = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const overdueCount = tasks.filter(
    t => !t.completed && (t.status === 'overdue' || t.status === 'critical')
  ).length;

  const phases: { key: Phase; tasks: ChecklistTask[] }[] = PHASE_ORDER.map(phaseKey => ({
    key: phaseKey,
    tasks: tasks.filter(t => t.phase === phaseKey),
  }));

  return (
    <div
      style={{
        padding: '16px 20px 20px',
        borderTop: '1px solid var(--color-border)',
        background: 'rgba(91,106,113,0.02)',
      }}
    >
      {/* Summary bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
          padding: '12px 16px',
          borderRadius: 8,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Mini progress ring */}
        <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeDasharray={`${(pctComplete / 100) * 100.5} 100.5`}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
              style={{ transition: 'stroke-dasharray 0.4s ease' }}
            />
          </svg>
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: '#f59e0b',
            }}
          >
            {pctComplete}%
          </span>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
            {totalCompleted}/{totalTasks} tasks
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            {overdueCount > 0 ? (
              <span style={{ color: '#ef4444', fontWeight: 600 }}>{overdueCount} overdue</span>
            ) : (
              'On track'
            )}
          </p>
        </div>
        {/* Phase mini indicators */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {phases
            .filter(p => p.tasks.length > 0)
            .map(p => {
              const cfg = PHASE_CONFIG[p.key];
              const done = p.tasks.filter(t => t.completed).length;
              const allDone = done === p.tasks.length;
              return (
                <span
                  key={p.key}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: allDone ? 'rgba(16,185,129,0.1)' : cfg.bg,
                    color: allDone ? '#10b981' : cfg.color,
                  }}
                >
                  P{p.key.replace('phase_', '')} {done}/{p.tasks.length}
                </span>
              );
            })}
        </div>
      </div>

      {/* Phase sections */}
      {phases
        .filter(p => p.tasks.length > 0)
        .map(p => {
          const cfg = PHASE_CONFIG[p.key];
          const done = p.tasks.filter(t => t.completed).length;
          const phasePct = p.tasks.length > 0 ? Math.round((done / p.tasks.length) * 100) : 0;
          const isCollapsed = collapsedPhases[p.key] ?? true; // Collapsed by default

          return (
            <div
              key={p.key}
              style={{
                marginBottom: 8,
                borderRadius: 8,
                border: `1px solid ${cfg.border}`,
                overflow: 'hidden',
                background: 'var(--color-surface)',
              }}
            >
              {/* Phase header */}
              <button
                onClick={() => togglePhase(p.key)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: cfg.bg,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: cfg.color,
                    transition: 'transform 0.2s',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  }}
                >
                  ▼
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: cfg.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {PHASES[p.key].label}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {done}/{p.tasks.length}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    background: 'rgba(91,106,113,0.08)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    marginLeft: 4,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${phasePct}%`,
                      background: cfg.color,
                      borderRadius: 2,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: cfg.color,
                    minWidth: 32,
                    textAlign: 'right',
                  }}
                >
                  {phasePct}%
                </span>
              </button>

              {/* Task rows */}
              {!isCollapsed && (
                <div style={{ padding: '4px 0' }}>
                  {p.tasks.map((task, ti) => {
                    const statusStyle =
                      STATUS_COLORS[task.status] || STATUS_COLORS.no_due_date;
                    return (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 16px',
                          borderBottom:
                            ti < p.tasks.length - 1 ? '1px solid var(--color-border)' : 'none',
                          opacity: toggling === task.id ? 0.6 : 1,
                          transition: 'opacity 0.15s',
                        }}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggle(task.id, task.completed)}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            flexShrink: 0,
                            cursor: 'pointer',
                            border: `2px solid ${task.completed ? cfg.color : 'rgba(91,106,113,0.3)'}`,
                            background: task.completed ? cfg.color : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {task.completed && (
                            <span style={{ fontSize: 12, color: '#fff', lineHeight: 1 }}>✓</span>
                          )}
                        </button>

                        {/* Label */}
                        <span
                          style={{
                            flex: 1,
                            fontSize: 12,
                            color: task.completed
                              ? 'var(--color-text-secondary)'
                              : 'var(--color-text)',
                            textDecoration: task.completed ? 'line-through' : 'none',
                            textDecorationColor: 'rgba(91,106,113,0.4)',
                          }}
                        >
                          {task.label}
                        </span>

                        {/* Owner badge */}
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 3,
                            background: 'rgba(91,106,113,0.08)',
                            color: 'var(--color-text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            whiteSpace: 'nowrap',
                          }}
                        >
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
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 22,
                              height: 22,
                              borderRadius: 4,
                              flexShrink: 0,
                              background: 'rgba(59,130,246,0.1)',
                              color: '#3b82f6',
                              fontSize: 12,
                              textDecoration: 'none',
                              transition: 'background 0.15s ease',
                            }}
                            title="Open resource"
                          >
                            ↗
                          </a>
                        )}

                        {/* Status badge */}
                        {!task.completed && task.status !== 'no_due_date' && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: 3,
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              border: `1px solid ${statusStyle.border}`,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {task.countdown_display}
                          </span>
                        )}

                        {/* Hard gate indicator */}
                        {!task.is_hard_gate && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: 3,
                              background: 'rgba(91,106,113,0.06)',
                              color: 'var(--color-text-secondary)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Optional
                          </span>
                        )}

                        {/* Completed date */}
                        {task.completed && task.completed_at && (
                          <span
                            style={{
                              fontSize: 10,
                              color: 'var(--color-text-secondary)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {new Date(task.completed_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
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

// ── Main Table Component ──────────────────────────────────────────────────────

interface AdvisorTableProps {
  deals: Deal[];
  activeTab: TabKey;
  sentimentMap: Record<string, SentimentScore>;
  taskMap: Record<string, TaskSummary>;
  alertMap: Record<string, number>;
  scoreAdvisor: (dealId: string) => void;
  scoring: Record<string, boolean>;
  sortCol: string;
  setSortCol: (col: string) => void;
  sortDir: 'asc' | 'desc';
  setSortDir: (dir: 'asc' | 'desc') => void;
}

export function AdvisorTable({
  deals,
  activeTab,
  sentimentMap,
  taskMap,
  alertMap,
  scoreAdvisor,
  scoring,
  sortCol,
  setSortCol,
  sortDir,
  setSortDir,
}: AdvisorTableProps) {
  const { THEME } = useTheme();
  const STAGE_COLORS = useMemo(() => getStageColors(), []);
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);

  const showSentiment = activeTab === 'launch' || activeTab === 'completed';
  const gridCols = showSentiment
    ? '1.6fr 1fr 0.7fr 0.9fr 0.7fr 0.7fr 0.8fr 0.8fr 0.8fr'
    : '1.8fr 1.2fr 0.8fr 1fr 0.7fr 0.7fr 0.9fr 0.9fr';

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const arrow = (col: string) => (sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');

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

  if (deals.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 40,
          color: 'var(--color-text-secondary)',
          fontSize: 14,
        }}
      >
        No advisors match your filters
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Table header — sortable */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          gap: 16,
          padding: '12px 20px',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-secondary)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {cols.map(col => (
          <span
            key={col.key}
            onClick={() => handleSort(col.key)}
            style={{ cursor: 'pointer', userSelect: 'none', textAlign: col.align }}
          >
            {col.label}
            {arrow(col.key)}
          </span>
        ))}
      </div>

      {/* Rows */}
      {deals.map(deal => {
        const stageColor = STAGE_COLORS[deal.dealstage] ?? 'var(--color-text-secondary)';
        const stageLabel = STAGE_LABELS[deal.dealstage] ?? deal.dealstage;
        const shortStage = stageLabel.replace(/Step \d+ – /, '');
        const aum = deal.transferable_aum ? Number(deal.transferable_aum) : null;
        const dateVal =
          activeTab === 'completed'
            ? deal.actual_launch_date || deal.desired_start_date
            : deal.desired_start_date;
        const sentiment = sentimentMap[deal.id];
        const isScoring = scoring[deal.id];
        const isExpanded = expandedDealId === deal.id;

        return (
          <div
            key={deal.id}
            style={{
              borderRadius: 8,
              overflow: 'hidden',
              border: `1px solid ${isExpanded ? '#3B5A69' : 'var(--color-border)'}`,
              background: 'var(--color-surface)',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
          >
            {/* Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                gap: 16,
                padding: '16px 20px',
                alignItems: 'center',
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
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    flexShrink: 0,
                    transition: 'transform 0.2s ease',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                >
                  ▶
                </span>
                <Link
                  href={`/command-center/advisor/${deal.id}`}
                  style={{ textDecoration: 'none' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontVariantNumeric: 'tabular-nums',
                        cursor: 'pointer',
                      }}
                    >
                      {deal.dealname || '—'}
                    </p>
                    {deal.firm_type && (
                      <p
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-secondary)',
                          marginTop: 2,
                        }}
                      >
                        {deal.firm_type}
                      </p>
                    )}
                  </div>
                </Link>
              </div>

              {/* Current Firm */}
              <p style={{ fontSize: 13, color: 'var(--color-text)' }}>
                {deal.current_firm__cloned_ || '—'}
              </p>

              {/* AUM */}
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  textAlign: 'right',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatAUM(aum)}
              </p>

              {/* Stage Badge */}
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: `${stageColor}18`,
                    color: stageColor,
                  }}
                >
                  {shortStage}
                </span>
                {activeTab === 'launch' && deal.daysSinceLaunch !== null && (
                  <p
                    style={{
                      fontSize: 10,
                      color: 'var(--color-text-secondary)',
                      marginTop: 3,
                    }}
                  >
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
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        scoreAdvisor(deal.id);
                      }}
                      style={{
                        padding: '4px 10px',
                        fontSize: 10,
                        fontWeight: 600,
                        borderRadius: 4,
                        border: '1px solid var(--color-border)',
                        background: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontVariantNumeric: 'tabular-nums',
                        transition: 'color 150ms ease, border-color 150ms ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#3B5A69';
                        e.currentTarget.style.borderColor = '#3B5A69';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                      }}
                    >
                      ✦ Score
                    </button>
                  )}
                </div>
              )}

              {/* Tasks */}
              {(() => {
                const t = taskMap[deal.id];
                if (!t)
                  return (
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-secondary)',
                        fontStyle: 'italic',
                      }}
                    >
                      —
                    </span>
                  );
                const phaseLabel = t.current_phase ? t.current_phase.replace('phase_', 'P') : '—';
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: t.open_tasks > 0 ? THEME.colors.warning : THEME.colors.success,
                      }}
                    >
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
                if (count === 0)
                  return (
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>—</span>
                  );
                return (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: THEME.colors.errorBg,
                      color: THEME.colors.error,
                    }}
                  >
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
  );
}
