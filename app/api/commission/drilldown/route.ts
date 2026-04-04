/**
 * app/api/commission/drilldown/route.ts
 *
 * Flexible drilldown endpoint for commission analytics.
 *
 * Query params:
 *   ?metric=commission      (commission, revenue, aum, margin, netCommission)
 *   ?dimension=team         (team, region, type, cadence, cohort, tier)
 *   ?period=YYYY-MM-DD      (optional) — defaults to latest period
 *
 * Returns:
 * {
 *   items: [{ label, value, pct }],
 *   total: number
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { billingQuery, billingQueryOne } from '@/lib/billing-db';
import { withBillingCache } from '@/lib/billing-cache';

export const dynamic = 'force-dynamic';

interface DrilldownRow {
  label: string;
  value: number;
}

type Metric = 'commission' | 'revenue' | 'aum' | 'margin' | 'netCommission';
type Dimension = 'team' | 'region' | 'type' | 'cadence' | 'cohort' | 'tier';

const METRIC_COLUMNS: Record<Metric, string> = {
  commission: 'SUM(ac."finalCommission")',
  revenue: 'SUM(ac."totalRevenue")',
  aum: 'SUM(ac."totalAum")',
  margin: 'SUM(ac."totalRevenue" - ac."finalCommission")',
  netCommission: 'SUM(ac."netCommissionDue")',
};

const DIMENSION_COLUMNS: Record<Dimension, { column: string; join?: string }> = {
  team: {
    column: 't.name',
    join: 'LEFT JOIN "Team" t ON a."teamId" = t.id',
  },
  region: { column: 'a.region' },
  type: { column: 'a.type' },
  cadence: { column: 'a.cadence' },
  cohort: { column: 'a."cohortYear"::text' },
  tier: { column: 'a."commissionType"' },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const metricParam = searchParams.get('metric') as Metric | null;
    const dimensionParam = searchParams.get('dimension') as Dimension | null;
    const periodParam = searchParams.get('period');

    if (!metricParam || !METRIC_COLUMNS[metricParam]) {
      return NextResponse.json(
        { success: false, data: null, error: 'Invalid or missing metric parameter', retryable: false },
        { status: 400 }
      );
    }

    if (!dimensionParam || !DIMENSION_COLUMNS[dimensionParam]) {
      return NextResponse.json(
        { success: false, data: null, error: 'Invalid or missing dimension parameter', retryable: false },
        { status: 400 }
      );
    }

    const metric = metricParam;
    const dimension = dimensionParam;

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
    const cacheKey = `commission-drilldown-${metric}-${dimension}-${period}`;

    const { data } = await withBillingCache(
      cacheKey,
      async () => {
        const metricColumn = METRIC_COLUMNS[metric];
        const dimensionConfig = DIMENSION_COLUMNS[dimension];
        const dimensionColumn = dimensionConfig.column;
        const joinClause = dimensionConfig.join || '';

        const query = `
          SELECT
            ${dimensionColumn} as label,
            ${metricColumn} as value
          FROM "Advisor" a
          LEFT JOIN "AdvisorCommission" ac ON a.id = ac."advisorId" AND ac."periodDate" = $1
          ${joinClause}
          WHERE a."periodDate" = $1
          GROUP BY ${dimensionColumn}
          ORDER BY value DESC NULLS LAST
        `;

        const rows = await billingQuery<DrilldownRow>(query, [period]);

        const total = rows.reduce((sum, row) => sum + (Number(row.value) || 0), 0);

        const items = rows.map(row => ({
          label: row.label || 'Unknown',
          value: Number(row.value) || 0,
          pct: total > 0 ? (Number(row.value) / total) * 100 : 0,
        }));

        return { items, total };
      },
      { ttlMs: 3600000 } // 1 hour
    );

    return NextResponse.json(data);
  } catch (err) {
    console.error('[GET /api/commission/drilldown]', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch drilldown data';
    return NextResponse.json(
      { success: false, data: null, error: message, retryable: true },
      { status: 500 }
    );
  }
}
