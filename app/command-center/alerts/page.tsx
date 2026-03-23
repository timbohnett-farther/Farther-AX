'use client';

import useSWR from 'swr';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DataCard, StatCard } from '@/components/ui';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Alert {
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

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AlertsPage() {
  const { data, isLoading, error } = useSWR('/api/command-center/alerts', fetcher, { refreshInterval: 300_000 });
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterGate, setFilterGate] = useState<boolean>(false);

  if (isLoading) return <div className="px-10 py-16 text-slate">Loading alerts...</div>;
  if (error) return <div className="px-10 py-16 text-red-600">Failed to load alerts.</div>;

  const alerts: Alert[] = data?.alerts ?? [];
  const totalAlerts = data?.total ?? 0;
  const hardGateAlerts = data?.hard_gates ?? 0;

  // Get unique owners for filter
  const owners = Array.from(new Set(alerts.map(a => a.owner))).sort();

  let filtered = alerts;
  if (filterOwner !== 'all') filtered = filtered.filter(a => a.owner === filterOwner);
  if (filterGate) filtered = filtered.filter(a => a.is_hard_gate);

  // Group by advisor
  const grouped = new Map<string, { deal_id: string; deal_name: string; alerts: Alert[] }>();
  for (const a of filtered) {
    if (!grouped.has(a.deal_id)) {
      grouped.set(a.deal_id, { deal_id: a.deal_id, deal_name: a.deal_name, alerts: [] });
    }
    grouped.get(a.deal_id)!.alerts.push(a);
  }

  return (
    <div className="px-10 py-10 min-h-screen bg-transparent font-sans">
      <div className="relative mb-6">
        <Image src="/images/Farther_Symbol_RGB_Cream.svg" alt="" width={32} height={32} className="absolute top-0 right-0 opacity-50" />
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-cream font-serif mb-2">
            Onboarding Alerts
          </h1>
          <p className="text-slate text-sm">
            Tasks past their recommended due dates
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <StatCard
          title="Total Overdue"
          value={totalAlerts}
          className={totalAlerts > 0 ? 'bg-red-500/10 border-red-500/20' : ''}
        />
        <StatCard
          title="Hard Gate Blockers"
          value={hardGateAlerts}
          className={hardGateAlerts > 0 ? 'bg-amber-500/10 border-amber-500/20' : ''}
        />
        <StatCard
          title="Advisors Affected"
          value={Array.from(new Set(alerts.map(a => a.deal_id))).length}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="text-xs text-slate font-semibold uppercase tracking-wider">Filter:</span>
        <button
          onClick={() => setFilterGate(g => !g)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer transition-smooth ${
            filterGate ? 'bg-teal text-white' : 'bg-charcoal-700 text-slate hover:text-cream'
          }`}
        >
          Hard Gates Only
        </button>
        <select
          value={filterOwner}
          onChange={e => setFilterOwner(e.target.value)}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-charcoal-700 text-slate border border-cream-border cursor-pointer"
        >
          <option value="all">All Owners</option>
          {owners.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <DataCard className="text-center py-16">
          <p className="text-slate text-sm">
            {totalAlerts === 0 ? 'No overdue tasks. All on track!' : 'No alerts match current filters.'}
          </p>
        </DataCard>
      ) : (
        Array.from(grouped.values()).map(group => (
          <DataCard key={group.deal_id} className="mb-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-border mb-3">
              <Link href={`/command-center/advisor/${group.deal_id}`} className="no-underline">
                <h3 className="text-sm font-bold text-cream font-serif hover:text-teal cursor-pointer transition-smooth">
                  {group.deal_name}
                </h3>
              </Link>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-bold">
                {group.alerts.length} overdue
              </span>
            </div>
            <div className="space-y-0">
              {group.alerts.map(alert => (
                <div
                  key={alert.task_key}
                  className={`flex items-center gap-3 px-3 py-2.5 border-b border-cream-border last:border-b-0 ${
                    alert.is_hard_gate ? 'bg-red-500/5 border-l-2 border-l-red-500' : ''
                  }`}
                >
                  {alert.is_hard_gate && (
                    <span className="w-2 h-2 rounded-full bg-teal shrink-0" title="Hard gate" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-cream">{alert.task_label}</span>
                    <span className="text-[10px] text-slate ml-2">{alert.phase_label}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${ROLE_BADGE_COLORS[alert.owner] ?? 'bg-slate/15 text-slate'}`}>
                    {alert.owner}
                  </span>
                  <span className="text-[10px] text-red-400 font-bold whitespace-nowrap">
                    {alert.days_overdue}d overdue
                  </span>
                  <span className="text-[10px] text-slate whitespace-nowrap">
                    Due {formatDate(alert.due_date)}
                  </span>
                </div>
              ))}
            </div>
          </DataCard>
        ))
      )}
    </div>
  );
}
