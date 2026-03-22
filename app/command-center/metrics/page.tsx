'use client';

import useSWR from 'swr';
import { StatCard, MetricBar } from '@/components/ui';
import { formatCompactCurrency } from '@/lib/design-tokens';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const STAGE_LABELS: Record<string, string> = {
  '2496931': 'Step 1 – First Meeting',
  '2496932': 'Step 2 – Financial Model',
  '2496934': 'Step 3 – Advisor Demo',
  '100409509': 'Step 4 – Discovery Day',
  '2496935': 'Step 5 – Offer Review',
  '2496936': 'Step 6 – Offer Accepted',
  '100411705': 'Step 7 – Launched',
  '31214941': 'Holding Pattern',
  '2496937': 'Prospect Passed',
  '26572965': 'Farther Passed',
};

function formatAUM(n: number): string {
  if (!n || isNaN(n)) return '$0';
  return formatCompactCurrency(n);
}

/**
 * Metrics Dashboard - KPI tracking with StatCards
 *
 * Migrated to Tremor components (removed all inline styles)
 */
export default function MetricsDashboard() {
  const { data, error, isLoading } = useSWR('/api/command-center/metrics', fetcher, { refreshInterval: 43_200_000 });

  if (isLoading) {
    return (
      <div className="px-10 py-16 text-slate">
        Loading metrics…
      </div>
    );
  }

  if (error || data?.error) {
    return (
      <div className="px-10 py-16 text-red-600">
        Failed to load metrics.
      </div>
    );
  }

  const m = data ?? {};
  const cap = m.capacity ?? {};
  const avgAUMPerStaff = cap.totalAUM && cap.axmCount ? cap.totalAUM / cap.axmCount : 0;

  // Prepare transition data for MetricBar
  const transitionData = Object.entries(m.transitionBreakdown as Record<string, number> ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      name: type || 'Not set',
      value: count,
      color: 'teal' as const,
    }));

  // Prepare stage data for MetricBar
  const stageData = Object.entries(m.stageBreakdown as Record<string, number> ?? {})
    .sort((a, b) => {
      const order = ['2496931','2496932','2496934','100409509','2496935','2496936','100411705','31214941','2496937','26572965'];
      return order.indexOf(a[0]) - order.indexOf(b[0]);
    })
    .map(([stageId, count]) => ({
      name: STAGE_LABELS[stageId] ?? stageId,
      value: count,
      color: stageId === '100411705' ? ('teal' as const) : ('blue' as const),
    }));

  return (
    <div className="px-10 py-10 min-h-screen bg-transparent font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cream font-serif mb-2">
          AX Metrics
        </h1>
        <p className="text-slate text-sm">
          Live pipeline metrics · refreshes every 30s
        </p>
      </div>

      {/* Team Capacity */}
      <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4">
        Team Capacity
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="AXM/AXA Staff"
          value={String(cap.axmCount ?? 9)}
          subtitle="managing onboarding"
          icon={<UserGroupIcon className="h-6 w-6 text-teal" />}
        />
        <StatCard
          title="Total AUM"
          value={formatAUM(cap.totalAUM ?? 15e9)}
          subtitle="under management"
          icon={<CurrencyDollarIcon className="h-6 w-6 text-white" />}
          className="bg-teal text-white"
        />
        <StatCard
          title="Advisors"
          value={String(cap.advisorCount ?? 240)}
          subtitle="Farther platform"
          icon={<ChartBarIcon className="h-6 w-6 text-teal" />}
        />
        <StatCard
          title="AUM per Staff"
          value={formatAUM(avgAUMPerStaff)}
          subtitle="avg load"
          icon={<ArrowTrendingUpIcon className="h-6 w-6 text-teal" />}
        />
      </div>

      {/* Onboarded AUM */}
      <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4">
        Onboarded AUM
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="This Month"
          value={formatAUM(m.onboardedThisMonth?.aum ?? 0)}
          subtitle={`${m.onboardedThisMonth?.count ?? 0} advisors`}
        />
        <StatCard
          title="This Quarter"
          value={formatAUM(m.onboardedThisQuarter?.aum ?? 0)}
          subtitle={`${m.onboardedThisQuarter?.count ?? 0} advisors`}
        />
        <StatCard
          title="This Year"
          value={formatAUM(m.onboardedThisYear?.aum ?? 0)}
          subtitle={`${m.onboardedThisYear?.count ?? 0} advisors`}
          className="bg-teal text-white"
        />
      </div>

      {/* Pipeline AUM */}
      <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4">
        Upcoming Pipeline AUM
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Next 30 Days"
          value={formatAUM(m.pipeline30?.aum ?? 0)}
          subtitle={`${m.pipeline30?.count ?? 0} expected`}
        />
        <StatCard
          title="Next 60 Days"
          value={formatAUM(m.pipeline60?.aum ?? 0)}
          subtitle={`${m.pipeline60?.count ?? 0} expected`}
        />
        <StatCard
          title="Next 90 Days"
          value={formatAUM(m.pipeline90?.aum ?? 0)}
          subtitle={`${m.pipeline90?.count ?? 0} expected`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transition Type Breakdown */}
        {transitionData.length > 0 && (
          <MetricBar
            title="Transition Type Breakdown"
            data={transitionData}
          />
        )}

        {/* Stage Breakdown */}
        {stageData.length > 0 && (
          <MetricBar
            title="Pipeline by Stage"
            data={stageData}
          />
        )}
      </div>
    </div>
  );
}
