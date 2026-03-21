'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { BarChart, DonutChart, AreaChart } from '@tremor/react';
import { StatCard, ChartContainer } from '@/components/ui';
import { formatCompactCurrency } from '@/lib/design-tokens';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const STAGE_LABELS: Record<string, string> = {
  '2496931': 'S1 – First Meeting',
  '2496932': 'S2 – Financial Model',
  '2496934': 'S3 – Advisor Demo',
  '100409509': 'S4 – Discovery Day',
  '2496935': 'S5 – Offer Review',
  '2496936': 'S6 – Offer Accepted',
  '100411705': 'S7 – Launched',
  '31214941': 'Holding Pattern',
  '2496937': 'Prospect Passed',
  '26572965': 'Farther Passed',
};

const STAGE_ORDER = ['2496931','2496932','2496934','100409509','2496935','2496936','100411705','31214941','2496937','26572965'];

function formatAUM(n: number): string {
  if (!n || isNaN(n)) return '$0';
  return formatCompactCurrency(n);
}

/**
 * Metrics Dashboard - Executive-level KPI tracking with interactive charts
 */
export default function MetricsDashboard() {
  const { data, error, isLoading } = useSWR('/api/command-center/metrics', fetcher, { refreshInterval: 43_200_000 });
  const [pipelineView, setPipelineView] = useState<'chart' | 'funnel'>('chart');

  if (isLoading) {
    return (
      <div className="px-10 py-10 min-h-screen">
        <div className="mb-8">
          <div className="shimmer h-8 w-48 rounded-lg mb-3" />
          <div className="shimmer h-4 w-64 rounded" />
        </div>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="shimmer h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1,2,3].map(i => <div key={i} className="shimmer h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="shimmer h-64 rounded-xl" />)}
        </div>
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

  // Prepare stage data for BarChart
  const stageChartData = Object.entries(m.stageBreakdown as Record<string, number> ?? {})
    .sort((a, b) => STAGE_ORDER.indexOf(a[0]) - STAGE_ORDER.indexOf(b[0]))
    .filter(([stageId]) => STAGE_ORDER.indexOf(stageId) >= 0)
    .map(([stageId, count]) => ({
      stage: STAGE_LABELS[stageId] ?? stageId,
      Advisors: count,
    }));

  // Prepare transition data for DonutChart
  const transitionChartData = Object.entries(m.transitionBreakdown as Record<string, number> ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      name: type || 'Not Set',
      count,
    }));

  // Pipeline AUM data for AreaChart
  const pipelineAumData = [
    { period: '30 Days', AUM: m.pipeline30?.aum ?? 0, Advisors: m.pipeline30?.count ?? 0 },
    { period: '60 Days', AUM: m.pipeline60?.aum ?? 0, Advisors: m.pipeline60?.count ?? 0 },
    { period: '90 Days', AUM: m.pipeline90?.aum ?? 0, Advisors: m.pipeline90?.count ?? 0 },
  ];

  // Onboarded AUM trend data
  const onboardedData = [
    { period: 'This Month', AUM: m.onboardedThisMonth?.aum ?? 0, Count: m.onboardedThisMonth?.count ?? 0 },
    { period: 'This Quarter', AUM: m.onboardedThisQuarter?.aum ?? 0, Count: m.onboardedThisQuarter?.count ?? 0 },
    { period: 'This Year', AUM: m.onboardedThisYear?.aum ?? 0, Count: m.onboardedThisYear?.count ?? 0 },
  ];

  return (
    <div className="px-10 py-10 min-h-screen font-sans">
      {/* Header */}
      <div className="dashboard-section-header mb-8 border-b-0">
        <div>
          <h1 className="text-3xl font-bold text-charcoal font-serif mb-2">
            AX Metrics
          </h1>
          <p className="text-slate text-sm flex items-center gap-2">
            <span className="status-dot active bg-emerald-500 text-emerald-500" />
            Live pipeline metrics
          </p>
        </div>
      </div>

      {/* ═══ Team Capacity KPIs ═══ */}
      <div className="dashboard-section">
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4">
          Team Capacity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="AXM/AXA Staff"
            value={String(cap.axmCount ?? 9)}
            subtitle="managing onboarding"
            icon={<UserGroupIcon className="h-6 w-6 text-teal" />}
            live
          />
          <StatCard
            title="Total AUM"
            value={formatAUM(cap.totalAUM ?? 15e9)}
            subtitle="under management"
            icon={<CurrencyDollarIcon className="h-6 w-6 text-teal" />}
            accent="teal"
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
      </div>

      {/* ═══ Onboarded AUM with Chart ═══ */}
      <div className="dashboard-section">
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4">
          Onboarded AUM
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="This Month"
            value={formatAUM(m.onboardedThisMonth?.aum ?? 0)}
            subtitle={`${m.onboardedThisMonth?.count ?? 0} advisors`}
            icon={<CalendarDaysIcon className="h-6 w-6 text-teal" />}
          />
          <StatCard
            title="This Quarter"
            value={formatAUM(m.onboardedThisQuarter?.aum ?? 0)}
            subtitle={`${m.onboardedThisQuarter?.count ?? 0} advisors`}
            icon={<BanknotesIcon className="h-6 w-6 text-teal" />}
          />
          <StatCard
            title="This Year"
            value={formatAUM(m.onboardedThisYear?.aum ?? 0)}
            subtitle={`${m.onboardedThisYear?.count ?? 0} advisors`}
            accent="success"
          />
        </div>

        {/* Onboarded AUM Trend Chart */}
        <ChartContainer
          title="Onboarded AUM Trend"
          subtitle="Cumulative advisor AUM onboarded"
          metric={formatAUM(m.onboardedThisYear?.aum ?? 0)}
          metricDelta={`${m.onboardedThisYear?.count ?? 0} advisors YTD`}
          metricDeltaType="positive"
        >
          <BarChart
            data={onboardedData}
            index="period"
            categories={['AUM']}
            colors={['teal']}
            valueFormatter={(v) => formatAUM(v)}
            showLegend={false}
            showGridLines={false}
            className="h-48"
          />
        </ChartContainer>
      </div>

      {/* ═══ Pipeline Charts Grid ═══ */}
      <div className="dashboard-section">
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4">
          Pipeline Intelligence
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline Funnel */}
          <ChartContainer
            title="Pipeline by Stage"
            subtitle="Advisor count per recruitment stage"
            action={
              <div className="time-selector">
                <button
                  className={pipelineView === 'chart' ? 'active' : ''}
                  onClick={() => setPipelineView('chart')}
                >
                  Chart
                </button>
                <button
                  className={pipelineView === 'funnel' ? 'active' : ''}
                  onClick={() => setPipelineView('funnel')}
                >
                  Funnel
                </button>
              </div>
            }
          >
            <BarChart
              data={stageChartData}
              index="stage"
              categories={['Advisors']}
              colors={['teal']}
              layout={pipelineView === 'funnel' ? 'horizontal' : 'vertical'}
              showLegend={false}
              showGridLines={false}
              className="h-72"
            />
          </ChartContainer>

          {/* Transition Type Breakdown */}
          <ChartContainer
            title="Transition Type Mix"
            subtitle="Distribution by transition methodology"
          >
            <div className="flex items-center gap-8">
              <DonutChart
                data={transitionChartData}
                category="count"
                index="name"
                colors={['teal', 'blue', 'amber', 'emerald', 'rose', 'indigo']}
                showLabel={true}
                showAnimation={true}
                className="h-60 w-60"
              />
              <div className="flex-1 space-y-3">
                {transitionChartData.slice(0, 5).map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        ['bg-teal', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500'][i]
                      }`} />
                      <span className="text-sm text-charcoal">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-charcoal">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartContainer>
        </div>
      </div>

      {/* ═══ Upcoming Pipeline AUM ═══ */}
      <div className="dashboard-section">
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4">
          Upcoming Pipeline AUM
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Next 30 Days"
            value={formatAUM(m.pipeline30?.aum ?? 0)}
            subtitle={`${m.pipeline30?.count ?? 0} advisors expected`}
            accent="danger"
          />
          <StatCard
            title="Next 60 Days"
            value={formatAUM(m.pipeline60?.aum ?? 0)}
            subtitle={`${m.pipeline60?.count ?? 0} advisors expected`}
            accent="warning"
          />
          <StatCard
            title="Next 90 Days"
            value={formatAUM(m.pipeline90?.aum ?? 0)}
            subtitle={`${m.pipeline90?.count ?? 0} advisors expected`}
            accent="teal"
          />
        </div>

        <ChartContainer
          title="Pipeline AUM Horizon"
          subtitle="Expected AUM by time horizon"
        >
          <AreaChart
            data={pipelineAumData}
            index="period"
            categories={['AUM']}
            colors={['teal']}
            valueFormatter={(v) => formatAUM(v)}
            showLegend={false}
            showGridLines={false}
            curveType="monotone"
            className="h-48"
          />
        </ChartContainer>
      </div>
    </div>
  );
}
