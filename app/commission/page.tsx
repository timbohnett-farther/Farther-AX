'use client';

import { useState, useMemo, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useTheme } from '@/lib/theme-provider';
import { formatCurrency, formatNumber, formatPercent, formatCompactCurrency } from '@/lib/theme';
import { StatCard, ChartContainer, TabGroup } from '@/components/ui';
import { PeriodSelector } from '@/components/commission/PeriodSelector';
import { CommissionDrillPanel } from '@/components/commission/CommissionDrillPanel';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, AreaChart, Area, Legend,
} from 'recharts';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface TeamRow {
  teamId: string;
  teamName: string;
  advisorCount: number;
  totalAUM: number;
  totalRevenue: number;
  totalCommission: number;
  avgCommissionPct: number;
  advisors: Array<{
    advisorId: string;
    name: string;
    type: string | null;
    region: string | null;
    aum: number;
    totalRevenue: number;
    commission: number;
    commissionPct: number;
    tier: string | null;
  }>;
}

interface CommissionData {
  latestPeriod: string;
  periodCount: number;
  summary: {
    totalAdvisors: number;
    activeAdvisors: number;
    totalAUM: number;
    totalRevenue: number;
    totalCommission: number;
    totalNetCommission: number;
    avgCommissionRate: number;
    avgImpliedBps: number;
  };
  teamBreakdown: TeamRow[];
  regionBreakdown: Array<{
    region: string;
    advisorCount: number;
    totalAUM: number;
    totalRevenue: number;
    totalCommission: number;
  }>;
  tierDistribution: Array<{ tier: string; count: number; pct: number }>;
  periods: Array<{ date: string; advisorCount: number }>;
  firmTrend: Array<{ period: string; revenue: number; commission: number; aum: number }>;
}

type SortKey = 'teamName' | 'advisorCount' | 'totalAUM' | 'totalRevenue' | 'totalCommission' | 'avgCommissionPct';

export default function CommissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { THEME, STYLES, CHART_COLORS } = useTheme();

  const period = searchParams.get('period') || '';
  const periodParam = period ? `?period=${period}` : '';

  const { data, error, isLoading } = useSWR<CommissionData>(
    `/api/commission${periodParam}`,
    fetcher,
    { refreshInterval: 300000 }
  );

  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('totalAUM');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [drillPanel, setDrillPanel] = useState<{
    title: string;
    subtitle: string;
    metric: string;
    data: { label: string; value: number; pct?: number }[];
  } | null>(null);

  const COLORS = CHART_COLORS;

  const regions = useMemo(() => {
    if (!data?.regionBreakdown) return ['All'];
    return ['All', ...data.regionBreakdown.map(r => r.region).filter(Boolean).sort()];
  }, [data?.regionBreakdown]);

  const filteredTeams = useMemo(() => {
    if (!data?.teamBreakdown) return [];
    let teams = [...data.teamBreakdown];
    if (regionFilter !== 'All') {
      teams = teams.filter(t =>
        t.advisors.some(a => a.region === regionFilter)
      );
    }
    return teams.sort((a, b) => {
      const av = a[sortKey] as number | string;
      const bv = b[sortKey] as number | string;
      if (typeof av === 'string') return sortDir === 'asc' ? (av).localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [data?.teamBreakdown, sortKey, sortDir, regionFilter]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  function handlePeriodChange(newPeriod: string) {
    router.push(`/commission?period=${newPeriod}`);
  }

  function openDrill(metric: string, title: string) {
    if (!data) return;
    const items: { label: string; value: number; pct?: number }[] = [];
    const total = metric === 'commission' ? data.summary.totalCommission
      : metric === 'revenue' ? data.summary.totalRevenue
      : metric === 'aum' ? data.summary.totalAUM
      : metric === 'netCommission' ? data.summary.totalNetCommission
      : data.summary.totalRevenue - data.summary.totalCommission;

    for (const team of data.teamBreakdown) {
      const val = metric === 'commission' ? team.totalCommission
        : metric === 'revenue' ? team.totalRevenue
        : metric === 'aum' ? team.totalAUM
        : metric === 'netCommission' ? team.totalCommission * 0.9
        : team.totalRevenue - team.totalCommission;
      items.push({ label: team.teamName, value: val, pct: total > 0 ? (val / total) * 100 : 0 });
    }
    items.sort((a, b) => b.value - a.value);
    setDrillPanel({ title, subtitle: `by Team — ${data.latestPeriod}`, metric, data: items });
  }

  if (isLoading) {
    return (
      <div style={{ padding: THEME.spacing.xl }}>
        <div className="shimmer h-8 w-64 rounded-lg mb-6" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          {[1,2,3,4,5,6].map(i => <div key={i} className="shimmer h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6 mb-8">
          {[1,2].map(i => <div key={i} className="shimmer h-72 rounded-xl" />)}
        </div>
        <div className="shimmer h-96 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: THEME.spacing.xl, textAlign: 'center', marginTop: '80px' }}>
        <p style={{ color: THEME.colors.error, fontSize: THEME.typography.fontSize.lg }}>
          Failed to load commission data
        </p>
        <p style={{ color: THEME.colors.textMuted, fontSize: THEME.typography.fontSize.sm, marginTop: THEME.spacing.sm }}>
          Ensure BILLING_DATABASE_URL is configured
        </p>
      </div>
    );
  }

  const { summary: s } = data;

  const regionTabs = regions.map(r => ({ key: r, label: r }));

  return (
    <div style={{ maxWidth: THEME.layout.maxContentWidth, padding: THEME.spacing.xl }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: THEME.spacing['2xl'] }}>
        <div>
          <h1 style={{ ...STYLES.heading, fontSize: THEME.typography.fontSize['2xl'], marginBottom: THEME.spacing.xs }}>
            Commission Analytics
          </h1>
          <p style={{ color: THEME.colors.textMuted, fontSize: THEME.typography.fontSize.sm }}>
            {data.latestPeriod} · {data.periodCount} months loaded · {formatNumber(s.totalAdvisors)} advisors
          </p>
        </div>
        {data.periods.length > 0 && (
          <PeriodSelector
            periods={data.periods}
            selected={period || data.latestPeriod}
            onChange={handlePeriodChange}
          />
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" style={{ marginBottom: THEME.spacing['2xl'] }}>
        <StatCard
          title="Total Advisors"
          value={formatNumber(s.totalAdvisors)}
          subtitle={`${s.activeAdvisors} active`}
          icon={<UserGroupIcon className="h-5 w-5" style={{ color: THEME.colors.steel }} />}
          onClick={() => openDrill('aum', 'Total Advisors')}
        />
        <StatCard
          title="Total AUM"
          value={formatCompactCurrency(s.totalAUM)}
          subtitle={`${(s.avgImpliedBps).toFixed(1)} bps implied`}
          icon={<CurrencyDollarIcon className="h-5 w-5" style={{ color: THEME.colors.steel }} />}
          onClick={() => openDrill('aum', 'Total AUM')}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(s.totalRevenue)}
          subtitle={`${formatCompactCurrency(s.totalRevenue * 12)} annualized`}
          icon={<BanknotesIcon className="h-5 w-5" style={{ color: THEME.colors.steel }} />}
          onClick={() => openDrill('revenue', 'Monthly Revenue')}
        />
        <StatCard
          title="Total Commission"
          value={formatCurrency(s.totalCommission)}
          subtitle={`${s.avgCommissionRate.toFixed(1)}% avg rate`}
          icon={<ChartBarIcon className="h-5 w-5" style={{ color: THEME.colors.steel }} />}
          onClick={() => openDrill('commission', 'Total Commission')}
        />
        <StatCard
          title="Net Commission"
          value={formatCurrency(s.totalNetCommission)}
          subtitle={`${formatCurrency(s.totalCommission - s.totalNetCommission)} adjustments`}
          icon={<ArrowTrendingUpIcon className="h-5 w-5" style={{ color: THEME.colors.steel }} />}
          onClick={() => openDrill('netCommission', 'Net Commission')}
        />
        <StatCard
          title="Firm Margin"
          value={formatCurrency(s.totalRevenue - s.totalCommission)}
          subtitle={`${((1 - s.totalCommission / s.totalRevenue) * 100).toFixed(1)}% of revenue`}
          icon={<BanknotesIcon className="h-5 w-5" style={{ color: THEME.colors.success }} />}
          onClick={() => openDrill('margin', 'Firm Margin')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginBottom: THEME.spacing['2xl'] }}>
        {/* Revenue by Region */}
        <ChartContainer title="Revenue by Region" subtitle="Click a bar to drill into that region">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.regionBreakdown} margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.borderSubtle} />
              <XAxis dataKey="region" angle={-25} textAnchor="end" height={60} style={{ fontSize: 10, fill: THEME.colors.textMuted }} />
              <YAxis tickFormatter={(v: number) => formatCompactCurrency(v, 0)} style={{ fontSize: 10, fill: THEME.colors.textMuted }} />
              <Tooltip
                contentStyle={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}`, color: THEME.colors.textHeading, borderRadius: '8px', fontSize: '13px' }}
                formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
              />
              <Bar
                dataKey="totalRevenue"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(data) => {
                  if (data && 'region' in data) {
                    setRegionFilter((data as { region: string }).region);
                  }
                }}
              >
                {data.regionBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Commission Tier Distribution */}
        <ChartContainer title="Commission Tier Distribution" subtitle="Click a slice for tier details">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.tierDistribution}
                dataKey="count"
                nameKey="tier"
                cx="50%"
                cy="50%"
                outerRadius={100}
                cursor="pointer"
                label={(props) => {
                  const entry = props.payload as { tier: string; pct: number };
                  return `${entry.tier} (${entry.pct.toFixed(0)}%)`;
                }}
                labelLine={{ stroke: THEME.colors.textMuted }}
                onClick={(data) => {
                  const entry = data.payload as { tier: string; count: number; pct: number };
                  setDrillPanel({
                    title: `${entry.tier} Tier`,
                    subtitle: `${entry.count} advisors (${entry.pct.toFixed(1)}%)`,
                    metric: 'tier',
                    data: filteredTeams.map(t => ({
                      label: t.teamName,
                      value: t.advisors.filter(a => a.tier === entry.tier).length,
                      pct: t.advisorCount > 0 ? (t.advisors.filter(a => a.tier === entry.tier).length / t.advisorCount) * 100 : 0,
                    })).filter(i => i.value > 0),
                  });
                }}
              >
                {data.tierDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}`, color: THEME.colors.textHeading, borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Firm Trend Chart */}
      {data.firmTrend && data.firmTrend.length > 0 && (
        <div style={{ marginBottom: THEME.spacing['2xl'] }}>
          <ChartContainer title="Firm Trend (15 Months)" subtitle="Commission + Revenue over time">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.firmTrend} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.borderSubtle} />
                <XAxis dataKey="period" style={{ fontSize: 10, fill: THEME.colors.textMuted }} />
                <YAxis tickFormatter={(v: number) => formatCompactCurrency(v, 0)} style={{ fontSize: 10, fill: THEME.colors.textMuted }} />
                <Tooltip
                  contentStyle={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}`, color: THEME.colors.textHeading, borderRadius: '8px', fontSize: '13px' }}
                  formatter={(value, name) => [formatCurrency(Number(value)), name]}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="commission" name="Commission" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {/* Region Filter Tabs */}
      <div style={{ marginBottom: THEME.spacing.lg }}>
        <div style={{ display: 'flex', gap: THEME.spacing.sm, flexWrap: 'wrap' }}>
          {regionTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setRegionFilter(tab.key)}
              style={{
                padding: `${THEME.spacing.xs} ${THEME.spacing.md}`,
                borderRadius: THEME.layout.borderRadiusSm,
                border: `1px solid ${regionFilter === tab.key ? THEME.colors.steel : THEME.colors.border}`,
                backgroundColor: regionFilter === tab.key ? THEME.colors.steel : 'transparent',
                color: regionFilter === tab.key ? '#FFFFFF' : THEME.colors.textSecondary,
                fontSize: THEME.typography.fontSize.xs,
                fontWeight: THEME.typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Team Breakdown Table */}
      <div style={{ ...STYLES.card, padding: THEME.spacing.xl }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.lg }}>
          <h2 style={{ ...STYLES.heading, fontSize: THEME.typography.fontSize.xl }}>
            Team Breakdown ({filteredTeams.length} teams)
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={STYLES.table.container}>
            <thead>
              <tr>
                {[
                  { key: 'teamName' as SortKey, label: 'Team', align: 'left' },
                  { key: 'advisorCount' as SortKey, label: 'Advisors', align: 'right' },
                  { key: 'totalAUM' as SortKey, label: 'AUM', align: 'right' },
                  { key: 'totalRevenue' as SortKey, label: 'Revenue', align: 'right' },
                  { key: 'totalCommission' as SortKey, label: 'Commission', align: 'right' },
                  { key: 'avgCommissionPct' as SortKey, label: 'Avg Rate', align: 'right' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      ...STYLES.table.header,
                      textAlign: col.align as 'left' | 'right',
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col.label}{sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
                <th style={{ ...STYLES.table.header, width: '40px' }} />
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team) => (
                <Fragment key={team.teamId || team.teamName}>
                  <tr
                    style={{
                      ...STYLES.table.row,
                      cursor: 'pointer',
                      backgroundColor: expandedTeam === team.teamName ? THEME.colors.surfaceSubtle : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (expandedTeam !== team.teamName) {
                        e.currentTarget.style.backgroundColor = THEME.colors.surfaceHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (expandedTeam !== team.teamName) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <td
                      style={{ ...STYLES.table.cell, fontWeight: THEME.typography.fontWeight.medium, color: THEME.colors.textHeading }}
                      onClick={() => router.push(`/commission/team/${team.teamId}`)}
                    >
                      {team.teamName}
                    </td>
                    <td style={{ ...STYLES.table.cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }} onClick={() => router.push(`/commission/team/${team.teamId}`)}>
                      {team.advisorCount}
                    </td>
                    <td style={{ ...STYLES.table.cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }} onClick={() => router.push(`/commission/team/${team.teamId}`)}>
                      {formatCompactCurrency(team.totalAUM)}
                    </td>
                    <td style={{ ...STYLES.table.cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }} onClick={() => router.push(`/commission/team/${team.teamId}`)}>
                      {formatCurrency(team.totalRevenue)}
                    </td>
                    <td style={{ ...STYLES.table.cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }} onClick={() => router.push(`/commission/team/${team.teamId}`)}>
                      {formatCurrency(team.totalCommission)}
                    </td>
                    <td style={{ ...STYLES.table.cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }} onClick={() => router.push(`/commission/team/${team.teamId}`)}>
                      {team.avgCommissionPct.toFixed(1)}%
                    </td>
                    <td style={{ ...STYLES.table.cell, textAlign: 'center', width: '40px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTeam(expandedTeam === team.teamName ? null : team.teamName);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: THEME.colors.textMuted }}
                      >
                        {expandedTeam === team.teamName
                          ? <ChevronDownIcon className="h-4 w-4" />
                          : <ChevronRightIcon className="h-4 w-4" />
                        }
                      </button>
                    </td>
                  </tr>
                  {expandedTeam === team.teamName && team.advisors.map((a, i) => (
                    <tr
                      key={`${team.teamName}-${i}`}
                      style={{
                        backgroundColor: THEME.colors.surfaceSubtle,
                        cursor: 'pointer',
                      }}
                      onClick={() => router.push(`/commission/advisor/${a.advisorId}`)}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = THEME.colors.surfaceHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = THEME.colors.surfaceSubtle; }}
                    >
                      <td style={{
                        ...STYLES.table.cell,
                        paddingLeft: THEME.spacing['2xl'],
                        color: THEME.colors.textSecondary,
                        fontSize: THEME.typography.fontSize.xs,
                      }}>
                        {a.name}
                        {a.tier && (
                          <span style={{ color: THEME.colors.steel, fontSize: '10px', marginLeft: '6px' }}>
                            ({a.tier})
                          </span>
                        )}
                      </td>
                      <td style={{ ...STYLES.table.cell, textAlign: 'right', color: THEME.colors.textMuted, fontSize: THEME.typography.fontSize.xs }}>
                        {a.region || '—'}
                      </td>
                      <td style={{ ...STYLES.table.cell, textAlign: 'right', color: THEME.colors.textMuted, fontSize: THEME.typography.fontSize.xs, fontVariantNumeric: 'tabular-nums' }}>
                        {formatCompactCurrency(a.aum)}
                      </td>
                      <td style={{ ...STYLES.table.cell, textAlign: 'right', color: THEME.colors.textMuted, fontSize: THEME.typography.fontSize.xs, fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(a.totalRevenue)}
                      </td>
                      <td style={{ ...STYLES.table.cell, textAlign: 'right', color: THEME.colors.textMuted, fontSize: THEME.typography.fontSize.xs, fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(a.commission)}
                      </td>
                      <td style={{ ...STYLES.table.cell, textAlign: 'right', color: THEME.colors.textMuted, fontSize: THEME.typography.fontSize.xs, fontVariantNumeric: 'tabular-nums' }}>
                        {a.commissionPct.toFixed(1)}%
                      </td>
                      <td />
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill Panel */}
      {drillPanel && (
        <CommissionDrillPanel
          isOpen={!!drillPanel}
          onClose={() => setDrillPanel(null)}
          title={drillPanel.title}
          subtitle={drillPanel.subtitle}
          data={drillPanel.data}
          metric={drillPanel.metric}
        />
      )}
    </div>
  );
}
