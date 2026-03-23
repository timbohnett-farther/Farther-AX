import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const INTERNAL_TEAMS = "('Farther Portal','Farther - Internal','No Team','Employee Accounts')";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ team: string }> }
) {
  try {
    const { team: rawTeam } = await params;
    const team = decodeURIComponent(rawTeam);
    const { searchParams } = new URL(request.url);
    let period = searchParams.get('period');
    const relationship = searchParams.get('relationship');

    // Get latest period if not provided
    if (!period) {
      const latestRes = await pool.query(`
        SELECT MAX(billing_period)::text AS p FROM monthly_billing WHERE team = $1
      `, [team]);
      period = latestRes.rows[0]?.p;
      if (!period) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }
    }

    // Find prior period
    const priorRes = await pool.query(`
      SELECT MAX(billing_period)::text AS p FROM monthly_billing
      WHERE billing_period < $1 AND team = $2
    `, [period, team]);
    const priorPeriod = priorRes.rows[0]?.p || null;

    // 1. Team time series (all periods)
    const tsRes = await pool.query(`
      SELECT
        billing_period::text AS period,
        SUM(account_value) AS aum,
        SUM(total_period_fee) AS revenue,
        COUNT(DISTINCT relationship) AS relationships,
        COUNT(DISTINCT account_number) AS accounts,
        CASE WHEN SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) > 0
          THEN SUM(total_period_fee) / SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) * 10000
          ELSE 0 END AS bps,
        SUM(CASE WHEN cash_difference < 0 THEN cash_difference ELSE 0 END) AS cash_shortfall
      FROM monthly_billing
      WHERE team = $1 AND team NOT IN ${INTERNAL_TEAMS}
      GROUP BY billing_period
      ORDER BY billing_period
    `, [team]);

    // 2. Annualized revenue for tier
    const annualRes = await pool.query(`
      SELECT AVG(monthly_rev) * 12 AS annualized
      FROM (
        SELECT SUM(total_period_fee) AS monthly_rev
        FROM monthly_billing
        WHERE team = $1 AND team NOT IN ${INTERNAL_TEAMS}
        GROUP BY billing_period
      ) sub
    `, [team]);
    const annualized = Number(annualRes.rows[0]?.annualized) || 0;
    const tier = annualized >= 1_000_000 ? 'Principal' : annualized >= 750_000 ? 'Managing Director' : annualized >= 300_000 ? 'SVP' : annualized >= 150_000 ? 'VP' : 'Associate';

    // 3. Relationships for selected period with MoM
    const relRes = await pool.query(`
      SELECT
        relationship,
        SUM(account_value) AS aum,
        SUM(total_period_fee) AS revenue,
        COUNT(DISTINCT account_number) AS accounts,
        CASE WHEN SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) > 0
          THEN SUM(total_period_fee) / SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) * 10000
          ELSE 0 END AS bps,
        SUM(CASE WHEN rate_bps = 0 THEN account_value ELSE 0 END) AS zero_bps_aum,
        SUM(CASE WHEN cash_difference < 0 THEN cash_difference ELSE 0 END) AS cash_shortfall,
        ARRAY_AGG(DISTINCT custodian) FILTER (WHERE custodian IS NOT NULL AND custodian != '') AS custodians,
        MIN(billing_start_date) AS billing_start_date
      FROM monthly_billing
      WHERE team = $1 AND billing_period = $2 AND team NOT IN ${INTERNAL_TEAMS}
      GROUP BY relationship
      ORDER BY SUM(account_value) DESC
    `, [team, period]);

    // Prior period relationship data for MoM
    const priorRelMap: Record<string, number> = {};
    const priorRelTeams: Set<string> = new Set();
    if (priorPeriod) {
      const priorRelRes = await pool.query(`
        SELECT relationship, SUM(account_value) AS aum
        FROM monthly_billing
        WHERE team = $1 AND billing_period = $2 AND team NOT IN ${INTERNAL_TEAMS}
        GROUP BY relationship
      `, [team, priorPeriod]);
      for (const r of priorRelRes.rows) {
        priorRelMap[r.relationship] = Number(r.aum);
        priorRelTeams.add(r.relationship);
      }
    }

    // 4. Account-level detail for a specific relationship
    let accountDetails = null;
    if (relationship) {
      const acctRes = await pool.query(`
        SELECT
          m.account_name, m.account_number, m.account_value, m.billed_value,
          m.rate_bps, m.fee_schedule, m.total_period_fee,
          m.cash_available, m.cash_difference, m.custodian, m.warnings,
          f.model_portfolio, f.trading_status
        FROM monthly_billing m
        LEFT JOIN fam_model_usage f ON m.account_number = f.custodian_account_id
        WHERE m.team = $1 AND m.billing_period = $2 AND m.relationship = $3
        ORDER BY m.account_value DESC
      `, [team, period, relationship]);
      accountDetails = acctRes.rows.map((r: Record<string, unknown>) => ({
        account_name: r.account_name,
        account_number: r.account_number,
        account_value: Number(r.account_value) || 0,
        billed_value: Number(r.billed_value) || 0,
        rate_bps: Number(r.rate_bps) || 0,
        fee_schedule: r.fee_schedule,
        total_period_fee: Number(r.total_period_fee) || 0,
        cash_available: Number(r.cash_available) || 0,
        cash_difference: Number(r.cash_difference) || 0,
        custodian: r.custodian,
        warnings: r.warnings || null,
        model_portfolio: r.model_portfolio || null,
        trading_status: r.trading_status || null,
      }));
    }

    // 5. Concentration (top 20 relationships)
    const totalTeamAUM = relRes.rows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.aum), 0);
    let cumPct = 0;
    const concentration = relRes.rows.slice(0, 20).map((r: Record<string, unknown>) => {
      const pct = totalTeamAUM > 0 ? (Number(r.aum) / totalTeamAUM) * 100 : 0;
      cumPct += pct;
      return { relationship: r.relationship, aum: Number(r.aum), pctOfTeam: pct, cumulativePct: cumPct };
    });

    // 6. Firm averages for comparison
    const firmAvgRes = await pool.query(`
      SELECT
        billing_period::text AS period,
        SUM(account_value) / COUNT(DISTINCT team) AS avg_aum,
        SUM(total_period_fee) / COUNT(DISTINCT team) AS avg_revenue,
        CASE WHEN SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) > 0
          THEN SUM(total_period_fee) / SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) * 10000
          ELSE 0 END AS avg_bps
      FROM monthly_billing
      WHERE team NOT IN ${INTERNAL_TEAMS}
      GROUP BY billing_period
      ORDER BY billing_period
    `);

    const pctFn = (a: number, b: number) => b ? ((a - b) / Math.abs(b)) * 100 : 0;

    const relationships = relRes.rows.map((r: Record<string, unknown>) => {
      const relName = String(r.relationship);
      const aum = Number(r.aum);
      const priorAum = priorRelMap[relName];
      const isNew = priorPeriod ? !priorRelTeams.has(relName) : false;

      return {
        relationship: relName,
        aum,
        aumChange: priorAum !== undefined ? pctFn(aum, priorAum) : 0,
        revenue: Number(r.revenue),
        accounts: Number(r.accounts),
        bps: Number(r.bps),
        zeroBpsAum: Number(r.zero_bps_aum),
        cashShortfall: Number(r.cash_shortfall),
        custodians: r.custodians || [],
        billingStartDate: r.billing_start_date || null,
        isNew,
      };
    });

    return NextResponse.json({
      team,
      period,
      tier,
      annualizedRevenue: annualized,
      timeSeries: tsRes.rows.map((r: Record<string, unknown>) => ({
        period: r.period,
        aum: Number(r.aum),
        revenue: Number(r.revenue),
        relationships: Number(r.relationships),
        accounts: Number(r.accounts),
        bps: Number(r.bps),
        cashShortfall: Number(r.cash_shortfall),
      })),
      relationships,
      accountDetails,
      concentration,
      firmAverages: firmAvgRes.rows.map((r: Record<string, unknown>) => ({
        period: r.period,
        avgAum: Number(r.avg_aum),
        avgRevenue: Number(r.avg_revenue),
        avgBps: Number(r.avg_bps),
      })),
    });
  } catch (err) {
    console.error('Billing team detail error:', err);
    return NextResponse.json({ error: 'Failed to load team detail' }, { status: 500 });
  }
}
