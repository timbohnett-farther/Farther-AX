'use client';

import { useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { StatCard, ChartContainer, TabGroup } from '@/components/ui';
import { PeriodSelector, TierBadge, MoMDelta, RelationshipRow } from '@/components/billing';
import type { RelationshipData, AccountDetail } from '@/components/billing';
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

function formatPeriodShort(p: string) {
  const d = new Date(p + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function TeamDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const teamName = decodeURIComponent(String(params.team));
  const initialPeriod = searchParams.get('period') || '';

  const [period, setPeriod] = useState(initialPeriod);
  const [expandedRels, setExpandedRels] = useState<Record<string, AccountDetail[]>>({});
  const [loadingRels, setLoadingRels] = useState<Set<string>>(new Set());
  const [relSearch, setRelSearch] = useState('');

  // Fetch periods from overview
  const { data: overviewData } = useSWR('/api/command-center/billing/overview', fetcher, SWR_OPTS);
  const periods = overviewData?.periods || [];
  const activePeriod = period || overviewData?.selectedPeriod || '';

  const { data, error, isLoading } = useSWR(
    activePeriod ? `/api/command-center/billing/teams/${encodeURIComponent(teamName)}?period=${activePeriod}` : null,
    fetcher,
    SWR_OPTS,
  );

  const handleExpandRelationship = useCallback(async (relName: string) => {
    if (expandedRels[relName]) return;
    setLoadingRels((prev) => new Set(prev).add(relName));
    try {
      const res = await fetch(
        `/api/command-center/billing/teams/${encodeURIComponent(teamName)}?period=${activePeriod}&relationship=${encodeURIComponent(relName)}`
      );
      const json = await res.json();
      if (json.accountDetails) {
        setExpandedRels((prev) => ({ ...prev, [relName]: json.accountDetails }));
      }
    } finally {
      setLoadingRels((prev) => {
        const next = new Set(prev);
        next.delete(relName);
        return next;
      });
    }
  }, [teamName, activePeriod, expandedRels]);

  if (isLoading) {
    return (
      <div className="px-10 py-8">
        <div className="shimmer h-8 w-48 rounded-xl mb-6" />
        <div className="grid grid-cols-6 gap-4 mb-8">
          {[...Array(6)].map((_, i) => <div key={i} className="shimmer h-24 rounded-xl" />)}
        </div>
        <div className="shimmer h-80 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="px-10 py-16 text-red-400">Error loading team data</div>;
  }

  const { timeSeries, relationships, concentration, firmAverages, tier, annualizedRevenue } = data;

  // Current period metrics from time series
  const currentTS = timeSeries.find((t: { period: string }) => t.period === activePeriod) || timeSeries[timeSeries.length - 1];
  const priorTS = timeSeries.length > 1
    ? timeSeries[timeSeries.findIndex((t: { period: string }) => t.period === activePeriod) - 1]
    : null;

  const pct = (a: number, b: number) => b ? ((a - b) / Math.abs(b)) * 100 : 0;

  // Chart data
  const chartData = timeSeries.map((t: { period: string; aum: number; revenue: number; bps: number }) => ({
    ...t,
    label: formatPeriodShort(t.period),
    aumM: t.aum / 1_000_000,
    revK: t.revenue / 1_000,
  }));

  // Merge firm averages for comparison overlay
  const firmMap: Record<string, { avgAum: number; avgBps: number }> = {};
  for (const fa of firmAverages) {
    firmMap[fa.period] = fa;
  }
  const bpsChartData = chartData.map((t: { period: string; bps: number; label: string }) => ({
    ...t,
    firmBps: firmMap[t.period]?.avgBps || 0,
  }));

  // Filter relationships
  const filteredRels = relationships.filter((r: RelationshipData) =>
    !relSearch || r.relationship.toLowerCase().includes(relSearch.toLowerCase())
  );

  // Tab content
  const growthTab = (
    <div className="space-y-6">
      <ChartContainer title="AUM & Revenue" subtitle="15-month trajectory">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
            <YAxis
              yAxisId="aum"
              orientation="left"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              tickFormatter={(v) => `$${Number(v).toFixed(0)}M`}
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
                name === 'aumM' ? [`$${Number(value).toFixed(1)}M`, 'AUM'] : [`$${Number(value).toFixed(0)}K`, 'Revenue']
              }
            />
            <Bar yAxisId="aum" dataKey="aumM" fill={colors.teal} opacity={0.3} radius={[4, 4, 0, 0]} />
            <Line yAxisId="rev" type="monotone" dataKey="revK" stroke={colors.gold} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>

      <ChartContainer title="BPS Trend vs. Firm Average" subtitle="Fee rate comparison">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={bpsChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ backgroundColor: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
              formatter={(value, name) => [Number(value).toFixed(2), name === 'bps' ? 'Team BPS' : 'Firm Avg BPS']}
            />
            <Line type="monotone" dataKey="bps" stroke={colors.teal} strokeWidth={2} dot={{ r: 3, fill: colors.teal }} name="bps" />
            <Line type="monotone" dataKey="firmBps" stroke={colors.slate} strokeWidth={1} strokeDasharray="4 4" dot={false} name="firmBps" />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );

  const relationshipsTab = (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search relationships..."
          value={relSearch}
          onChange={(e) => setRelSearch(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-teal"
        />
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-white/30 border-b border-white/10">
        <span className="w-4" />
        <div className="flex-1 grid grid-cols-6 gap-3">
          <span className="col-span-2">Relationship</span>
          <span>AUM</span>
          <span>Revenue</span>
          <span>BPS</span>
          <span>Details</span>
        </div>
      </div>

      <div className="glass-card divide-y divide-white/5">
        {filteredRels.map((rel: RelationshipData) => (
          <RelationshipRow
            key={rel.relationship}
            data={{
              ...rel,
              accountDetails: expandedRels[rel.relationship],
            }}
            onExpand={handleExpandRelationship}
            isLoading={loadingRels.has(rel.relationship)}
          />
        ))}
        {filteredRels.length === 0 && (
          <div className="text-center py-8 text-white/30 text-sm">No relationships found</div>
        )}
      </div>
    </div>
  );

  const riskTab = (
    <div className="space-y-6">
      {/* Concentration */}
      <ChartContainer title="Concentration Risk" subtitle="Top relationships as % of team AUM">
        <ResponsiveContainer width="100%" height={Math.min(concentration.length * 28 + 40, 400)}>
          <BarChart data={concentration} layout="vertical">
            <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={(v) => `${Number(v).toFixed(0)}%`} />
            <YAxis
              type="category"
              dataKey="relationship"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              width={140}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
              formatter={(v) => [`${Number(v).toFixed(1)}%`, '% of Team AUM']}
            />
            <Bar dataKey="pctOfTeam" fill={colors.teal} opacity={0.6} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Zero-BPS Accounts */}
      {(() => {
        const zeroBps = relationships.filter((r: RelationshipData) => r.zeroBpsAum > 0);
        if (zeroBps.length === 0) return null;
        return (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-amber-400 mb-3">Zero-BPS Relationships</h3>
            <div className="space-y-2">
              {zeroBps.map((r: RelationshipData) => (
                <div key={r.relationship} className="flex justify-between text-xs">
                  <span className="text-white/60">{r.relationship}</span>
                  <span className="text-amber-400">{formatCompactCurrency(r.zeroBpsAum)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Cash Shortfall */}
      {(() => {
        const shortfall = relationships.filter((r: RelationshipData) => r.cashShortfall < 0);
        if (shortfall.length === 0) return null;
        return (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-red-400 mb-3">Cash Shortfall Relationships</h3>
            <div className="space-y-2">
              {shortfall.map((r: RelationshipData) => (
                <div key={r.relationship} className="flex justify-between text-xs">
                  <span className="text-white/60">{r.relationship}</span>
                  <span className="text-red-400">{formatCurrency(Math.abs(r.cashShortfall))}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Shrinking Relationships */}
      {(() => {
        const shrinking = relationships.filter((r: RelationshipData) => r.aumChange < -10);
        if (shrinking.length === 0) return null;
        return (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-red-400 mb-3">Shrinking Relationships (&gt;10% decline)</h3>
            <div className="space-y-2">
              {shrinking.map((r: RelationshipData) => (
                <div key={r.relationship} className="flex justify-between text-xs">
                  <span className="text-white/60">{r.relationship}</span>
                  <MoMDelta value={r.aumChange} />
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );

  return (
    <div className="px-10 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href={`/command-center/billing/teams${activePeriod ? `?period=${activePeriod}` : ''}`}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-smooth"
          >
            <ArrowLeftIcon className="w-4 h-4 text-white/50" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white font-serif">{teamName}</h1>
              <TierBadge tier={tier} />
            </div>
            <p className="text-sm text-white/50">
              Annualized revenue: {formatCompactCurrency(annualizedRevenue)}
            </p>
          </div>
        </div>
        {periods.length > 0 && (
          <PeriodSelector
            periods={periods}
            selected={activePeriod}
            onChange={setPeriod}
          />
        )}
      </div>

      {/* KPI Row */}
      {currentTS && (
        <div className="grid grid-cols-6 gap-4 mb-8">
          <StatCard
            title="AUM"
            value={formatCompactCurrency(currentTS.aum)}
            delta={priorTS ? `${pct(currentTS.aum, priorTS.aum) > 0 ? '+' : ''}${pct(currentTS.aum, priorTS.aum).toFixed(1)}%` : undefined}
            deltaType={priorTS ? (pct(currentTS.aum, priorTS.aum) >= 0 ? 'increase' : 'decrease') : 'unchanged'}
          />
          <StatCard
            title="Revenue"
            value={formatCompactCurrency(currentTS.revenue)}
            delta={priorTS ? `${pct(currentTS.revenue, priorTS.revenue) > 0 ? '+' : ''}${pct(currentTS.revenue, priorTS.revenue).toFixed(1)}%` : undefined}
            deltaType={priorTS ? (pct(currentTS.revenue, priorTS.revenue) >= 0 ? 'increase' : 'decrease') : 'unchanged'}
          />
          <StatCard
            title="Avg BPS"
            value={currentTS.bps.toFixed(1)}
            delta={priorTS ? `${(currentTS.bps - priorTS.bps) > 0 ? '+' : ''}${(currentTS.bps - priorTS.bps).toFixed(1)}` : undefined}
            deltaType={priorTS ? ((currentTS.bps - priorTS.bps) >= 0 ? 'increase' : 'decrease') : 'unchanged'}
          />
          <StatCard
            title="Relationships"
            value={currentTS.relationships}
            delta={priorTS ? `${currentTS.relationships - priorTS.relationships > 0 ? '+' : ''}${currentTS.relationships - priorTS.relationships}` : undefined}
            deltaType={priorTS ? (currentTS.relationships >= priorTS.relationships ? 'increase' : 'decrease') : 'unchanged'}
          />
          <StatCard
            title="Cash Shortfall"
            value={formatCurrency(Math.abs(currentTS.cashShortfall))}
            subtitle={currentTS.cashShortfall < 0 ? 'Deficit' : 'No shortfall'}
          />
          <StatCard
            title="Zero-BPS AUM"
            value={formatCompactCurrency(
              relationships.reduce((s: number, r: RelationshipData) => s + r.zeroBpsAum, 0)
            )}
          />
        </div>
      )}

      {/* Tabs */}
      <TabGroup
        tabs={[
          { label: 'Growth & Performance', content: growthTab },
          { label: 'Relationships', content: relationshipsTab, badge: relationships.length },
          { label: 'Risk & Opportunities', content: riskTab },
        ]}
      />
    </div>
  );
}
