/**
 * app/api/commission/team/[teamId]/route.ts
 *
 * Team-level commission detail endpoint.
 *
 * Query params:
 *   ?period=YYYY-MM-DD (optional) — defaults to latest period
 *
 * Returns:
 * {
 *   team: { id, name, region, manager, isActive },
 *   summary: { aum, revenue, commission, margin, advisorCount },
 *   advisors: [{ id, name, type, cadence, aum, revenue, splitsOut, splitsIn, commission, commissionPct, rampedStatus, commissionType }],
 *   trend: [{ period, aum, revenue, commission, advisorCount }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { billingQuery, billingQueryOne } from '@/lib/billing-db';
import { withBillingCache } from '@/lib/billing-cache';

export const dynamic = 'force-dynamic';

interface TeamRow {
  id: string;
  name: string;
  region: string;
  manager: string;
  is_active: boolean;
}

interface SummaryRow {
  total_aum: number;
  total_revenue: number;
  total_commission: number;
  advisor_count: number;
}

interface AdvisorRow {
  id: string;
  name: string;
  type: string;
  cadence: string;
  aum: number;
  revenue: number;
  splits_out: number;
  splits_in: number;
  commission: number;
  commission_pct: number;
  ramped_status: string;
  commission_type: string;
}

interface TrendRow {
  period_date: string;
  total_aum: number;
  total_revenue: number;
  advisor_count: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params;
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
    const cacheKey = `commission-team-${teamId}-${period}`;

    const { data } = await withBillingCache(
      cacheKey,
      async () => {
        // Fetch team info
        const teamRow = await billingQueryOne<TeamRow>(
          `SELECT id, name, region, manager, "isActive" as is_active
           FROM "Team"
           WHERE id = $1`,
          [teamId]
        );

        if (!teamRow) {
          throw new Error('Team not found');
        }

        // Summary
        const summaryRows = await billingQuery<SummaryRow>(
          `SELECT
            SUM(ac."totalAum") as total_aum,
            SUM(ac."totalRevenue") as total_revenue,
            SUM(ac."finalCommission") as total_commission,
            COUNT(a.id) as advisor_count
          FROM "Advisor" a
          LEFT JOIN "AdvisorCommission" ac ON a.id = ac."advisorId" AND ac."periodDate" = $1
          WHERE a."teamId" = $2 AND a."periodDate" = $1`,
          [period, teamId]
        );

        const summary = summaryRows[0] || {
          total_aum: 0,
          total_revenue: 0,
          total_commission: 0,
          advisor_count: 0,
        };

        const margin = summary.total_revenue > 0
          ? ((summary.total_revenue - summary.total_commission) / summary.total_revenue) * 100
          : 0;

        // Advisors
        const advisorRows = await billingQuery<AdvisorRow>(
          `SELECT
            a.id,
            a.name,
            a.type,
            a.cadence,
            ac."totalAum" as aum,
            ac."totalRevenue" as revenue,
            ac."splitsOut" as splits_out,
            ac."splitsIn" as splits_in,
            ac."finalCommission" as commission,
            ac."commissionPct" as commission_pct,
            a."rampedStatus" as ramped_status,
            a."commissionType" as commission_type
          FROM "Advisor" a
          LEFT JOIN "AdvisorCommission" ac ON a.id = ac."advisorId" AND ac."periodDate" = $1
          WHERE a."teamId" = $2 AND a."periodDate" = $1
          ORDER BY ac."totalAum" DESC NULLS LAST`,
          [period, teamId]
        );

        const advisors = advisorRows.map(adv => ({
          id: adv.id,
          name: adv.name,
          type: adv.type,
          cadence: adv.cadence,
          aum: Number(adv.aum) || 0,
          revenue: Number(adv.revenue) || 0,
          splitsOut: Number(adv.splits_out) || 0,
          splitsIn: Number(adv.splits_in) || 0,
          commission: Number(adv.commission) || 0,
          commissionPct: Number(adv.commission_pct) || 0,
          rampedStatus: adv.ramped_status || 'Unknown',
          commissionType: adv.commission_type || 'Unknown',
        }));

        // Trend (last 15 months from TeamSnapshot)
        const trendRows = await billingQuery<TrendRow>(
          `SELECT
            "periodDate" as period_date,
            "totalAum" as total_aum,
            "totalRevenue" as total_revenue,
            "advisorCount" as advisor_count
          FROM "TeamSnapshot"
          WHERE "teamId" = $1 AND "periodDate" <= $2
          ORDER BY "periodDate" DESC
          LIMIT 15`,
          [teamId, period]
        );

        const trend = trendRows
          .map(t => ({
            period: t.period_date,
            aum: Number(t.total_aum) || 0,
            revenue: Number(t.total_revenue) || 0,
            commission: 0, // Not tracked in TeamSnapshot
            advisorCount: Number(t.advisor_count),
          }))
          .reverse();

        return {
          team: {
            id: teamRow.id,
            name: teamRow.name,
            region: teamRow.region,
            manager: teamRow.manager,
            isActive: teamRow.is_active,
          },
          summary: {
            aum: Number(summary.total_aum) || 0,
            revenue: Number(summary.total_revenue) || 0,
            commission: Number(summary.total_commission) || 0,
            margin,
            advisorCount: Number(summary.advisor_count),
          },
          advisors,
          trend,
        };
      },
      { ttlMs: 3600000 } // 1 hour
    );

    return NextResponse.json(data);
  } catch (err) {
    console.error('[GET /api/commission/team/[teamId]]', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch team commission data';
    return NextResponse.json(
      { success: false, data: null, error: message, retryable: true },
      { status: 500 }
    );
  }
}
