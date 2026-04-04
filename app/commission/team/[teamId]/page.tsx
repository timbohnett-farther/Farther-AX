'use client';

import { useState, useMemo, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-provider';
import { formatCurrency, formatNumber, formatCompactCurrency } from '@/lib/theme';
import { StatCard, ChartContainer } from '@/components/ui';
import { PeriodSelector } from '@/components/commission/PeriodSelector';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface AdvisorRow {
  id: string;
  name: string;
  type: string | null;
  cadence: string | null;
  aum: number;
  revenue: number;
  splitsOut: number;
  splitsIn: number;
  commission: number;
  commissionPct: number;
  rampedStatus: string | null;
  commissionType: string | null;
}

interface TeamData {
  team: { id: string; name: string; region: string | null; manager: string | null; isActive: boolean };
  summary: { aum: number; revenue: number; commission: number; margin: number; advisorCount: number };
  advisors: AdvisorRow[];
  trend: Array<{ period: string; aum: number; revenue: number; commission: number; advisorCount: number }>;
  periods?: Array<{ date: string; advisorCount: number }>;
}

type SortKey = 'name' | 'type' | 'cadence' | 'aum' | 'revenue' | 'commission' | 'commissionPct';

export default function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { THEME, STYLES, CHART_COLORS } = useTheme();

  const period = searchParams.get('period') || '';
  const periodParam = period ? `?period=${period}` : '';

  const { data, error, isLoading } = useSWR<TeamData>(
    `/api/commission/team/${teamId}${periodParam}`,
    fetcher,
    { refreshInterval: 300000 }
  );

  const [sortKey, setSortKey] = useState<SortKey>('aum');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedAdvisor, setExpandedAdvisor] = useState<string | null>(null);

  const sortedAdvisors = useMemo(() => {
    if (!data?.advisors) return [];
    return [...data.advisors].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [data?.advisors, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  if (isLoading) {
    return (
      <div style={{ padding: THEME.spacing.xl }}>
        <div className="shimmer h-6 w-48 rounded mb-4" />
        <div className="shimmer h-10 w-72 rounded-lg mb-6" />
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[1,2,3,4,5].map(i => <div key={i} className="shimmer h-24 rounded-xl" />)}
        </div>
        <div className="shimmer h-72 rounded-xl mb-8" />
        <div className="shimmer h-96 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: THEME.spacing.xl, textAlign: 'center', marginTop: '80px' }}>
        <p style={{ color: THEME.colors.error, fontSize: THEME.typography.fontSize.lg }}>
          Failed to load team data
        </p>
        <Link href="/commission" style={{ color: THEME.colors.steel, fontSize: THEME.typography.fontSize.sm, marginTop: THEME.spacing.sm, display: 'inline-block' }}>
          ← Back to Commission
        </Link>
      </div>
    );
  }

  const { team, summary: s } = data;

  return (
    <div style={{ maxWidth: THEME.layout.maxContentWidth, padding: THEME.spacing.xl }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: THEME.spacing.sm, marginBottom: THEME.spacing.lg }}>
        <Link href="/commission" style={{ color: THEME.colors.textMuted, fontSize: THEME.typography.fontSize.sm, textDecoration: 'none' }}>
          Commission
        </Link>
        <span style={{ color: THEME.colors.textFaint }}>/</span>
        <span style={{ color: THEME.colors.textHeading, fontSize: THEME.typography.fontSize.sm, fontWeight: THEME.typography.fontWeight.medium }}>
          {team.name}
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: THEME.spacing['2xl'] }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: THEME.spacing.md, marginBottom: THEME.spacing.xs }}>
            <button
              onClick={() => router.push('/commission')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.colors.textMuted, padding: '4px' }}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 style={{ ...STYLES.heading, fontSize: THEME.typography.fontSize['2xl'] }}>
              {team.name}
            </h1>
          </div>
          <p style={{ color: THEME.colors.textMuted, fontSize: THEME.typography.fontSize.sm }}>
            {team.region || 'No region'} · {team.manager ? `Manager: ${team.manager}` : 'No manager assigned'}
          </p>
        </div>
        {data.periods && data.periods.length > 0 && (
          <PeriodSelector
            periods={data.periods}
            selected={period || data.periods[0]?.date || ''}
            onChange={(p) => router.push(`/commission/team/${teamId}?period=${p}`)}
          />
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" style={{ marginBottom: THEME.spacing['2xl'] }}>
        <StatCard
          title="Total AUM"
          value={formatCompactCurrency(s.aum)}
          icon={<CurrencyDollarIcon className="h-5 w-5" style={{ color: THEME.colors.steel }} />}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(s.revenue)}
          icon={<BanknotesIcon className="h-5 w-5" style={{ color: THEME.colors.steel }} />}
        />
        <StatCard
          title="Commission"
          value={formatCurrency(s.commission)}
          icon={<ChartBarIcon className="h-5 w-5" style={{ color: THEME.colors.steel }} />}
        />
        <StatCard
          title="Margin"
          value={formatCurrency(s.margin)}
          subtitle={s.revenue > 0 ? `${((s.margin / s.revenue) * 100).toFixed(1)}% of revenue` : ''}
          icon={<ArrowTrendingUpIcon className="h-5 w-5" style={{ color: THEME.colors.success }} />}
        />
        <StatCard
          title="Advisors"
          value={String(s.advisorCount)}
          icon={<UserGroupIcon className="h-5 w-5" style={{ color: THEME.colors.steel }} />}
        />
      </div>

      {/* Trend Chart */}
      {data.trend && data.trend.length > 1 && (
        <div style={{ marginBottom: THEME.spacing['2xl'] }}>
          <ChartContainer title="Team Trend (15 Months)" subtitle="AUM, Revenue, and Commission over time">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.trend} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.borderSubtle} />
                <XAxis dataKey="period" style={{ fontSize: 10, fill: THEME.colors.textMuted }} />
                <YAxis tickFormatter={(v: number) => formatCompactCurrency(v, 0)} style={{ fontSize: 10, fill: THEME.colors.textMuted }} />
                <Tooltip
                  contentStyle={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}`, color: THEME.colors.textHeading, borderRadius: '8px', fontSize: '13px' }}
                  formatter={(value, name) => [formatCurrency(Number(value)), name]}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="commission" name="Commission" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {/* Advisor Table */}
      <div style={{ ...STYLES.card, padding: THEME.spacing.xl }}>
        <h2 style={{ ...STYLES.heading, fontSize: THEME.typography.fontSize.xl, marginBottom: THEME.spacing.lg }}>
          Advisors ({sortedAdvisors.length})
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={STYLES.table.container}>
            <thead>
              <tr>
                {[
                  { key: 'name' as SortKey, label: 'Advisor', align: 'left' },
                  { key: 'type' as SortKey, label: 'Type', align: 'left' },
                  { key: 'cadence' as SortKey, label: 'Cadence', align: 'left' },
                  { key: 'aum' as SortKey, label: 'AUM', align: 'right' },
                  { key: 'revenue' as SortKey, label: 'Revenue', align: 'right' },
                  { key: 'commission' as SortKey, label: 'Commission', align: 'right' },
                  { key: 'commissionPct' as SortKey, label: 'Rate', align: 'right' },
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
              {sortedAdvisors.map((a) => (
                <tr
                  key={a.id}
                  style={{ ...STYLES.table.row, cursor: 'pointer' }}
                  onClick={() => router.push(`/commission/advisor/${a.id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = THEME.colors.surfaceHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <td style={{ ...STYLES.table.cell, fontWeight: THEME.typography.fontWeight.medium, color: THEME.colors.textHeading }}>
                    {a.name}
                    {a.rampedStatus && a.rampedStatus !== 'Ramped' && (
                      <span style={{ ...STYLES.badge(THEME.colors.warning, THEME.colors.warningBg), marginLeft: '8px', fontSize: '10px' }}>
                        {a.rampedStatus}
                      </span>
                    )}
                  </td>
                  <td style={{ ...STYLES.table.cell, color: THEME.colors.textSecondary }}>{a.type || '—'}</td>
                  <td style={{ ...STYLES.table.cell, color: THEME.colors.textSecondary }}>{a.cadence || '—'}</td>
                  <td style={{ ...STYLES.table.cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCompactCurrency(a.aum)}</td>
                  <td style={{ ...STYLES.table.cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(a.revenue)}</td>
                  <td style={{ ...STYLES.table.cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(a.commission)}</td>
                  <td style={{ ...STYLES.table.cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{a.commissionPct.toFixed(1)}%</td>
                  <td style={{ ...STYLES.table.cell, textAlign: 'center' }}>
                    <ChevronRightIcon className="h-4 w-4" style={{ color: THEME.colors.textMuted }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
