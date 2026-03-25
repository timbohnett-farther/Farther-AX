import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT advisor_name, total_aum, total_monthly_revenue, account_count, weighted_fee_bps
      FROM managed_accounts_summary
    `);

    return NextResponse.json({ accounts: result.rows });
  } catch (err) {
    // Table might not exist yet — return empty
    console.error('[managed-accounts]', err);
    return NextResponse.json({ accounts: [] });
  }
}

export const dynamic = 'force-dynamic';
