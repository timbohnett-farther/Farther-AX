'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { useTheme } from '@/lib/theme-provider';
import {
  CpuChipIcon,
  ShieldCheckIcon,
  EyeIcon,
  ArchiveBoxIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import type { AgentHealth, HealthStatus, DbAgentRun } from '@/lib/agents/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Agent icon mapping ──────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, typeof CpuChipIcon> = {
  sentinel_7: EyeIcon,
  pattern_31: CpuChipIcon,
  control_91: ShieldCheckIcon,
  archive_365: ArchiveBoxIcon,
  weekly: CalendarDaysIcon,
  monthly: CalendarDaysIcon,
  quarterly: CalendarDaysIcon,
  annual: CalendarDaysIcon,
};

// ── Health status display config ────────────────────────────────────────────

interface HealthConfig {
  label: string;
  dotColor: string;
  borderColor: string;
  bgColor: string;
}

function getHealthConfig(health: HealthStatus, THEME: ReturnType<typeof useTheme>['THEME']): HealthConfig {
  switch (health) {
    case 'healthy':
      return { label: 'Healthy', dotColor: THEME.colors.success, borderColor: THEME.colors.successBorder, bgColor: THEME.colors.successBg };
    case 'running':
      return { label: 'Running...', dotColor: THEME.colors.info, borderColor: THEME.colors.info, bgColor: THEME.colors.infoBg };
    case 'warning':
      return { label: 'Warning', dotColor: THEME.colors.warning, borderColor: THEME.colors.warningBorder, bgColor: THEME.colors.warningBg };
    case 'critical':
      return { label: 'Critical', dotColor: THEME.colors.error, borderColor: THEME.colors.errorBorder, bgColor: THEME.colors.errorBg };
    case 'stale':
      return { label: 'Stale', dotColor: THEME.colors.warning, borderColor: THEME.colors.warningBorder, bgColor: THEME.colors.warningBg };
    case 'disabled':
      return { label: 'Disabled', dotColor: THEME.colors.neutral, borderColor: THEME.colors.neutral, bgColor: THEME.colors.neutralBg };
    default:
      return { label: 'Unknown', dotColor: THEME.colors.neutral, borderColor: THEME.colors.neutral, bgColor: THEME.colors.neutralBg };
  }
}

// ── Time formatting helpers ─────────────────────────────────────────────────

function timeAgo(date: Date | string | null): string {
  if (!date) return 'Never';
  const ms = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function timeUntil(date: Date | string | null): { text: string; overdue: boolean } {
  if (!date) return { text: 'Not scheduled', overdue: false };
  const ms = new Date(date).getTime() - Date.now();
  if (ms < 0) {
    const overMin = Math.floor(-ms / 60_000);
    if (overMin < 60) return { text: `OVERDUE ${overMin}m`, overdue: true };
    const overHrs = Math.floor(overMin / 60);
    if (overHrs < 24) return { text: `OVERDUE ${overHrs}h`, overdue: true };
    return { text: `OVERDUE ${Math.floor(overHrs / 24)}d`, overdue: true };
  }
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return { text: `in ${minutes}m`, overdue: false };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { text: `in ${hours}h ${minutes % 60}m`, overdue: false };
  return { text: `in ${Math.floor(hours / 24)}d`, overdue: false };
}

function formatDuration(ms: number | null): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

// ── System Health Header ────────────────────────────────────────────────────

function SystemHealthHeader({ systemHealth, agentCount, enabledCount, THEME }: {
  systemHealth: string;
  agentCount: number;
  enabledCount: number;
  THEME: ReturnType<typeof useTheme>['THEME'];
}) {
  const config = getHealthConfig(systemHealth as HealthStatus, THEME);
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: THEME.colors.text }}>
          Agent Orchestration
        </h1>
        <p className="text-sm mt-1" style={{ color: THEME.colors.textSecondary }}>
          {enabledCount} of {agentCount} agents enabled — auto-refreshes every 30s
        </p>
      </div>
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ backgroundColor: config.bgColor, border: `1px solid ${config.borderColor}` }}>
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.dotColor, boxShadow: systemHealth === 'healthy' ? `0 0 6px ${config.dotColor}` : 'none' }} />
        <span className="text-sm font-semibold" style={{ color: config.dotColor }}>
          System: {config.label}
        </span>
      </div>
    </div>
  );
}

// ── Agent Card ──────────────────────────────────────────────────────────────

function AgentCard({ agent, THEME, onTrigger, triggering }: {
  agent: AgentHealth;
  THEME: ReturnType<typeof useTheme>['THEME'];
  onTrigger: (name: string) => void;
  triggering: string | null;
}) {
  const healthConfig = getHealthConfig(agent.health, THEME);
  const Icon = AGENT_ICONS[agent.agent_name] ?? CpuChipIcon;
  const nextDue = timeUntil(agent.next_due_at);
  const isTriggering = triggering === agent.agent_name;

  const groupColor = agent.agent_group === 'blueprint' ? THEME.colors.steelBlue400 : THEME.colors.clay400;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: THEME.colors.surface,
        border: `1px solid ${THEME.colors.border}`,
        borderLeft: `4px solid ${healthConfig.dotColor}`,
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${groupColor}20` }}>
            <Icon className="w-5 h-5" style={{ color: groupColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: THEME.colors.text }}>
                {agent.display_name}
              </h3>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium" style={{ color: groupColor, backgroundColor: `${groupColor}15` }}>
                {agent.agent_group}
              </span>
            </div>
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: THEME.colors.textMuted }}>
              {agent.description}
            </p>
          </div>
        </div>
        {/* Health badge */}
        <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1.5" style={{ color: healthConfig.dotColor, backgroundColor: healthConfig.bgColor }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: healthConfig.dotColor, animation: agent.health === 'running' ? 'pulse 2s infinite' : 'none' }} />
          {agent.health === 'warning' && agent.consecutive_failures > 0
            ? `Retrying (${agent.consecutive_failures}/${agent.max_retries})`
            : agent.health === 'critical'
              ? `Critical (${agent.consecutive_failures}/${agent.max_retries})`
              : healthConfig.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="px-4 pb-3 flex items-center gap-4 text-xs" style={{ color: THEME.colors.textSecondary }}>
        <div className="flex items-center gap-1">
          <ClockIcon className="w-3.5 h-3.5" />
          <span>Last: {timeAgo(agent.latest_run?.started_at ?? null)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: THEME.colors.textMuted }}>Duration:</span>
          <span>{formatDuration(agent.latest_run?.duration_ms ?? null)}</span>
        </div>
        {agent.latest_run?.records_processed != null && agent.latest_run.records_processed > 0 && (
          <div className="flex items-center gap-1">
            <span style={{ color: THEME.colors.textMuted }}>Records:</span>
            <span>{agent.latest_run.records_processed}</span>
          </div>
        )}
      </div>

      {/* Next run + dependencies + action */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          {/* Next due */}
          <span className={`font-medium ${nextDue.overdue ? 'animate-pulse' : ''}`} style={{ color: nextDue.overdue ? THEME.colors.error : THEME.colors.textSecondary }}>
            {agent.next_due_at ? `Due ${nextDue.text}` : 'Never run'}
          </span>
          {/* Dependencies */}
          {agent.depends_on.length > 0 && (
            <div className="flex items-center gap-1">
              <ChevronRightIcon className="w-3 h-3" style={{ color: THEME.colors.textMuted }} />
              {agent.depends_on.map(dep => (
                <span key={dep} className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{
                  color: agent.dependencies_fresh ? THEME.colors.success : THEME.colors.warning,
                  backgroundColor: agent.dependencies_fresh ? THEME.colors.successBg : THEME.colors.warningBg,
                }}>
                  {dep}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Run Now button */}
        <button
          onClick={() => onTrigger(agent.agent_name)}
          disabled={agent.is_running || isTriggering || !agent.enabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            backgroundColor: (agent.is_running || isTriggering) ? THEME.colors.neutralBg : `${THEME.colors.steelBlue700}15`,
            color: (agent.is_running || isTriggering) ? THEME.colors.textMuted : THEME.colors.steelBlue700,
            border: `1px solid ${(agent.is_running || isTriggering) ? THEME.colors.border : THEME.colors.steelBlue700}30`,
            cursor: (agent.is_running || isTriggering || !agent.enabled) ? 'not-allowed' : 'pointer',
            opacity: (agent.is_running || isTriggering || !agent.enabled) ? 0.5 : 1,
          }}
        >
          {isTriggering ? (
            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <PlayIcon className="w-3.5 h-3.5" />
          )}
          {isTriggering ? 'Starting...' : agent.is_running ? 'Running' : 'Run Now'}
        </button>
      </div>
    </div>
  );
}

// ── Dependency Diagram ──────────────────────────────────────────────────────

function DependencyDiagram({ agents, THEME }: { agents: AgentHealth[]; THEME: ReturnType<typeof useTheme>['THEME'] }) {
  const getAgent = (name: string) => agents.find(a => a.agent_name === name);

  function DepNode({ name }: { name: string }) {
    const agent = getAgent(name);
    if (!agent) return null;
    const config = getHealthConfig(agent.health, THEME);
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: config.bgColor, border: `1px solid ${config.borderColor}`, color: config.dotColor }}>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.dotColor }} />
        {agent.display_name}
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}` }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: THEME.colors.text }}>
        Dependency Chain
      </h3>
      <div className="flex flex-col gap-4">
        {/* Blueprint chain */}
        <div className="flex items-center gap-2 flex-wrap">
          <DepNode name="sentinel_7" />
          <ChevronRightIcon className="w-4 h-4" style={{ color: THEME.colors.textMuted }} />
          <DepNode name="pattern_31" />
          <ChevronRightIcon className="w-4 h-4" style={{ color: THEME.colors.textMuted }} />
          <DepNode name="control_91" />
          <span className="mx-4 text-xs" style={{ color: THEME.colors.textMuted }}>|</span>
          <DepNode name="archive_365" />
          <span className="text-xs" style={{ color: THEME.colors.textFaint }}>(independent)</span>
        </div>
        {/* Review agents */}
        <div className="flex items-center gap-2 flex-wrap">
          <DepNode name="weekly" />
          <span className="text-xs" style={{ color: THEME.colors.textMuted }}>|</span>
          <DepNode name="monthly" />
          <span className="text-xs" style={{ color: THEME.colors.textMuted }}>|</span>
          <DepNode name="quarterly" />
          <span className="text-xs" style={{ color: THEME.colors.textMuted }}>|</span>
          <DepNode name="annual" />
          <span className="text-xs" style={{ color: THEME.colors.textFaint }}>(all independent)</span>
        </div>
      </div>
    </div>
  );
}

// ── Run History Table ───────────────────────────────────────────────────────

function RunHistoryTable({ agents, THEME }: { agents: AgentHealth[]; THEME: ReturnType<typeof useTheme>['THEME'] }) {
  // Collect all recent runs across agents and sort by started_at desc
  const allRuns: (DbAgentRun & { display_name: string })[] = [];
  for (const agent of agents) {
    for (const run of agent.recent_runs) {
      allRuns.push({ ...run, display_name: agent.display_name });
    }
  }
  allRuns.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  const runs = allRuns.slice(0, 20);

  if (runs.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}` }}>
        <CpuChipIcon className="w-10 h-10 mx-auto mb-3" style={{ color: THEME.colors.textMuted }} />
        <p className="text-sm" style={{ color: THEME.colors.textSecondary }}>
          No agent runs yet. Trigger an agent manually or wait for the scheduler.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}` }}>
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${THEME.colors.border}` }}>
        <h3 className="text-sm font-semibold" style={{ color: THEME.colors.text }}>
          Recent Runs
        </h3>
        <span className="text-xs" style={{ color: THEME.colors.textMuted }}>
          Last 20 runs across all agents
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${THEME.colors.border}` }}>
              {['Agent', 'Status', 'Started', 'Duration', 'Records', 'Triggered By'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: THEME.colors.textSecondary }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs.map(run => {
              const statusIcon = run.run_status === 'completed' ? CheckCircleIcon
                : run.run_status === 'failed' ? XCircleIcon
                : ArrowPathIcon;
              const StatusIcon = statusIcon;
              const statusColor = run.run_status === 'completed' ? THEME.colors.success
                : run.run_status === 'failed' ? THEME.colors.error
                : THEME.colors.info;

              return (
                <tr key={run.id} style={{ borderBottom: `1px solid ${THEME.colors.borderSubtle}` }}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: THEME.colors.text }}>
                    {run.display_name}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <StatusIcon className={`w-3.5 h-3.5 ${run.run_status === 'running' ? 'animate-spin' : ''}`} style={{ color: statusColor }} />
                      <span style={{ color: statusColor }}>{run.run_status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: THEME.colors.textSecondary }}>
                    {timeAgo(run.started_at)}
                  </td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: THEME.colors.textSecondary }}>
                    {formatDuration(run.duration_ms)}
                  </td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: THEME.colors.textSecondary }}>
                    {run.records_processed ?? '-'}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: THEME.colors.textMuted }}>
                    {run.triggered_by}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const { THEME } = useTheme();
  const [triggering, setTriggering] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<{
    system_health: string;
    agent_count: number;
    enabled_count: number;
    agents: AgentHealth[];
  }>('/api/agents/status', fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });

  const handleTrigger = useCallback(async (agentName: string) => {
    setTriggering(agentName);
    try {
      const res = await fetch(`/api/agents/${agentName}/trigger`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error(`[Agents] Trigger failed:`, errData.error);
      }
      // Re-fetch status after a short delay to show updated state
      setTimeout(() => mutate(), 2000);
    } catch (err) {
      console.error('[Agents] Trigger error:', err);
    } finally {
      setTriggering(null);
    }
  }, [mutate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="px-8 py-8 space-y-4">
        <div className="shimmer h-8 w-64 rounded-lg mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="shimmer h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="px-8 py-16 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4" style={{ color: THEME.colors.error }} />
        <h2 className="text-lg font-semibold mb-2" style={{ color: THEME.colors.text }}>
          Failed to load agent status
        </h2>
        <p className="text-sm" style={{ color: THEME.colors.textSecondary }}>
          {error?.message ?? 'The agent_schedule table may not exist yet. Run the schema migration first.'}
        </p>
      </div>
    );
  }

  const { system_health, agent_count, enabled_count, agents } = data;
  const blueprintAgents = agents.filter(a => a.agent_group === 'blueprint');
  const reviewAgents = agents.filter(a => a.agent_group === 'review');

  return (
    <div className="px-8 py-8 space-y-6">
      <SystemHealthHeader
        systemHealth={system_health}
        agentCount={agent_count}
        enabledCount={enabled_count}
        THEME={THEME}
      />

      {/* Blueprint Agents */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: THEME.colors.steelBlue400 }}>
          Blueprint Agents
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {blueprintAgents.map(agent => (
            <AgentCard key={agent.agent_name} agent={agent} THEME={THEME} onTrigger={handleTrigger} triggering={triggering} />
          ))}
        </div>
      </div>

      {/* Review Agents */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: THEME.colors.clay400 }}>
          Review Agents
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reviewAgents.map(agent => (
            <AgentCard key={agent.agent_name} agent={agent} THEME={THEME} onTrigger={handleTrigger} triggering={triggering} />
          ))}
        </div>
      </div>

      {/* Dependency Diagram */}
      <DependencyDiagram agents={agents} THEME={THEME} />

      {/* Run History */}
      <RunHistoryTable agents={agents} THEME={THEME} />
    </div>
  );
}
