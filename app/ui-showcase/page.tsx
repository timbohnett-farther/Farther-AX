'use client';

import React, { useState } from 'react';
import {
  StatCard,
  ChartContainer,
  StatusBadge,
  ProgressIndicator,
  MetricBar,
  ScoreBadge,
  DataCard,
  FilterBar,
  TabGroup,
} from '@/components/ui';
import { AreaChart, BarChart, LineChart, DonutChart } from '@tremor/react';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { formatCompactCurrency } from '@/lib/design-tokens';

/**
 * UI Showcase - Component Library Reference
 *
 * Demonstrates all Tremor-based components with Farther branding
 * Use this as a visual reference during development
 */
export default function UIShowcasePage() {
  const [searchValue, setSearchValue] = useState('');
  const [filterValue, setFilterValue] = useState('');

  // Sample chart data
  const chartData = [
    { date: 'Jan', 'AUM': 12.5, 'Revenue': 1.2 },
    { date: 'Feb', 'AUM': 13.2, 'Revenue': 1.3 },
    { date: 'Mar', 'AUM': 14.8, 'Revenue': 1.5 },
    { date: 'Apr', 'AUM': 15.1, 'Revenue': 1.6 },
    { date: 'May', 'AUM': 16.3, 'Revenue': 1.7 },
    { date: 'Jun', 'AUM': 17.2, 'Revenue': 1.8 },
  ];

  const teamData = [
    { name: 'John Smith', value: 85, color: 'emerald' as const },
    { name: 'Sarah Johnson', value: 72, color: 'blue' as const },
    { name: 'Mike Davis', value: 65, color: 'amber' as const },
    { name: 'Emily Chen', value: 45, color: 'orange' as const },
  ];

  const allocationData = [
    { name: 'Equities', value: 60, color: 'blue' as const },
    { name: 'Fixed Income', value: 25, color: 'emerald' as const },
    { name: 'Alternatives', value: 10, color: 'amber' as const },
    { name: 'Cash', value: 5, color: 'gray' as const },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-cream-dark p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-serif font-bold text-charcoal mb-4">
            Farther UI Component Library
          </h1>
          <p className="text-lg text-slate">
            Tremor-based components with Farther branding and premium glass effects
          </p>
        </div>

        {/* Stat Cards */}
        <section>
          <h2 className="text-3xl font-serif font-semibold text-charcoal mb-6">
            Stat Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total AUM"
              value={formatCompactCurrency(15234567890)}
              delta="+12.3%"
              deltaType="increase"
              icon={<CurrencyDollarIcon className="h-6 w-6 text-teal" />}
              subtitle="As of March 2026"
            />
            <StatCard
              title="Active Clients"
              value="1,247"
              delta="+8.5%"
              deltaType="increase"
              icon={<UserGroupIcon className="h-6 w-6 text-teal" />}
            />
            <StatCard
              title="Monthly Revenue"
              value={formatCompactCurrency(1850000)}
              delta="-2.1%"
              deltaType="decrease"
              icon={<ChartBarIcon className="h-6 w-6 text-teal" />}
            />
            <StatCard
              title="Net Flows (R12M)"
              value={formatCompactCurrency(345000000)}
              delta="Stable"
              deltaType="unchanged"
              icon={<ArrowTrendingUpIcon className="h-6 w-6 text-teal" />}
            />
          </div>
        </section>

        {/* Status Badges */}
        <section>
          <h2 className="text-3xl font-serif font-semibold text-charcoal mb-6">
            Status Badges
          </h2>
          <DataCard title="Various Status States">
            <div className="flex flex-wrap gap-3">
              <StatusBadge status="success" />
              <StatusBadge status="warning" />
              <StatusBadge status="danger" />
              <StatusBadge status="info" />
              <StatusBadge status="pending" />
              <StatusBadge status="active" />
              <StatusBadge status="inactive" />
              <StatusBadge status="completed" text="Completed Onboarding" />
              <StatusBadge status="in-progress" text="In Progress" />
            </div>
          </DataCard>
        </section>

        {/* Score Badges */}
        <section>
          <h2 className="text-3xl font-serif font-semibold text-charcoal mb-6">
            Score Badges
          </h2>
          <DataCard title="Complexity & Health Scores">
            <div className="flex flex-wrap gap-3">
              <ScoreBadge score={95} label="Health Score" />
              <ScoreBadge score={78} label="Strategic Value" />
              <ScoreBadge score={62} label="Complexity" />
              <ScoreBadge score={45} label="Churn Risk" />
              <ScoreBadge score={25} label="Data Quality" />
              <ScoreBadge score={88} showValue={false} />
            </div>
          </DataCard>
        </section>

        {/* Progress Indicators */}
        <section>
          <h2 className="text-3xl font-serif font-semibold text-charcoal mb-6">
            Progress Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DataCard>
              <ProgressIndicator
                label="Launch Progress"
                value={75}
                color="teal"
                markers={[
                  { value: 50, label: 'Midpoint' },
                  { value: 100, label: 'Goal' },
                ]}
              />
            </DataCard>
            <DataCard>
              <ProgressIndicator
                label="AUM Target ($20M)"
                value={15234567}
                maxValue={20000000}
                color="emerald"
              />
            </DataCard>
          </div>
        </section>

        {/* Metric Bars */}
        <section>
          <h2 className="text-3xl font-serif font-semibold text-charcoal mb-6">
            Metric Bars
          </h2>
          <MetricBar
            title="Team Workload"
            subtitle="Capacity utilization by advisor"
            data={teamData}
            valueFormatter={(value) => `${value}%`}
          />
        </section>

        {/* Charts */}
        <section>
          <h2 className="text-3xl font-serif font-semibold text-charcoal mb-6">
            Chart Containers
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="AUM Growth"
              subtitle="Monthly trend (millions)"
            >
              <AreaChart
                data={chartData}
                index="date"
                categories={['AUM']}
                colors={['teal']}
                valueFormatter={(value) => formatCompactCurrency(value * 1000000)}
              />
            </ChartContainer>

            <ChartContainer
              title="Revenue Tracking"
              subtitle="Monthly revenue (millions)"
            >
              <BarChart
                data={chartData}
                index="date"
                categories={['Revenue']}
                colors={['blue']}
                valueFormatter={(value) => formatCompactCurrency(value * 1000000)}
              />
            </ChartContainer>

            <ChartContainer
              title="Performance Trend"
              subtitle="6-month comparison"
            >
              <LineChart
                data={chartData}
                index="date"
                categories={['AUM', 'Revenue']}
                colors={['teal', 'blue']}
                valueFormatter={(value) => formatCompactCurrency(value * 1000000)}
              />
            </ChartContainer>

            <ChartContainer
              title="Asset Allocation"
              subtitle="Portfolio composition"
            >
              <DonutChart
                data={allocationData}
                category="value"
                index="name"
                colors={['blue', 'emerald', 'amber', 'gray']}
                valueFormatter={(value) => `${value}%`}
              />
            </ChartContainer>
          </div>
        </section>

        {/* Filter Bar */}
        <section>
          <h2 className="text-3xl font-serif font-semibold text-charcoal mb-6">
            Filter Bar
          </h2>
          <DataCard>
            <FilterBar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              searchPlaceholder="Search advisors..."
              filters={[
                {
                  label: 'Status',
                  value: filterValue,
                  onChange: setFilterValue,
                  options: [
                    { value: 'all', label: 'All Statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'inactive', label: 'Inactive' },
                  ],
                },
              ]}
              actions={
                <button className="px-4 py-2 bg-teal text-white rounded-lg font-medium hover:bg-teal-dark transition-smooth">
                  Export
                </button>
              }
            />
          </DataCard>
        </section>

        {/* Tab Group */}
        <section>
          <h2 className="text-3xl font-serif font-semibold text-charcoal mb-6">
            Tab Group
          </h2>
          <TabGroup
            tabs={[
              {
                label: 'Overview',
                badge: 12,
                content: (
                  <DataCard>
                    <p className="text-gray-700">
                      Overview content with 12 items. This demonstrates the tab panel content area.
                    </p>
                  </DataCard>
                ),
              },
              {
                label: 'Analytics',
                badge: 8,
                content: (
                  <DataCard>
                    <p className="text-gray-700">
                      Analytics content with 8 items. Each tab can contain complex layouts.
                    </p>
                  </DataCard>
                ),
              },
              {
                label: 'Settings',
                content: (
                  <DataCard>
                    <p className="text-gray-700">
                      Settings content without a badge. Badges are optional.
                    </p>
                  </DataCard>
                ),
              },
            ]}
          />
        </section>

        {/* Data Cards */}
        <section>
          <h2 className="text-3xl font-serif font-semibold text-charcoal mb-6">
            Data Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DataCard
              title="Basic Card"
              subtitle="Simple content container"
              decoration="top"
              decorationColor="teal"
            >
              <p className="text-gray-700">
                This is a basic data card with glass morphism effect.
                Perfect for grouping related content.
              </p>
            </DataCard>

            <DataCard
              title="Card with Action"
              subtitle="Header with button"
              action={
                <button className="px-3 py-1.5 text-sm bg-teal text-white rounded-lg hover:bg-teal-dark transition-smooth">
                  View All
                </button>
              }
            >
              <p className="text-gray-700">
                Cards can include action buttons in the header for quick access to features.
              </p>
            </DataCard>
          </div>
        </section>

        {/* Premium Effects Demo */}
        <section>
          <h2 className="text-3xl font-serif font-semibold text-charcoal mb-6">
            Premium CSS Effects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-serif font-semibold mb-2">Glass Card</h3>
              <p className="text-sm text-gray-600">
                Hover to see elevation effect
              </p>
            </div>

            <div className="stat-card">
              <h3 className="text-lg font-serif font-semibold mb-2">Stat Card</h3>
              <p className="text-sm text-gray-600">
                Hover to see top border accent
              </p>
            </div>

            <div className="chart-card">
              <h3 className="text-lg font-serif font-semibold mb-2">Chart Card</h3>
              <p className="text-sm text-gray-600">
                Frosted glass with blur
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-12 pb-8">
          <p className="text-slate">
            Component library built with Tremor UI and Farther branding
          </p>
          <p className="text-sm text-gray-500 mt-2">
            All components support responsive layouts and dark mode variants
          </p>
        </div>

      </div>
    </div>
  );
}
