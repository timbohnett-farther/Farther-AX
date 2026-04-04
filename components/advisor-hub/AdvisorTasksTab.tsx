'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { PHASES, PHASE_ORDER, TASKS, type Phase } from '@/lib/onboarding-tasks-v2';
import type { Deal } from './types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const SWR_OPTS = {
  refreshInterval: 8 * 60 * 60 * 1000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60 * 60 * 1000,
  keepPreviousData: true,
  errorRetryCount: 2,
} as const;

export function AdvisorTasksTab() {
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
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            fontSize: 12,
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            outline: 'none',
            flex: 1,
          }}
        >
          <option value="all">All Advisors</option>
          {advisors.map(a => (
            <option key={a.id} value={a.id}>
              {a.dealname}
            </option>
          ))}
        </select>

        {/* Phase filter */}
        <select
          value={selectedPhase}
          onChange={e => setSelectedPhase(e.target.value as Phase | 'all')}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            fontSize: 12,
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            outline: 'none',
            minWidth: 180,
          }}
        >
          <option value="all">All Phases</option>
          {PHASE_ORDER.map(phaseKey => (
            <option key={phaseKey} value={phaseKey}>
              {PHASES[phaseKey].label}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | 'pending' | 'completed')}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            fontSize: 12,
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            outline: 'none',
            minWidth: 140,
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Summary */}
      <div
        style={{
          padding: '16px 20px',
          background: 'rgba(59,90,105,0.05)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div>
            <p
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-text-secondary)',
                fontWeight: 600,
              }}
            >
              Total Advisor Tasks
            </p>
            <p
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#3B5A69',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontVariantNumeric: 'tabular-nums',
              }}
            >
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
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            color: 'var(--color-text-secondary)',
            fontSize: 14,
          }}
        >
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
                  padding: '16px 20px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  transition: 'border-color 150ms ease, box-shadow 150ms ease',
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* Phase badge */}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: 'rgba(59,90,105,0.1)',
                      color: '#3B5A69',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {phase.label.replace('Phase ', 'P')}
                  </span>

                  {/* Task info */}
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        marginBottom: 4,
                      }}
                    >
                      {task.label}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        gap: 16,
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        flexShrink: 0,
                        background: 'rgba(59,130,246,0.1)',
                        color: '#3b82f6',
                        fontSize: 14,
                        textDecoration: 'none',
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
