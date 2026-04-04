/**
 * app/api/commission/advisor/[advisorId]/route.ts
 *
 * Advisor-level commission detail endpoint with waterfall, revenue breakdown,
 * tier analysis, splits, recruiter commission, and historical trend.
 *
 * Query params:
 *   ?period=YYYY-MM-DD (optional) — defaults to latest period
 *
 * Returns:
 * {
 *   advisor: { id, name, type, region, cadence, cohortYear, rampedStatus, commissionType, teamId, teamName },
 *   waterfall: [{ name, value, type }],
 *   revenueBreakdown: [{ name, assets, revenue }],
 *   tiers: [{ tier, threshold, rate, revenueInTier, commissionPerTier }],
 *   splits: { out: [...], in: [...], netImpact },
 *   recruiter: { recruiterName, rate, vestingYear, vestingPct, payout } | null,
 *   trend: [{ period, aum, revenue, contribution }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { billingQuery, billingQueryOne } from '@/lib/billing-db';
import { withBillingCache } from '@/lib/billing-cache';

export const dynamic = 'force-dynamic';

interface AdvisorRow {
  id: string;
  name: string;
  type: string;
  region: string;
  cadence: string;
  cohort_year: number;
  ramped_status: string;
  commission_type: string;
  team_id: string;
  team_name: string;
}

interface CommissionRow {
  total_revenue: number;
  splits_out: number;
  splits_in: number;
  net_revenue: number;
  tier1_commission: number;
  tier2_commission: number;
  tier3_commission: number;
  tier4_commission: number;
  calculated_commission: number;
  adjustments: number;
  override_amount: number;
  floor_amount: number;
  ratchet_bonus: number;
  final_commission: number;
  team_commission: number;
}

interface RevenueBreakdownRow {
  core_assets: number;
  core_revenue: number;
  assets_401k: number;
  revenue_401k_quarterly: number;
  assets_insurance: number;
  revenue_insurance: number;
  assets_advice_pay: number;
  revenue_advice_pay: number;
  assets_other: number;
  revenue_other: number;
}

interface TierRow {
  tier: number;
  threshold: number;
  rate: number;
}

interface SplitOutRow {
  recipient_name: string;
  split_percentage: number;
  split_amount: number;
}

interface SplitInRow {
  advisor_name: string;
  split_percentage: number;
  split_amount: number;
}

interface RecruiterRow {
  recruiter_name: string;
  rate: number;
  vesting_year: number;
  vesting_percentage: number;
  recruiter_commission: number;
}

interface TrendRow {
  period_date: string;
  aum?: number;
  revenue?: number;
  contribution?: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { advisorId: string } }
) {
  try {
    const { advisorId } = params;
    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get('period');

    // Get latest period if not specified
    const latestPeriodRow = await billingQueryOne<{ period_date: string }>(
      `SELECT period_date FROM "Advisor" ORDER BY period_date DESC LIMIT 1`
    );

    if (!latestPeriodRow) {
      return NextResponse.json(
        { success: false, data: null, error: 'No commission data available', retryable: false },
        { status: 404 }
      );
    }

    const period = periodParam || latestPeriodRow.period_date;
    const cacheKey = `commission-advisor-${advisorId}-${period}`;

    const { data } = await withBillingCache(
      cacheKey,
      async () => {
        // Fetch advisor info
        const advisorRow = await billingQueryOne<AdvisorRow>(
          `SELECT
            a.id,
            a.name,
            a.type,
            a.region,
            a.cadence,
            a."cohortYear" as cohort_year,
            a."rampedStatus" as ramped_status,
            a."commissionType" as commission_type,
            a."teamId" as team_id,
            t.name as team_name
          FROM "Advisor" a
          LEFT JOIN "Team" t ON a."teamId" = t.id
          WHERE a.id = $1 AND a."periodDate" = $2`,
          [advisorId, period]
        );

        if (!advisorRow) {
          throw new Error('Advisor not found');
        }

        // Commission data
        const commissionRow = await billingQueryOne<CommissionRow>(
          `SELECT
            "totalRevenue" as total_revenue,
            "splitsOut" as splits_out,
            "splitsIn" as splits_in,
            "netRevenue" as net_revenue,
            "tier1Commission" as tier1_commission,
            "tier2Commission" as tier2_commission,
            "tier3Commission" as tier3_commission,
            "tier4Commission" as tier4_commission,
            "calculatedCommission" as calculated_commission,
            "adjustments",
            "overrideAmount" as override_amount,
            "floorAmount" as floor_amount,
            "ratchetBonus" as ratchet_bonus,
            "finalCommission" as final_commission,
            "teamCommission" as team_commission
          FROM "AdvisorCommission"
          WHERE "advisorId" = $1 AND "periodDate" = $2`,
          [advisorId, period]
        );

        const commission = commissionRow || {
          total_revenue: 0,
          splits_out: 0,
          splits_in: 0,
          net_revenue: 0,
          tier1_commission: 0,
          tier2_commission: 0,
          tier3_commission: 0,
          tier4_commission: 0,
          calculated_commission: 0,
          adjustments: 0,
          override_amount: 0,
          floor_amount: 0,
          ratchet_bonus: 0,
          final_commission: 0,
          team_commission: 0,
        };

        // Waterfall
        const waterfall = [
          { name: '1. Gross Revenue', value: Number(commission.total_revenue) || 0, type: 'revenue' },
          { name: '2. Splits Out', value: -(Number(commission.splits_out) || 0), type: 'deduction' },
          { name: '3. Splits In', value: Number(commission.splits_in) || 0, type: 'addition' },
          { name: '4. Net Revenue', value: Number(commission.net_revenue) || 0, type: 'revenue' },
          { name: '5. Tier 1 Commission', value: Number(commission.tier1_commission) || 0, type: 'commission' },
          { name: '6. Tier 2 Commission', value: Number(commission.tier2_commission) || 0, type: 'commission' },
          { name: '7. Tier 3 Commission', value: Number(commission.tier3_commission) || 0, type: 'commission' },
          { name: '8. Tier 4 Commission', value: Number(commission.tier4_commission) || 0, type: 'commission' },
          { name: '9. Calculated Commission', value: Number(commission.calculated_commission) || 0, type: 'commission' },
          {
            name: '10. Adjustments',
            value: Number(commission.adjustments) + Number(commission.override_amount) + Number(commission.floor_amount) + Number(commission.ratchet_bonus),
            type: 'adjustment',
          },
          { name: '11. Final Commission', value: Number(commission.final_commission) || 0, type: 'final' },
        ];

        // Revenue breakdown
        const revenueRow = await billingQueryOne<RevenueBreakdownRow>(
          `SELECT
            "coreAssets" as core_assets,
            "coreRevenue" as core_revenue,
            "assets401k" as assets_401k,
            "revenue401kQuarterly" as revenue_401k_quarterly,
            "assetsInsurance" as assets_insurance,
            "revenueInsurance" as revenue_insurance,
            "assetsAdvicePay" as assets_advice_pay,
            "revenueAdvicePay" as revenue_advice_pay,
            "assetsOther" as assets_other,
            "revenueOther" as revenue_other
          FROM "AdvisorRevenueBreakdown"
          WHERE "advisorId" = $1 AND "periodDate" = $2`,
          [advisorId, period]
        );

        const revenue = revenueRow || {
          core_assets: 0,
          core_revenue: 0,
          assets_401k: 0,
          revenue_401k_quarterly: 0,
          assets_insurance: 0,
          revenue_insurance: 0,
          assets_advice_pay: 0,
          revenue_advice_pay: 0,
          assets_other: 0,
          revenue_other: 0,
        };

        const revenueBreakdown = [
          { name: 'Core', assets: Number(revenue.core_assets) || 0, revenue: Number(revenue.core_revenue) || 0 },
          { name: '401k', assets: Number(revenue.assets_401k) || 0, revenue: Number(revenue.revenue_401k_quarterly) || 0 },
          { name: 'Insurance', assets: Number(revenue.assets_insurance) || 0, revenue: Number(revenue.revenue_insurance) || 0 },
          { name: 'AdvicePay', assets: Number(revenue.assets_advice_pay) || 0, revenue: Number(revenue.revenue_advice_pay) || 0 },
          { name: 'Other', assets: Number(revenue.assets_other) || 0, revenue: Number(revenue.revenue_other) || 0 },
        ];

        // Tiers
        const tierRows = await billingQuery<TierRow>(
          `SELECT 1 as tier, "tier1Threshold" as threshold, "tier1Rate" as rate FROM "Advisor" WHERE id = $1 AND "periodDate" = $2
           UNION ALL
           SELECT 2 as tier, "tier2Threshold" as threshold, "tier2Rate" as rate FROM "Advisor" WHERE id = $1 AND "periodDate" = $2
           UNION ALL
           SELECT 3 as tier, "tier3Threshold" as threshold, "tier3Rate" as rate FROM "Advisor" WHERE id = $1 AND "periodDate" = $2
           UNION ALL
           SELECT 4 as tier, "tier4Threshold" as threshold, "tier4Rate" as rate FROM "Advisor" WHERE id = $1 AND "periodDate" = $2`,
          [advisorId, period, advisorId, period, advisorId, period, advisorId, period]
        );

        const tiers = tierRows.map((t, i) => ({
          tier: t.tier,
          threshold: Number(t.threshold) || 0,
          rate: Number(t.rate) || 0,
          revenueInTier: 0, // TODO: Calculate based on net revenue
          commissionPerTier: i === 0 ? Number(commission.tier1_commission) || 0
            : i === 1 ? Number(commission.tier2_commission) || 0
            : i === 2 ? Number(commission.tier3_commission) || 0
            : Number(commission.tier4_commission) || 0,
        }));

        // Splits out
        const splitsOutRows = await billingQuery<SplitOutRow>(
          `SELECT
            r.name as recipient_name,
            s."splitPercentage" as split_percentage,
            s."splitAmount" as split_amount
          FROM "AdvisorSplit" s
          LEFT JOIN "Advisor" r ON s."recipientId" = r.id
          WHERE s."advisorId" = $1`,
          [advisorId]
        );

        const splitsOut = splitsOutRows.map(s => ({
          name: s.recipient_name,
          percentage: Number(s.split_percentage) || 0,
          amount: Number(s.split_amount) || 0,
        }));

        // Splits in
        const splitsInRows = await billingQuery<SplitInRow>(
          `SELECT
            a.name as advisor_name,
            s."splitPercentage" as split_percentage,
            s."splitAmount" as split_amount
          FROM "AdvisorSplit" s
          LEFT JOIN "Advisor" a ON s."advisorId" = a.id
          WHERE s."recipientId" = $1`,
          [advisorId]
        );

        const splitsIn = splitsInRows.map(s => ({
          name: s.advisor_name,
          percentage: Number(s.split_percentage) || 0,
          amount: Number(s.split_amount) || 0,
        }));

        const netImpact = (Number(commission.splits_in) || 0) - (Number(commission.splits_out) || 0);

        // Recruiter commission
        const recruiterRow = await billingQueryOne<RecruiterRow>(
          `SELECT
            "recruiterName" as recruiter_name,
            rate,
            "vestingYear" as vesting_year,
            "vestingPercentage" as vesting_percentage,
            "recruiterCommission" as recruiter_commission
          FROM "RecruiterCommission"
          WHERE "advisorId" = $1
          ORDER BY "vestingYear" DESC
          LIMIT 1`,
          [advisorId]
        );

        const recruiter = recruiterRow ? {
          recruiterName: recruiterRow.recruiter_name,
          rate: Number(recruiterRow.rate) || 0,
          vestingYear: Number(recruiterRow.vesting_year),
          vestingPct: Number(recruiterRow.vesting_percentage) || 0,
          payout: Number(recruiterRow.recruiter_commission) || 0,
        } : null;

        // Trend (last 15 months)
        const aumTrendRows = await billingQuery<TrendRow>(
          `SELECT "periodDate" as period_date, aum FROM "AdvisorHistoricalAum"
           WHERE "advisorId" = $1 AND "periodDate" <= $2
           ORDER BY "periodDate" DESC LIMIT 15`,
          [advisorId, period]
        );

        const revenueTrendRows = await billingQuery<TrendRow>(
          `SELECT "periodDate" as period_date, revenue FROM "AdvisorHistoricalRevenue"
           WHERE "advisorId" = $1 AND "periodDate" <= $2
           ORDER BY "periodDate" DESC LIMIT 15`,
          [advisorId, period]
        );

        const contributionTrendRows = await billingQuery<TrendRow>(
          `SELECT "periodDate" as period_date, contribution FROM "AdvisorHistoricalContribution"
           WHERE "advisorId" = $1 AND "periodDate" <= $2
           ORDER BY "periodDate" DESC LIMIT 15`,
          [advisorId, period]
        );

        // Merge trends
        const trendMap = new Map<string, { aum: number; revenue: number; contribution: number }>();

        aumTrendRows.forEach(t => {
          trendMap.set(t.period_date, { aum: Number(t.aum) || 0, revenue: 0, contribution: 0 });
        });

        revenueTrendRows.forEach(t => {
          const existing = trendMap.get(t.period_date) || { aum: 0, revenue: 0, contribution: 0 };
          existing.revenue = Number(t.revenue) || 0;
          trendMap.set(t.period_date, existing);
        });

        contributionTrendRows.forEach(t => {
          const existing = trendMap.get(t.period_date) || { aum: 0, revenue: 0, contribution: 0 };
          existing.contribution = Number(t.contribution) || 0;
          trendMap.set(t.period_date, existing);
        });

        const trend = Array.from(trendMap.entries())
          .map(([period, values]) => ({ period, ...values }))
          .sort((a, b) => a.period.localeCompare(b.period));

        return {
          advisor: {
            id: advisorRow.id,
            name: advisorRow.name,
            type: advisorRow.type,
            region: advisorRow.region,
            cadence: advisorRow.cadence,
            cohortYear: Number(advisorRow.cohort_year),
            rampedStatus: advisorRow.ramped_status,
            commissionType: advisorRow.commission_type,
            teamId: advisorRow.team_id,
            teamName: advisorRow.team_name,
          },
          waterfall,
          revenueBreakdown,
          tiers,
          splits: { out: splitsOut, in: splitsIn, netImpact },
          recruiter,
          trend,
        };
      },
      { ttlMs: 3600000 } // 1 hour
    );

    return NextResponse.json(data);
  } catch (err) {
    console.error('[GET /api/commission/advisor/[advisorId]]', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch advisor commission data';
    return NextResponse.json(
      { success: false, data: null, error: message, retryable: true },
      { status: 500 }
    );
  }
}
