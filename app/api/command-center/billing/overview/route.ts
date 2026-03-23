import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const INTERNAL_TEAMS = "('Farther Portal','Farther - Internal','No Team','Employee Accounts')";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let period = searchParams.get('period');

    // 1. Available periods
    const periodsRes = await pool.query(`
      SELECT DISTINCT billing_period::text AS p
      FROM monthly_billing
      WHERE team NOT IN ${INTERNAL_TEAMS}
      ORDER BY p DESC
    `);
    const periods: string[] = periodsRes.rows.map((r: { p: string }) => r.p);

    if (!period || !periods.includes(period)) {
      period = periods[0];
    }

    // Find prior period
    const periodIdx = periods.indexOf(period);
    const priorPeriod = periodIdx < periods.length - 1 ? periods[periodIdx + 1] : null;

    // 2. Current period KPIs
    const currentRes = await pool.query(`
      SELECT
        SUM(account_value)                                          AS total_aum,
        SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END)  AS billable_aum,
        SUM(CASE WHEN rate_bps = 0 THEN account_value ELSE 0 END)  AS zero_bps_aum,
        SUM(total_period_fee)                                       AS total_revenue,
        COUNT(DISTINCT team)                                        AS team_count,
        COUNT(DISTINCT relationship)                                AS rel_count,
        COUNT(DISTINCT account_number)                              AS account_count,
        CASE WHEN SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) > 0
          THEN SUM(total_period_fee) / SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) * 10000
          ELSE 0 END                                                AS weighted_avg_bps,
        SUM(CASE WHEN cash_difference < 0 THEN cash_difference ELSE 0 END) AS cash_shortfall
      FROM monthly_billing
      WHERE billing_period = $1 AND team NOT IN ${INTERNAL_TEAMS}
    `, [period]);
    const current = currentRes.rows[0];

    // 3. Prior period KPIs (for MoM)
    let prior = null;
    if (priorPeriod) {
      const priorRes = await pool.query(`
        SELECT
          SUM(account_value) AS total_aum,
          SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) AS billable_aum,
          SUM(CASE WHEN rate_bps = 0 THEN account_value ELSE 0 END) AS zero_bps_aum,
          SUM(total_period_fee) AS total_revenue,
          COUNT(DISTINCT team) AS team_count,
          COUNT(DISTINCT relationship) AS rel_count,
          COUNT(DISTINCT account_number) AS account_count,
          CASE WHEN SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) > 0
            THEN SUM(total_period_fee) / SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) * 10000
            ELSE 0 END AS weighted_avg_bps,
          SUM(CASE WHEN cash_difference < 0 THEN cash_difference ELSE 0 END) AS cash_shortfall
        FROM monthly_billing
        WHERE billing_period = $1 AND team NOT IN ${INTERNAL_TEAMS}
      `, [priorPeriod]);
      prior = priorRes.rows[0];
    }

    // Compute MoM deltas
    const pct = (a: number, b: number) => b ? ((a - b) / Math.abs(b)) * 100 : 0;
    const mom = prior ? {
      aumChange: Number(current.total_aum) - Number(prior.total_aum),
      aumChangePct: pct(Number(current.total_aum), Number(prior.total_aum)),
      revenueChange: Number(current.total_revenue) - Number(prior.total_revenue),
      revenueChangePct: pct(Number(current.total_revenue), Number(prior.total_revenue)),
      teamChange: Number(current.team_count) - Number(prior.team_count),
      relChange: Number(current.rel_count) - Number(prior.rel_count),
      bpsChange: Number(current.weighted_avg_bps) - Number(prior.weighted_avg_bps),
    } : {
      aumChange: 0, aumChangePct: 0, revenueChange: 0, revenueChangePct: 0,
      teamChange: 0, relChange: 0, bpsChange: 0,
    };

    // 4. Time series (all periods)
    const tsRes = await pool.query(`
      SELECT
        billing_period::text AS period,
        SUM(account_value) AS total_aum,
        SUM(total_period_fee) AS total_revenue,
        COUNT(DISTINCT team) AS team_count,
        COUNT(DISTINCT relationship) AS rel_count,
        CASE WHEN SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) > 0
          THEN SUM(total_period_fee) / SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) * 10000
          ELSE 0 END AS avg_bps
      FROM monthly_billing
      WHERE team NOT IN ${INTERNAL_TEAMS}
      GROUP BY billing_period
      ORDER BY billing_period
    `);

    // 5. Revenue tier distribution — annualized per team (avg monthly * 12)
    const tierRes = await pool.query(`
      WITH team_annual AS (
        SELECT
          team,
          AVG(monthly_rev) * 12 AS annualized
        FROM (
          SELECT team, billing_period, SUM(total_period_fee) AS monthly_rev
          FROM monthly_billing
          WHERE team NOT IN ${INTERNAL_TEAMS}
          GROUP BY team, billing_period
        ) sub
        GROUP BY team
      )
      SELECT
        CASE
          WHEN annualized >= 1000000 THEN 'Principal'
          WHEN annualized >= 750000  THEN 'Managing Director'
          WHEN annualized >= 300000  THEN 'SVP'
          WHEN annualized >= 150000  THEN 'VP'
          ELSE 'Associate'
        END AS tier,
        COUNT(*) AS team_count,
        SUM(annualized) AS revenue
      FROM team_annual
      GROUP BY tier
      ORDER BY MAX(annualized) DESC
    `);

    // 6. Top-10 concentration
    const concRes = await pool.query(`
      WITH totals AS (
        SELECT SUM(account_value) AS firm_aum, SUM(total_period_fee) AS firm_rev
        FROM monthly_billing
        WHERE billing_period = $1 AND team NOT IN ${INTERNAL_TEAMS}
      )
      SELECT
        m.team,
        SUM(m.account_value) AS aum,
        SUM(m.total_period_fee) AS revenue,
        SUM(m.account_value) / NULLIF(t.firm_aum, 0) * 100 AS pct_of_firm_aum,
        SUM(m.total_period_fee) / NULLIF(t.firm_rev, 0) * 100 AS pct_of_firm_revenue
      FROM monthly_billing m
      CROSS JOIN totals t
      WHERE m.billing_period = $1 AND m.team NOT IN ${INTERNAL_TEAMS}
      GROUP BY m.team, t.firm_aum, t.firm_rev
      ORDER BY aum DESC
      LIMIT 10
    `, [period]);

    const toNum = (v: unknown) => Number(v) || 0;

    return NextResponse.json({
      periods,
      selectedPeriod: period,
      current: {
        totalAUM: toNum(current.total_aum),
        billableAUM: toNum(current.billable_aum),
        zeroBpsAUM: toNum(current.zero_bps_aum),
        totalRevenue: toNum(current.total_revenue),
        teamCount: toNum(current.team_count),
        relCount: toNum(current.rel_count),
        accountCount: toNum(current.account_count),
        weightedAvgBps: toNum(current.weighted_avg_bps),
        cashShortfall: toNum(current.cash_shortfall),
      },
      prior: prior ? {
        totalAUM: toNum(prior.total_aum),
        billableAUM: toNum(prior.billable_aum),
        zeroBpsAUM: toNum(prior.zero_bps_aum),
        totalRevenue: toNum(prior.total_revenue),
        teamCount: toNum(prior.team_count),
        relCount: toNum(prior.rel_count),
        accountCount: toNum(prior.account_count),
        weightedAvgBps: toNum(prior.weighted_avg_bps),
        cashShortfall: toNum(prior.cash_shortfall),
      } : null,
      mom,
      timeSeries: tsRes.rows.map((r: Record<string, unknown>) => ({
        period: r.period,
        totalAUM: toNum(r.total_aum),
        totalRevenue: toNum(r.total_revenue),
        teamCount: toNum(r.team_count),
        relCount: toNum(r.rel_count),
        avgBps: toNum(r.avg_bps),
      })),
      revenueTiers: tierRes.rows.map((r: Record<string, unknown>) => ({
        tier: r.tier,
        teamCount: toNum(r.team_count),
        revenue: toNum(r.revenue),
      })),
      concentration: concRes.rows.map((r: Record<string, unknown>) => ({
        team: r.team,
        aum: toNum(r.aum),
        revenue: toNum(r.revenue),
        pctOfFirmAUM: toNum(r.pct_of_firm_aum),
        pctOfFirmRevenue: toNum(r.pct_of_firm_revenue),
      })),
    });
  } catch (err) {
    console.error('Billing overview error:', err);
    return NextResponse.json({ error: 'Failed to load billing overview' }, { status: 500 });
  }
}
