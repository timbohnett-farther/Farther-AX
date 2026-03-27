'use client';

import useSWR from 'swr';
import { useState } from 'react';
import Image from 'next/image';
import { StatCard, MetricBar, DataCard } from '@/components/ui';
import { formatCompactCurrency } from '@/lib/design-tokens';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  HomeModernIcon,
  BanknotesIcon,
  XMarkIcon,
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
  const [selectedMetric, setSelectedMetric] = useState<{
    title: string;
    category: string;
    data: any;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="px-10 py-8 space-y-4">
        <div className="shimmer h-8 w-48 rounded-lg mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[1,2,3,4].map(i => <div key={i} className="shimmer h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[1,2,3,4].map(i => <div key={i} className="shimmer h-24 rounded-xl" />)}
        </div>
        {[1,2,3].map(i => <div key={i} className="shimmer h-16 rounded-lg" />)}
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
  const roles = m.teamRoles ?? {};
  const stats = m.launchedStats ?? {};

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

  // Prepare firm type data for MetricBar
  const firmTypeData = Object.entries(m.firmTypeBreakdown as Record<string, number> ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      name: type || 'Not set',
      value: count,
      color: 'indigo' as const,
    }));

  return (
    <div className="px-10 py-10 min-h-screen bg-transparent font-sans">
      <div className="relative mb-8">
        <Image src="/images/Farther_Symbol_RGB_Cream.svg" alt="" width={32} height={32} className="absolute top-0 right-0 opacity-50" />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cream font-serif mb-2">
            AX Metrics
          </h1>
          <p className="text-slate text-sm">
            Live pipeline metrics · refreshes every 12 hours
          </p>
        </div>
      </div>

      {/* Team Capacity */}
      <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4">
        Team Capacity
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="AX Staff"
          value={String(cap.axStaff ?? 0)}
          subtitle="AXM + AXA"
          icon={<UserGroupIcon className="h-6 w-6 text-teal" />}
          onClick={() => setSelectedMetric({
            title: 'AX Staff',
            category: 'Team Capacity',
            data: { 'Total AX Staff': cap.axStaff ?? 0, 'AXMs': roles['AXM'] ?? 0, 'AXAs': roles['AXA'] ?? 0 }
          })}
        />
        <StatCard
          title="Platform AUM"
          value={formatAUM(cap.platformAUM ?? 0)}
          subtitle="managed accounts"
          icon={<CurrencyDollarIcon className="h-6 w-6 text-white" />}
          className="bg-teal text-white"
          onClick={() => setSelectedMetric({
            title: 'Platform AUM',
            category: 'Team Capacity',
            data: { 'Total Platform AUM': cap.platformAUM ?? 0, 'Launched Advisors': cap.launchedAdvisors ?? 0 }
          })}
        />
        <StatCard
          title="Launched Advisors"
          value={String(cap.launchedAdvisors ?? 0)}
          subtitle="Step 7 – Launched"
          icon={<ChartBarIcon className="h-6 w-6 text-teal" />}
          onClick={() => setSelectedMetric({
            title: 'Launched Advisors',
            category: 'Team Capacity',
            data: { 'Total Launched': cap.launchedAdvisors ?? 0, 'Platform AUM': cap.platformAUM ?? 0 }
          })}
        />
        <StatCard
          title="AUM per Staff"
          value={formatAUM(cap.aumPerStaff ?? 0)}
          subtitle="platform AUM / AX staff"
          icon={<ArrowTrendingUpIcon className="h-6 w-6 text-teal" />}
          onClick={() => setSelectedMetric({
            title: 'AUM per Staff',
            category: 'Team Capacity',
            data: { 'AUM per Staff': cap.aumPerStaff ?? 0, 'Platform AUM': cap.platformAUM ?? 0, 'Total Staff': cap.axStaff ?? 0 }
          })}
        />
      </div>

      {/* Launched Advisor Stats */}
      <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4">
        Launched Advisor Stats
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Revenue"
          value={formatAUM(stats.totalRevenue ?? 0)}
          subtitle="annual fee revenue"
          icon={<BanknotesIcon className="h-6 w-6 text-teal" />}
          className="bg-teal text-white"
          onClick={() => setSelectedMetric({
            title: 'Total Revenue',
            category: 'Launched Advisor Stats',
            data: { 'Annual Fee Revenue': stats.totalRevenue ?? 0, 'Total Households': stats.totalHouseholds ?? 0, 'Launched Advisors': cap.launchedAdvisors ?? 0 }
          })}
        />
        <StatCard
          title="Avg Days to Launch"
          value={stats.avgDaysToLaunch != null ? `${stats.avgDaysToLaunch}d` : '—'}
          subtitle="create → launch"
          icon={<ClockIcon className="h-6 w-6 text-teal" />}
          onClick={() => setSelectedMetric({
            title: 'Avg Days to Launch',
            category: 'Launched Advisor Stats',
            data: { 'Average Days': stats.avgDaysToLaunch ?? 0, 'Launched Advisors': cap.launchedAdvisors ?? 0 }
          })}
        />
        <StatCard
          title="Total Households"
          value={String(stats.totalHouseholds ?? 0)}
          subtitle="launched advisors"
          icon={<HomeModernIcon className="h-6 w-6 text-teal" />}
          onClick={() => setSelectedMetric({
            title: 'Total Households',
            category: 'Launched Advisor Stats',
            data: { 'Total Households': stats.totalHouseholds ?? 0, 'Launched Advisors': cap.launchedAdvisors ?? 0, 'Total Revenue': stats.totalRevenue ?? 0 }
          })}
        />
      </div>

      {/* Team Breakdown */}
      <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4">
        Team Breakdown
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="AXMs"
          value={String(roles['AXM'] ?? 0)}
          subtitle="Advisor Experience Managers"
          onClick={() => setSelectedMetric({
            title: 'AXMs',
            category: 'Team Breakdown',
            data: { 'Total AXMs': roles['AXM'] ?? 0, 'Total AX Staff': cap.axStaff ?? 0 }
          })}
        />
        <StatCard
          title="AXAs"
          value={String(roles['AXA'] ?? 0)}
          subtitle="Advisor Experience Associates"
          onClick={() => setSelectedMetric({
            title: 'AXAs',
            category: 'Team Breakdown',
            data: { 'Total AXAs': roles['AXA'] ?? 0, 'Total AX Staff': cap.axStaff ?? 0 }
          })}
        />
        <StatCard
          title="CTMs"
          value={String(roles['CTM'] ?? 0)}
          subtitle="Client Transition Managers"
          onClick={() => setSelectedMetric({
            title: 'CTMs',
            category: 'Team Breakdown',
            data: { 'Total CTMs': roles['CTM'] ?? 0 }
          })}
        />
        <StatCard
          title="CTAs"
          value={String(roles['CTA'] ?? 0)}
          subtitle="Client Transition Associates"
          onClick={() => setSelectedMetric({
            title: 'CTAs',
            category: 'Team Breakdown',
            data: { 'Total CTAs': roles['CTA'] ?? 0 }
          })}
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
          onClick={() => setSelectedMetric({
            title: 'This Month',
            category: 'Onboarded AUM',
            data: { 'AUM': m.onboardedThisMonth?.aum ?? 0, 'Advisors': m.onboardedThisMonth?.count ?? 0 }
          })}
        />
        <StatCard
          title="This Quarter"
          value={formatAUM(m.onboardedThisQuarter?.aum ?? 0)}
          subtitle={`${m.onboardedThisQuarter?.count ?? 0} advisors`}
          onClick={() => setSelectedMetric({
            title: 'This Quarter',
            category: 'Onboarded AUM',
            data: { 'AUM': m.onboardedThisQuarter?.aum ?? 0, 'Advisors': m.onboardedThisQuarter?.count ?? 0 }
          })}
        />
        <StatCard
          title="This Year"
          value={formatAUM(m.onboardedThisYear?.aum ?? 0)}
          subtitle={`${m.onboardedThisYear?.count ?? 0} advisors`}
          className="bg-teal text-white"
          onClick={() => setSelectedMetric({
            title: 'This Year',
            category: 'Onboarded AUM',
            data: { 'AUM': m.onboardedThisYear?.aum ?? 0, 'Advisors': m.onboardedThisYear?.count ?? 0 }
          })}
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
          onClick={() => setSelectedMetric({
            title: 'Next 30 Days',
            category: 'Upcoming Pipeline AUM',
            data: { 'Expected AUM': m.pipeline30?.aum ?? 0, 'Expected Advisors': m.pipeline30?.count ?? 0 }
          })}
        />
        <StatCard
          title="Next 60 Days"
          value={formatAUM(m.pipeline60?.aum ?? 0)}
          subtitle={`${m.pipeline60?.count ?? 0} expected`}
          onClick={() => setSelectedMetric({
            title: 'Next 60 Days',
            category: 'Upcoming Pipeline AUM',
            data: { 'Expected AUM': m.pipeline60?.aum ?? 0, 'Expected Advisors': m.pipeline60?.count ?? 0 }
          })}
        />
        <StatCard
          title="Next 90 Days"
          value={formatAUM(m.pipeline90?.aum ?? 0)}
          subtitle={`${m.pipeline90?.count ?? 0} expected`}
          onClick={() => setSelectedMetric({
            title: 'Next 90 Days',
            category: 'Upcoming Pipeline AUM',
            data: { 'Expected AUM': m.pipeline90?.aum ?? 0, 'Expected Advisors': m.pipeline90?.count ?? 0 }
          })}
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

        {/* Firm Type Breakdown */}
        {firmTypeData.length > 0 && (
          <MetricBar
            title="Firm Type Breakdown"
            data={firmTypeData}
          />
        )}
      </div>

      {/* Detail Panel - Slide in from right */}
      {selectedMetric && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-40"
            onClick={() => setSelectedMetric(null)}
          />

          {/* Slide-in Panel */}
          <div className="fixed top-0 right-0 h-full w-full md:w-2/3 lg:w-1/2 xl:w-1/3 bg-charcoal border-l border-slate/20 shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-cream font-serif mb-1">
                    {selectedMetric.title}
                  </h2>
                  <p className="text-slate text-sm">{selectedMetric.category}</p>
                </div>
                <button
                  onClick={() => setSelectedMetric(null)}
                  className="p-2 hover:bg-slate/10 rounded-lg transition-colors"
                  aria-label="Close detail view"
                >
                  <XMarkIcon className="h-6 w-6 text-slate" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {selectedMetric.data && typeof selectedMetric.data === 'object' && (
                  <>
                    {Object.entries(selectedMetric.data).map(([key, value]) => (
                      <DataCard key={key}>
                        <dt className="text-sm text-slate mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </dt>
                        <dd className="text-xl font-semibold text-cream tabular-nums">
                          {typeof value === 'number' && key.toLowerCase().includes('aum')
                            ? formatAUM(value)
                            : typeof value === 'number' && key.toLowerCase().includes('revenue')
                            ? formatAUM(value)
                            : String(value ?? '—')}
                        </dd>
                      </DataCard>
                    ))}
                  </>
                )}

                {selectedMetric.category === 'Team Capacity' && (
                  <div className="mt-6 p-4 bg-teal/10 border border-teal/20 rounded-lg">
                    <p className="text-sm text-slate">
                      <strong className="text-teal">Calculation:</strong>{' '}
                      {selectedMetric.title === 'AUM per Staff'
                        ? 'Platform AUM divided by total AX staff (AXM + AXA)'
                        : selectedMetric.title === 'AX Staff'
                        ? 'Total count of Advisor Experience Managers (AXM) and Advisor Experience Associates (AXA)'
                        : selectedMetric.title === 'Platform AUM'
                        ? 'Total AUM across all managed accounts'
                        : selectedMetric.title === 'Launched Advisors'
                        ? 'Count of advisors in Step 7 – Launched stage'
                        : 'Calculated from team data'}
                    </p>
                  </div>
                )}

                {selectedMetric.category === 'Launched Advisor Stats' && (
                  <div className="mt-6 p-4 bg-teal/10 border border-teal/20 rounded-lg">
                    <p className="text-sm text-slate">
                      <strong className="text-teal">About:</strong>{' '}
                      {selectedMetric.title === 'Total Revenue'
                        ? 'Annual fee revenue from all launched advisors'
                        : selectedMetric.title === 'Avg Days to Launch'
                        ? 'Average time from deal creation to launch date'
                        : selectedMetric.title === 'Total Households'
                        ? 'Total household count across all launched advisors'
                        : 'Metric for launched advisors'}
                    </p>
                  </div>
                )}

                {selectedMetric.category === 'Team Breakdown' && (
                  <div className="mt-6 p-4 bg-indigo/10 border border-indigo/20 rounded-lg">
                    <p className="text-sm text-slate mb-3">
                      <strong className="text-indigo">Role:</strong>{' '}
                      {selectedMetric.title === 'AXMs'
                        ? 'Advisor Experience Managers lead advisor relationships and oversee onboarding'
                        : selectedMetric.title === 'AXAs'
                        ? 'Advisor Experience Associates support advisors through operational tasks'
                        : selectedMetric.title === 'CTMs'
                        ? 'Client Transition Managers handle complex client transitions'
                        : selectedMetric.title === 'CTAs'
                        ? 'Client Transition Associates support client onboarding operations'
                        : 'Team member role'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
