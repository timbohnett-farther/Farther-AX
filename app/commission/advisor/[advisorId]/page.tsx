'use client';

import { use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-provider';
import { formatCurrency, formatCompactCurrency, formatPercent } from '@/lib/theme';
import { ChartContainer } from '@/components/ui';
import { PeriodSelector } from '@/components/commission/PeriodSelector';
import { CommissionWaterfall } from '@/components/commission/CommissionWaterfall';
import { RevenueBreakdown } from '@/components/commission/RevenueBreakdown';
import { TierCalculationTable } from '@/components/commission/TierCalculationTable';
import { SplitsTable } from '@/components/commission/SplitsTable';
import { AdvisorTrendChart } from '@/components/commission/AdvisorTrendChart';
import {
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface AdvisorData {
  advisor: {
    id: string;
    name: string;
    type: string | null;
    region: string | null;
    cadence: string | null;
    cohortYear: number | null;
    rampedStatus: string | null;
    commissionType: string | null;
    teamId: string | null;
    teamName: string | null;
  };
  waterfall: Array<{ name: string; value: number; type: 'add' | 'subtract' | 'total' }>;
  revenueBreakdown: Array<{ name: string; assets: number; revenue: number }>;
  tiers: Array<{ tier: string; threshold: number; rate: number; revenueInTier: number; commissionPerTier: number }>;
  splits: {
    out: Array<{ name: string; percentage: number; amount: number }>;
    in: Array<{ name: string; percentage: number; amount: number }>;
    netImpact: number;
  };
  recruiter: {
    recruiterName: string;
    rate: number;
    vestingYear: number;
    vestingPct: number;
    payout: number;
  } | null;
  trend: Array<{ period: string; aum: number; revenue: number; contribution: number }>;
  periods?: Array<{ date: string; advisorCount: number }>;
}

export default function AdvisorDetailPage({ params }: { params: Promise<{ advisorId: string }> }) {
  const { advisorId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { THEME, STYLES, CHART_COLORS } = useTheme();

  const period = searchParams.get('period') || '';
  const periodParam = period ? `?period=${period}` : '';

  const { data, error, isLoading } = useSWR<AdvisorData>(
    `/api/commission/advisor/${advisorId}${periodParam}`,
    fetcher,
    { refreshInterval: 300000 }
  );

  if (isLoading) {
    return (
      <div style={{ padding: THEME.spacing.xl }}>
        <div className="shimmer h-6 w-48 rounded mb-4" />
        <div className="shimmer h-10 w-72 rounded-lg mb-6" />
        <div className="shimmer h-48 rounded-xl mb-6" />
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="shimmer h-72 rounded-xl" />
          <div className="shimmer h-72 rounded-xl" />
        </div>
        <div className="shimmer h-72 rounded-xl mb-6" />
        <div className="grid grid-cols-2 gap-6">
          <div className="shimmer h-48 rounded-xl" />
          <div className="shimmer h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: THEME.spacing.xl, textAlign: 'center', marginTop: '80px' }}>
        <p style={{ color: THEME.colors.error, fontSize: THEME.typography.fontSize.lg }}>
          Failed to load advisor data
        </p>
        <Link href="/commission" style={{ color: THEME.colors.steel, fontSize: THEME.typography.fontSize.sm, marginTop: THEME.spacing.sm, display: 'inline-block' }}>
          ← Back to Commission
        </Link>
      </div>
    );
  }

  const { advisor: a } = data;

  const tierTotal = data.tiers.length > 0 ? {
    revenue: data.tiers.reduce((sum, t) => sum + t.revenueInTier, 0),
    commission: data.tiers.reduce((sum, t) => sum + t.commissionPerTier, 0),
    effectiveRate: 0,
  } : { revenue: 0, commission: 0, effectiveRate: 0 };
  if (tierTotal.revenue > 0) {
    tierTotal.effectiveRate = tierTotal.commission / tierTotal.revenue;
  }

  const revenueColors = [CHART_COLORS[0], CHART_COLORS[1], CHART_COLORS[2], CHART_COLORS[3], CHART_COLORS[4]];
  const revenueWithColors = data.revenueBreakdown.map((s, i) => ({
    ...s,
    color: revenueColors[i % revenueColors.length],
  }));

  return (
    <div style={{ maxWidth: THEME.layout.maxContentWidth, padding: THEME.spacing.xl }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: THEME.spacing.sm, marginBottom: THEME.spacing.lg }}>
        <Link href="/commission" style={{ color: THEME.colors.textMuted, fontSize: THEME.typography.fontSize.sm, textDecoration: 'none' }}>
          Commission
        </Link>
        <span style={{ color: THEME.colors.textFaint }}>/</span>
        {a.teamId && a.teamName && (
          <>
            <Link href={`/commission/team/${a.teamId}`} style={{ color: THEME.colors.textMuted, fontSize: THEME.typography.fontSize.sm, textDecoration: 'none' }}>
              {a.teamName}
            </Link>
            <span style={{ color: THEME.colors.textFaint }}>/</span>
          </>
        )}
        <span style={{ color: THEME.colors.textHeading, fontSize: THEME.typography.fontSize.sm, fontWeight: THEME.typography.fontWeight.medium }}>
          {a.name}
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: THEME.spacing['2xl'] }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: THEME.spacing.md, marginBottom: THEME.spacing.xs }}>
            <button
              onClick={() => a.teamId ? router.push(`/commission/team/${a.teamId}`) : router.push('/commission')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.colors.textMuted, padding: '4px' }}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 style={{ ...STYLES.heading, fontSize: THEME.typography.fontSize['2xl'] }}>
              {a.name}
            </h1>
          </div>
          <p style={{ color: THEME.colors.textMuted, fontSize: THEME.typography.fontSize.sm }}>
            {[a.type, a.region, a.cadence, a.commissionType, a.rampedStatus].filter(Boolean).join(' · ')}
            {a.cohortYear && ` · Cohort ${a.cohortYear}`}
          </p>
        </div>
        {data.periods && data.periods.length > 0 && (
          <PeriodSelector
            periods={data.periods}
            selected={period || data.periods[0]?.date || ''}
            onChange={(p) => router.push(`/commission/advisor/${advisorId}?period=${p}`)}
          />
        )}
      </div>

      {/* Profile Card */}
      <div style={{ ...STYLES.card, padding: THEME.spacing.xl, marginBottom: THEME.spacing['2xl'] }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: THEME.spacing.lg }}>
          {[
            { label: 'Type', value: a.type || '—' },
            { label: 'Region', value: a.region || '—' },
            { label: 'Cadence', value: a.cadence || '—' },
            { label: 'Commission Type', value: a.commissionType || '—' },
            { label: 'Ramped Status', value: a.rampedStatus || '—' },
            { label: 'Cohort', value: a.cohortYear ? String(a.cohortYear) : '—' },
            { label: 'Team', value: a.teamName || '—' },
          ].map((item) => (
            <div key={item.label}>
              <p style={STYLES.label}>{item.label}</p>
              <p style={{ color: THEME.colors.textHeading, fontSize: THEME.typography.fontSize.base, fontWeight: THEME.typography.fontWeight.medium, marginTop: '4px' }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Waterfall + Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginBottom: THEME.spacing['2xl'] }}>
        {data.waterfall.length > 0 && (
          <CommissionWaterfall steps={data.waterfall} />
        )}
        {revenueWithColors.length > 0 && (
          <RevenueBreakdown sources={revenueWithColors} />
        )}
      </div>

      {/* Historical Trend */}
      {data.trend && data.trend.length > 1 && (
        <div style={{ marginBottom: THEME.spacing['2xl'] }}>
          <AdvisorTrendChart data={data.trend} />
        </div>
      )}

      {/* Tier Calculation + Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginBottom: THEME.spacing['2xl'] }}>
        {data.tiers.length > 0 && (
          <div style={{ ...STYLES.card, padding: THEME.spacing.xl }}>
            <h3 style={{ ...STYLES.heading, fontSize: THEME.typography.fontSize.lg, marginBottom: THEME.spacing.lg }}>
              Tier Calculation
            </h3>
            <TierCalculationTable tiers={data.tiers} total={tierTotal} />
          </div>
        )}
        {(data.splits.out.length > 0 || data.splits.in.length > 0) && (
          <div style={{ ...STYLES.card, padding: THEME.spacing.xl }}>
            <h3 style={{ ...STYLES.heading, fontSize: THEME.typography.fontSize.lg, marginBottom: THEME.spacing.lg }}>
              Commission Splits
            </h3>
            <SplitsTable
              splitsOut={data.splits.out}
              splitsIn={data.splits.in}
              netImpact={data.splits.netImpact}
            />
          </div>
        )}
      </div>

      {/* Recruiter Commission */}
      {data.recruiter && (
        <div style={{ ...STYLES.card, padding: THEME.spacing.xl, marginBottom: THEME.spacing['2xl'] }}>
          <h3 style={{ ...STYLES.heading, fontSize: THEME.typography.fontSize.lg, marginBottom: THEME.spacing.lg }}>
            Recruiter Commission
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: THEME.spacing.lg }}>
            <div>
              <p style={STYLES.label}>Recruiter</p>
              <p style={{ color: THEME.colors.textHeading, fontSize: THEME.typography.fontSize.base, fontWeight: THEME.typography.fontWeight.medium, marginTop: '4px' }}>
                {data.recruiter.recruiterName}
              </p>
            </div>
            <div>
              <p style={STYLES.label}>Rate</p>
              <p style={{ color: THEME.colors.textHeading, fontSize: THEME.typography.fontSize.base, fontWeight: THEME.typography.fontWeight.medium, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {(data.recruiter.rate * 100).toFixed(2)}%
              </p>
            </div>
            <div>
              <p style={STYLES.label}>Vesting Year</p>
              <p style={{ color: THEME.colors.textHeading, fontSize: THEME.typography.fontSize.base, fontWeight: THEME.typography.fontWeight.medium, marginTop: '4px' }}>
                Year {data.recruiter.vestingYear}
              </p>
            </div>
            <div>
              <p style={STYLES.label}>Vesting %</p>
              <p style={{ color: THEME.colors.textHeading, fontSize: THEME.typography.fontSize.base, fontWeight: THEME.typography.fontWeight.medium, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {(data.recruiter.vestingPct * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p style={STYLES.label}>Payout</p>
              <p style={{ color: THEME.colors.success, fontSize: THEME.typography.fontSize.lg, fontWeight: THEME.typography.fontWeight.semibold, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(data.recruiter.payout)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
