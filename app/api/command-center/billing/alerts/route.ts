import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const INTERNAL_TEAMS = "('Farther Portal','Farther - Internal','No Team','Employee Accounts')";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let period = searchParams.get('period');

    if (!period) {
      const latestRes = await pool.query(`
        SELECT MAX(billing_period)::text AS p FROM monthly_billing WHERE team NOT IN ${INTERNAL_TEAMS}
      `);
      period = latestRes.rows[0].p;
    }

    // Find prior period
    const priorRes = await pool.query(`
      SELECT MAX(billing_period)::text AS p FROM monthly_billing
      WHERE billing_period < $1 AND team NOT IN ${INTERNAL_TEAMS}
    `, [period]);
    const priorPeriod = priorRes.rows[0]?.p || null;

    // 1. Zero-BPS accounts (value > $10K, rate = 0)
    const zeroBpsRes = await pool.query(`
      SELECT team, relationship, account_name, account_number, account_value, custodian
      FROM monthly_billing
      WHERE billing_period = $1 AND team NOT IN ${INTERNAL_TEAMS}
        AND rate_bps = 0 AND account_value > 10000
      ORDER BY account_value DESC
      LIMIT 100
    `, [period]);

    // 2. Cash shortfall accounts
    const cashRes = await pool.query(`
      SELECT team, relationship, account_name, account_number,
        account_value, cash_available, cash_difference
      FROM monthly_billing
      WHERE billing_period = $1 AND team NOT IN ${INTERNAL_TEAMS}
        AND cash_difference < 0
      ORDER BY cash_difference ASC
      LIMIT 100
    `, [period]);

    // 3. Shrinking relationships (AUM declined >10% MoM, prior AUM > $50K)
    let shrinking: Record<string, unknown>[] = [];
    if (priorPeriod) {
      const shrinkRes = await pool.query(`
        WITH curr AS (
          SELECT team, relationship, SUM(account_value) AS aum
          FROM monthly_billing
          WHERE billing_period = $1 AND team NOT IN ${INTERNAL_TEAMS}
          GROUP BY team, relationship
        ),
        prev AS (
          SELECT team, relationship, SUM(account_value) AS aum
          FROM monthly_billing
          WHERE billing_period = $2 AND team NOT IN ${INTERNAL_TEAMS}
          GROUP BY team, relationship
        )
        SELECT c.team, c.relationship, c.aum AS current_aum, p.aum AS prior_aum,
          (c.aum - p.aum) AS change,
          CASE WHEN p.aum > 0 THEN (c.aum - p.aum) / p.aum * 100 ELSE 0 END AS change_pct
        FROM curr c
        INNER JOIN prev p ON c.team = p.team AND c.relationship = p.relationship
        WHERE p.aum > 50000 AND c.aum < p.aum * 0.9
        ORDER BY change ASC
        LIMIT 50
      `, [period, priorPeriod]);
      shrinking = shrinkRes.rows;
    }

    // 4. Fee schedule warnings
    const warningsRes = await pool.query(`
      SELECT team, relationship, account_name, account_number, warnings, account_value
      FROM monthly_billing
      WHERE billing_period = $1 AND team NOT IN ${INTERNAL_TEAMS}
        AND warnings IS NOT NULL AND warnings != ''
      ORDER BY account_value DESC
      LIMIT 100
    `, [period]);

    // 5. BPS compression (teams whose weighted avg BPS dropped >5% MoM)
    let bpsCompression: Record<string, unknown>[] = [];
    if (priorPeriod) {
      const bpsRes = await pool.query(`
        WITH curr AS (
          SELECT team,
            CASE WHEN SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) > 0
              THEN SUM(total_period_fee) / SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) * 10000
              ELSE 0 END AS bps
          FROM monthly_billing
          WHERE billing_period = $1 AND team NOT IN ${INTERNAL_TEAMS}
          GROUP BY team
        ),
        prev AS (
          SELECT team,
            CASE WHEN SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) > 0
              THEN SUM(total_period_fee) / SUM(CASE WHEN rate_bps > 0 THEN account_value ELSE 0 END) * 10000
              ELSE 0 END AS bps
          FROM monthly_billing
          WHERE billing_period = $2 AND team NOT IN ${INTERNAL_TEAMS}
          GROUP BY team
        )
        SELECT c.team, c.bps AS current_bps, p.bps AS prior_bps,
          c.bps - p.bps AS change,
          CASE WHEN p.bps > 0 THEN (c.bps - p.bps) / p.bps * 100 ELSE 0 END AS change_pct
        FROM curr c
        INNER JOIN prev p ON c.team = p.team
        WHERE p.bps > 0 AND c.bps < p.bps * 0.95
        ORDER BY change ASC
      `, [period, priorPeriod]);
      bpsCompression = bpsRes.rows;
    }

    const toNum = (v: unknown) => Number(v) || 0;

    return NextResponse.json({
      period,
      summary: {
        zeroBpsCount: zeroBpsRes.rows.length,
        zeroBpsTotalAUM: zeroBpsRes.rows.reduce((s, r) => s + toNum(r.account_value), 0),
        cashShortfallCount: cashRes.rows.length,
        cashShortfallTotal: cashRes.rows.reduce((s, r) => s + toNum(r.cash_difference), 0),
        shrinkingCount: shrinking.length,
        warningsCount: warningsRes.rows.length,
        bpsCompressionCount: bpsCompression.length,
      },
      zeroBps: zeroBpsRes.rows.map((r) => ({
        team: r.team, relationship: r.relationship, accountName: r.account_name,
        accountNumber: r.account_number, accountValue: toNum(r.account_value), custodian: r.custodian,
      })),
      cashShortfall: cashRes.rows.map((r) => ({
        team: r.team, relationship: r.relationship, accountName: r.account_name,
        accountNumber: r.account_number, accountValue: toNum(r.account_value),
        cashAvailable: toNum(r.cash_available), cashDifference: toNum(r.cash_difference),
      })),
      shrinking: shrinking.map((r) => ({
        team: r.team, relationship: r.relationship, currentAum: toNum(r.current_aum),
        priorAum: toNum(r.prior_aum), change: toNum(r.change), changePct: toNum(r.change_pct),
      })),
      warnings: warningsRes.rows.map((r) => ({
        team: r.team, relationship: r.relationship, accountName: r.account_name,
        accountNumber: r.account_number, warnings: r.warnings, accountValue: toNum(r.account_value),
      })),
      bpsCompression: bpsCompression.map((r) => ({
        team: r.team, currentBps: toNum(r.current_bps), priorBps: toNum(r.prior_bps),
        change: toNum(r.change), changePct: toNum(r.change_pct),
      })),
    });
  } catch (err) {
    console.error('Billing alerts error:', err);
    return NextResponse.json({ error: 'Failed to load billing alerts' }, { status: 500 });
  }
}
