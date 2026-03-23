'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  BarChart,
} from 'recharts';
import {
  CurrencyDollarIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StatCard, ChartContainer } from '@/components/ui';
import { PeriodSelector, MoMDelta } from '@/components/billing';
import { formatCompactCurrency, formatCurrency, colors } from '@/lib/design-tokens';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SWR_OPTS = {
  refreshInterval: 24 * 60 * 60 * 1000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60 * 60 * 1000,
  keepPreviousData: true,
  errorRetryCount: 2,
} as const;

type DeltaType = 'increase' | 'decrease' | 'unchanged' | 'moderateIncrease' | 'moderateDecrease';

function getDeltaType(val: number): DeltaType {
  if (val > 0) return 'increase';
  if (val < 0) return 'decrease';
  return 'unchanged';
}

function formatPeriodShort(p: string) {
  const d = new Date(p + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

const TIER_COLORS: Record<string, string> = {
  Principal: '#fbbf24',
  'Managing Director': '#2bb8c4',
  SVP: '#60a5fa',
  VP: '#8a9aa2',
  Associate: 'rgba(255,255,255,0.3)',
};

export default function BillingOverviewPage() {
  const [period, setPeriod] = useState<string>('');
  const { data, error, isLoading } = useSWR(
    `/api/command-center/billing/overview${period ? `?period=${period}` : ''}`,
    fetcher,
    SWR_OPTS,
  );

  const { data: alertData } = useSWR(
    period ? `/api/command-center/billing/alerts?period=${period}` : null,
    fetcher,
    SWR_OPTS,
  );

  if (isLoading) {
    return (
      <div className="px-10 py-8">
        <div className="shimmer h-10 w-64 rounded-xl mb-8" />
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => <div key={i} className="shimmer h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 shimmer h-80 rounded-xl" />
          <div className="col-span-2 shimmer h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="px-10 py-16 text-red-400">Error loading billing data</div>;
  }

  const { current: c, mom, timeSeries, revenueTiers, concentration, periods } = data;
  const selectedPeriod = data.selectedPeriod;

  // Update period state from server default on first load
  if (!period && selectedPeriod) {
    setPeriod(selectedPeriod);
  }

  const chartData = timeSeries.map((t: { period: string; totalAUM: number; totalRevenue: number; avgBps: number }) => ({
    ...t,
    label: formatPeriodShort(t.period),
    aumM: t.totalAUM / 1_000_000_000,
    revK: t.totalRevenue / 1_000,
  }));

  const alerts = alertData?.summary;

  return (
    <div className="px-10 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif mb-1">Billing Intelligence</h1>
          <p className="text-sm text-white/50">Executive overview across all teams and periods</p>
        </div>
        {periods && (
          <PeriodSelector
            periods={periods}
            selected={period || selectedPeriod}
            onChange={setPeriod}
          />
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total AUM"
          value={formatCompactCurrency(c.totalAUM)}
          delta={mom.aumChangePct ? `${mom.aumChangePct > 0 ? '+' : ''}${mom.aumChangePct.toFixed(1)}%` : undefined}
          deltaType={getDeltaType(mom.aumChangePct)}
          icon={<BuildingOffice2Icon className="w-5 h-5 text-teal" />}
        />
        <StatCard
          title="Billable AUM"
          value={formatCompactCurrency(c.billableAUM)}
          subtitle={`${((c.billableAUM / c.totalAUM) * 100).toFixed(1)}% of total`}
          icon={<ChartBarIcon className="w-5 h-5 text-teal" />}
        />
        <StatCard
          title="Total Revenue"
          value={formatCompactCurrency(c.totalRevenue)}
          delta={mom.revenueChangePct ? `${mom.revenueChangePct > 0 ? '+' : ''}${mom.revenueChangePct.toFixed(1)}%` : undefined}
          deltaType={getDeltaType(mom.revenueChangePct)}
          icon={<CurrencyDollarIcon className="w-5 h-5 text-teal" />}
        />
        <StatCard
          title="Avg BPS"
          value={c.weightedAvgBps.toFixed(1)}
          delta={mom.bpsChange ? `${mom.bpsChange > 0 ? '+' : ''}${mom.bpsChange.toFixed(1)} bps` : undefined}
          deltaType={getDeltaType(mom.bpsChange)}
          icon={<ChartBarIcon className="w-5 h-5 text-teal" />}
        />
        <StatCard
          title="Teams"
          value={c.teamCount}
          delta={mom.teamChange ? `${mom.teamChange > 0 ? '+' : ''}${mom.teamChange}` : undefined}
          deltaType={getDeltaType(mom.teamChange)}
          subtitle={`${c.relCount.toLocaleString()} relationships`}
          icon={<UserGroupIcon className="w-5 h-5 text-teal" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-5 gap-6 mb-8">
        {/* AUM & Revenue Chart */}
        <div className="col-span-3">
          <ChartContainer title="AUM & Revenue Growth" subtitle="15-month trend">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis
                  yAxisId="aum"
                  orientation="left"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  tickFormatter={(v) => `$${Number(v).toFixed(0)}B`}
                />
                <YAxis
                  yAxisId="rev"
                  orientation="right"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  tickFormatter={(v) => `$${Number(v).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                  formatter={(value, name) =>
                    name === 'aumM' ? [`$${Number(value).toFixed(1)}B`, 'AUM'] : [`$${Number(value).toFixed(0)}K`, 'Revenue']
                  }
                />
                <Bar yAxisId="aum" dataKey="aumM" fill={colors.teal} opacity={0.3} radius={[4, 4, 0, 0]} />
                <Line yAxisId="rev" type="monotone" dataKey="revK" stroke={colors.gold} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Right Column */}
        <div className="col-span-2 space-y-6">
          {/* Revenue Tier Distribution */}
          <ChartContainer title="Revenue by Tier" subtitle="Annualized team classification">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenueTiers} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="tier"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                  formatter={(value) => [formatCompactCurrency(Number(value)), 'Revenue']}
                />
                <Bar
                  dataKey="revenue"
                  radius={[0, 4, 4, 0]}
                  fill={colors.teal}
                >
                  {revenueTiers.map((entry: { tier: string }, idx: number) => (
                    <rect key={idx} fill={TIER_COLORS[entry.tier] || colors.teal} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {revenueTiers.map((t: { tier: string; teamCount: number }) => (
                <span key={t.tier} className="text-xs text-white/40">
                  <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: TIER_COLORS[t.tier] }} />
                  {t.tier}: {t.teamCount} teams
                </span>
              ))}
            </div>
          </ChartContainer>

          {/* Alert Summary */}
          {alerts && (alerts.zeroBpsCount > 0 || alerts.cashShortfallCount > 0 || alerts.shrinkingCount > 0) && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Revenue Leakage</h3>
              </div>
              <div className="space-y-2 text-xs">
                {alerts.zeroBpsCount > 0 && (
                  <div className="flex justify-between text-white/60">
                    <span>Zero-BPS accounts (&gt;$10K)</span>
                    <span className="text-amber-400">{alerts.zeroBpsCount} ({formatCompactCurrency(alerts.zeroBpsTotalAUM)})</span>
                  </div>
                )}
                {alerts.cashShortfallCount > 0 && (
                  <div className="flex justify-between text-white/60">
                    <span>Cash shortfalls</span>
                    <span className="text-red-400">{alerts.cashShortfallCount} ({formatCompactCurrency(Math.abs(alerts.cashShortfallTotal))})</span>
                  </div>
                )}
                {alerts.shrinkingCount > 0 && (
                  <div className="flex justify-between text-white/60">
                    <span>Shrinking relationships</span>
                    <span className="text-red-400">{alerts.shrinkingCount}</span>
                  </div>
                )}
                {alerts.bpsCompressionCount > 0 && (
                  <div className="flex justify-between text-white/60">
                    <span>BPS compression teams</span>
                    <span className="text-amber-400">{alerts.bpsCompressionCount}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-5 gap-6">
        {/* BPS Trend */}
        <div className="col-span-3">
          <ChartContainer title="Weighted Average BPS Trend" subtitle="Fee compression detection">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                  formatter={(value) => [Number(value).toFixed(2), 'Avg BPS']}
                />
                <Line type="monotone" dataKey="avgBps" stroke={colors.tealLight} strokeWidth={2} dot={{ r: 3, fill: colors.teal }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Top-10 Concentration */}
        <div className="col-span-2">
          <ChartContainer title="Top 10 Concentration" subtitle="AUM share by team">
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {concentration.map((t: { team: string; pctOfFirmAUM: number; aum: number }, i: number) => (
                <div key={t.team} className="flex items-center gap-3">
                  <span className="text-xs text-white/30 w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-white/70 truncate">{t.team}</span>
                      <span className="text-white/40 shrink-0 ml-2">{t.pctOfFirmAUM.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal"
                        style={{ width: `${Math.min(t.pctOfFirmAUM * 4, 100)}%`, opacity: 0.6 + (0.4 * (10 - i) / 10) }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-white/40 w-14 text-right shrink-0">
                    {formatCompactCurrency(t.aum)}
                  </span>
                </div>
              ))}
            </div>
          </ChartContainer>
        </div>
      </div>

      {/* Growth Metrics Row */}
      <div className="grid grid-cols-4 gap-4 mt-8">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-white/40 mb-1">Accounts</p>
          <p className="text-xl font-semibold text-white">{c.accountCount.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-white/40 mb-1">Relationships</p>
          <p className="text-xl font-semibold text-white">{c.relCount.toLocaleString()}</p>
          <MoMDelta value={mom.relChange} format="number" />
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-white/40 mb-1">Zero-BPS AUM</p>
          <p className="text-xl font-semibold text-amber-400">{formatCompactCurrency(c.zeroBpsAUM)}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-white/40 mb-1">Cash Shortfall</p>
          <p className="text-xl font-semibold text-red-400">{formatCurrency(Math.abs(c.cashShortfall))}</p>
        </div>
      </div>
    </div>
  );
}
