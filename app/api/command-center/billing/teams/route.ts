import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const INTERNAL_TEAMS = "('Farther Portal','Farther - Internal','No Team','Employee Accounts')";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let period = searchParams.get('period');
    const sort = searchParams.get('sort') || 'aum';

    // Get latest period if not provided
    if (!period) {
      const latestRes = await pool.query(`
        SELECT MAX(billing_period)::text AS p FROM monthly_billing
        WHERE team NOT IN ${INTERNAL_TEAMS}
      `);
      period = latestRes.rows[0].p;
    }

    // Find prior period
    const priorRes = await pool.query(`
      SELECT MAX(billing_period)::text AS p FROM monthly_billing
      WHERE billing_period < $1 AND team NOT IN ${INTERNAL_TEAMS}
    `, [period]);
    const priorPeriod = priorRes.rows[0]?.p || null;

    // Firm totals for % calculation
    const firmRes = await pool.query(`
      SELECT SUM(account_value) AS firm_aum, SUM(total_period_fee) AS firm_rev
      FROM monthly_billing
      WHERE billing_period = $1 AND team NOT IN ${INTERNAL_TEAMS}
    `, [period]);
    const firmAUM = Number(firmRes.rows[0].firm_aum) || 1;
    const firmRev = Number(firmRes.rows[0].firm_rev) || 1;

    // Current period team metrics
    const currentRes = await pool.query(`
      SELECT
        team,
        SUM(account_value) AS aum,
        SUM(total_period_fee) AS revenue,
        COUNT(DISTINCT relationship) AS relationships,
        COUNT(DISTINCT account_number) AS accounts,
        CASE WHEN SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) > 0
          THEN SUM(total_period_fee) / SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) * 10000
          ELSE 0 END AS bps,
        SUM(CASE WHEN rate_bps = 0 THEN account_value ELSE 0 END) AS zero_bps_aum,
        SUM(CASE WHEN cash_difference < 0 THEN cash_difference ELSE 0 END) AS cash_shortfall
      FROM monthly_billing
      WHERE billing_period = $1 AND team NOT IN ${INTERNAL_TEAMS}
      GROUP BY team
    `, [period]);

    // Prior period team metrics (for MoM deltas)
    const priorMap: Record<string, { aum: number; revenue: number; rels: number; bps: number }> = {};
    if (priorPeriod) {
      const priorTeamRes = await pool.query(`
        SELECT
          team,
          SUM(account_value) AS aum,
          SUM(total_period_fee) AS revenue,
          COUNT(DISTINCT relationship) AS relationships,
          CASE WHEN SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) > 0
            THEN SUM(total_period_fee) / SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) * 10000
            ELSE 0 END AS bps
        FROM monthly_billing
        WHERE billing_period = $1 AND team NOT IN ${INTERNAL_TEAMS}
        GROUP BY team
      `, [priorPeriod]);
      for (const r of priorTeamRes.rows) {
        priorMap[r.team] = {
          aum: Number(r.aum),
          revenue: Number(r.revenue),
          rels: Number(r.relationships),
          bps: Number(r.bps),
        };
      }
    }

    // Annualized revenue per team (for tier badges)
    const annualRes = await pool.query(`
      SELECT team, AVG(monthly_rev) * 12 AS annualized
      FROM (
        SELECT team, billing_period, SUM(total_period_fee) AS monthly_rev
        FROM monthly_billing
        WHERE team NOT IN ${INTERNAL_TEAMS}
        GROUP BY team, billing_period
      ) sub
      GROUP BY team
    `);
    const annualMap: Record<string, number> = {};
    for (const r of annualRes.rows) {
      annualMap[r.team] = Number(r.annualized);
    }

    // 15-period AUM mini-series per team
    const seriesRes = await pool.query(`
      SELECT team, billing_period::text AS period, SUM(account_value) AS aum
      FROM monthly_billing
      WHERE team NOT IN ${INTERNAL_TEAMS}
      GROUP BY team, billing_period
      ORDER BY billing_period
    `);
    const seriesMap: Record<string, number[]> = {};
    for (const r of seriesRes.rows) {
      if (!seriesMap[r.team]) seriesMap[r.team] = [];
      seriesMap[r.team].push(Number(r.aum));
    }

    // Build team list
    const pct = (a: number, b: number) => b ? ((a - b) / Math.abs(b)) * 100 : 0;
    const getTier = (ann: number) => {
      if (ann >= 1_000_000) return 'Principal';
      if (ann >= 750_000) return 'Managing Director';
      if (ann >= 300_000) return 'SVP';
      if (ann >= 150_000) return 'VP';
      return 'Associate';
    };

    const teams = currentRes.rows.map((r: Record<string, unknown>) => {
      const team = String(r.team);
      const aum = Number(r.aum);
      const revenue = Number(r.revenue);
      const bps = Number(r.bps);
      const prior = priorMap[team];
      const annualized = annualMap[team] || 0;

      return {
        team,
        aum,
        revenue,
        relationships: Number(r.relationships),
        accounts: Number(r.accounts),
        bps,
        zeroBpsAum: Number(r.zero_bps_aum),
        cashShortfall: Number(r.cash_shortfall),
        aumChangePct: prior ? pct(aum, prior.aum) : 0,
        revenueChangePct: prior ? pct(revenue, prior.revenue) : 0,
        bpsChange: prior ? bps - prior.bps : 0,
        relChange: prior ? Number(r.relationships) - prior.rels : 0,
        pctOfFirmAUM: (aum / firmAUM) * 100,
        pctOfFirmRevenue: (revenue / firmRev) * 100,
        tier: getTier(annualized),
        annualizedRevenue: annualized,
        aumSeries: seriesMap[team] || [],
      };
    });

    // Sort
    const sortFn = (a: typeof teams[0], b: typeof teams[0]) => {
      const key = sort === 'revenue' ? 'revenue' : sort === 'bps' ? 'bps' : sort === 'growth' ? 'aumChangePct' : 'aum';
      return (b[key as keyof typeof b] as number) - (a[key as keyof typeof a] as number);
    };
    teams.sort(sortFn);

    // Compute ranks — also need prior period ranks for rank change
    const currentRanks: Record<string, number> = {};
    teams.forEach((t: { team: string }, i: number) => { currentRanks[t.team] = i + 1; });

    // Prior period ranks (by AUM)
    const priorRanks: Record<string, number> = {};
    if (priorPeriod) {
      const priorRankKeys = Object.entries(priorMap)
        .sort(([, a], [, b]) => b.aum - a.aum);
      priorRankKeys.forEach(([team], i) => { priorRanks[team] = i + 1; });
    }

    const rankedTeams = teams.map((t: { team: string }) => ({
      ...t,
      rank: currentRanks[t.team],
      rankChange: priorRanks[t.team] ? priorRanks[t.team] - currentRanks[t.team] : 0,
    }));

    return NextResponse.json({
      period,
      teams: rankedTeams,
      summary: {
        totalTeams: teams.length,
        avgAumPerTeam: teams.reduce((s: number, t: { aum: number }) => s + t.aum, 0) / (teams.length || 1),
        avgRevenuePerTeam: teams.reduce((s: number, t: { revenue: number }) => s + t.revenue, 0) / (teams.length || 1),
      },
    });
  } catch (err) {
    console.error('Billing teams error:', err);
    return NextResponse.json({ error: 'Failed to load billing teams' }, { status: 500 });
  }
}
