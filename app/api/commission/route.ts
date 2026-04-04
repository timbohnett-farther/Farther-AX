/**
 * app/api/commission/route.ts
 *
 * Main commission dashboard endpoint — provides firm-wide summary,
 * team breakdown, region breakdown, tier distribution, and historical trend.
 *
 * Query params:
 *   ?period=YYYY-MM-DD (optional) — defaults to latest period
 *
 * Returns:
 * {
 *   period: string,
 *   summary: { totalAdvisors, activeAdvisors, totalAUM, totalRevenue, totalCommission, totalNetCommission, avgCommissionRate, avgImpliedBps },
 *   teamBreakdown: [{ teamId, teamName, advisorCount, totalAUM, totalRevenue, totalCommission, avgCommissionPct, advisors: [...] }],
 *   regionBreakdown: [{ region, advisorCount, totalAUM, totalRevenue, totalCommission }],
 *   tierDistribution: [{ tier, count }],
 *   periods: [string],
 *   firmTrend: [{ period, revenue, commission, aum }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { billingQuery, billingQueryOne } from '@/lib/billing-db';
import { withBillingCache } from '@/lib/billing-cache';

export const dynamic = 'force-dynamic';

interface SummaryRow {
  total_advisors: number;
  active_advisors: number;
  total_aum: number;
  total_revenue: number;
  total_commission: number;
  total_net_commission: number;
  avg_commission_rate: number;
}

interface TeamRow {
  team_id: string;
  team_name: string;
  advisor_count: number;
  total_aum: number;
  total_revenue: number;
  total_commission: number;
  avg_commission_pct: number;
}

interface AdvisorInTeam {
  advisor_id: string;
  name: string;
  type: string;
  region: string;
  aum: number;
  total_revenue: number;
  commission: number;
  commission_pct: number;
  tier: string;
}

interface RegionRow {
  region: string;
  advisor_count: number;
  total_aum: number;
  total_revenue: number;
  total_commission: number;
}

interface TierRow {
  tier: string;
  count: number;
}

interface TrendRow {
  period: string;
  revenue: number;
  commission: number;
  aum: number;
}

export async function GET(req: NextRequest) {
  try {
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
    const cacheKey = `commission-summary-${period}`;

    const { data } = await withBillingCache(
      cacheKey,
      async () => {
        // Summary
        const summaryRows = await billingQuery<SummaryRow>(
          `SELECT
            COUNT(*) as total_advisors,
            SUM(CASE WHEN a."isActive" = true THEN 1 ELSE 0 END) as active_advisors,
            SUM(ac."totalAum") as total_aum,
            SUM(ac."totalRevenue") as total_revenue,
            SUM(ac."finalCommission") as total_commission,
            SUM(ac."netCommissionDue") as total_net_commission,
            AVG(ac."commissionPct") as avg_commission_rate
          FROM "Advisor" a
          LEFT JOIN "AdvisorCommission" ac ON a.id = ac."advisorId" AND ac."periodDate" = $1
          WHERE a."periodDate" = $1`,
          [period]
        );

        const summary = summaryRows[0] || {
          total_advisors: 0,
          active_advisors: 0,
          total_aum: 0,
          total_revenue: 0,
          total_commission: 0,
          total_net_commission: 0,
          avg_commission_rate: 0,
        };

        const avgImpliedBps = summary.total_aum > 0
          ? (summary.total_commission / summary.total_aum) * 10000
          : 0;

        // Team breakdown with inline advisors
        const teamRows = await billingQuery<TeamRow>(
          `SELECT
            t.id as team_id,
            t.name as team_name,
            COUNT(a.id) as advisor_count,
            SUM(ac."totalAum") as total_aum,
            SUM(ac."totalRevenue") as total_revenue,
            SUM(ac."finalCommission") as total_commission,
            AVG(ac."commissionPct") as avg_commission_pct
          FROM "Team" t
          LEFT JOIN "Advisor" a ON a."teamId" = t.id AND a."periodDate" = $1
          LEFT JOIN "AdvisorCommission" ac ON a.id = ac."advisorId" AND ac."periodDate" = $1
          WHERE t."isActive" = true
          GROUP BY t.id, t.name
          ORDER BY total_aum DESC NULLS LAST`,
          [period]
        );

        // Fetch advisors for each team
        const teamBreakdown = await Promise.all(
          teamRows.map(async (team) => {
            const advisorRows = await billingQuery<AdvisorInTeam>(
              `SELECT
                a.id as advisor_id,
                a.name,
                a.type,
                a.region,
                ac."totalAum" as aum,
                ac."totalRevenue" as total_revenue,
                ac."finalCommission" as commission,
                ac."commissionPct" as commission_pct,
                a."commissionType" as tier
              FROM "Advisor" a
              LEFT JOIN "AdvisorCommission" ac ON a.id = ac."advisorId" AND ac."periodDate" = $1
              WHERE a."teamId" = $2 AND a."periodDate" = $1
              ORDER BY ac."totalAum" DESC NULLS LAST`,
              [period, team.team_id]
            );

            return {
              teamId: team.team_id,
              teamName: team.team_name,
              advisorCount: Number(team.advisor_count),
              totalAUM: Number(team.total_aum) || 0,
              totalRevenue: Number(team.total_revenue) || 0,
              totalCommission: Number(team.total_commission) || 0,
              avgCommissionPct: Number(team.avg_commission_pct) || 0,
              advisors: advisorRows.map(adv => ({
                advisorId: adv.advisor_id,
                name: adv.name,
                type: adv.type,
                region: adv.region,
                aum: Number(adv.aum) || 0,
                totalRevenue: Number(adv.total_revenue) || 0,
                commission: Number(adv.commission) || 0,
                commissionPct: Number(adv.commission_pct) || 0,
                tier: adv.tier || 'Unknown',
              })),
            };
          })
        );

        // Region breakdown
        const regionRows = await billingQuery<RegionRow>(
          `SELECT
            a.region,
            COUNT(a.id) as advisor_count,
            SUM(ac."totalAum") as total_aum,
            SUM(ac."totalRevenue") as total_revenue,
            SUM(ac."finalCommission") as total_commission
          FROM "Advisor" a
          LEFT JOIN "AdvisorCommission" ac ON a.id = ac."advisorId" AND ac."periodDate" = $1
          WHERE a."periodDate" = $1
          GROUP BY a.region
          ORDER BY total_aum DESC NULLS LAST`,
          [period]
        );

        const regionBreakdown = regionRows.map(r => ({
          region: r.region,
          advisorCount: Number(r.advisor_count),
          totalAUM: Number(r.total_aum) || 0,
          totalRevenue: Number(r.total_revenue) || 0,
          totalCommission: Number(r.total_commission) || 0,
        }));

        // Tier distribution
        const tierRows = await billingQuery<TierRow>(
          `SELECT
            "commissionType" as tier,
            COUNT(*) as count
          FROM "Advisor"
          WHERE "periodDate" = $1
          GROUP BY "commissionType"
          ORDER BY count DESC`,
          [period]
        );

        const tierDistribution = tierRows.map(t => ({
          tier: t.tier || 'Unknown',
          count: Number(t.count),
        }));

        // All periods
        const periodRows = await billingQuery<{ period_date: string }>(
          `SELECT DISTINCT period_date FROM "Advisor" ORDER BY period_date DESC`
        );

        const periods = periodRows.map(p => p.period_date);

        // Firm trend (last 15 months from TeamSnapshot)
        const trendRows = await billingQuery<TrendRow>(
          `SELECT
            "periodDate" as period,
            SUM("totalRevenue") as revenue,
            0 as commission,
            SUM("totalAum") as aum
          FROM "TeamSnapshot"
          WHERE "periodDate" <= $1
          GROUP BY "periodDate"
          ORDER BY "periodDate" DESC
          LIMIT 15`,
          [period]
        );

        const firmTrend = trendRows
          .map(t => ({
            period: t.period,
            revenue: Number(t.revenue) || 0,
            commission: Number(t.commission) || 0,
            aum: Number(t.aum) || 0,
          }))
          .reverse();

        return {
          period,
          summary: {
            totalAdvisors: Number(summary.total_advisors),
            activeAdvisors: Number(summary.active_advisors),
            totalAUM: Number(summary.total_aum) || 0,
            totalRevenue: Number(summary.total_revenue) || 0,
            totalCommission: Number(summary.total_commission) || 0,
            totalNetCommission: Number(summary.total_net_commission) || 0,
            avgCommissionRate: Number(summary.avg_commission_rate) || 0,
            avgImpliedBps,
          },
          teamBreakdown,
          regionBreakdown,
          tierDistribution,
          periods,
          firmTrend,
        };
      },
      { ttlMs: 3600000 } // 1 hour
    );

    return NextResponse.json(data);
  } catch (err) {
    console.error('[GET /api/commission]', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch commission data';
    return NextResponse.json(
      { success: false, data: null, error: message, retryable: true },
      { status: 500 }
    );
  }
}
