import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const result = await prisma.$queryRaw<Array<{
      advisor_name: string;
      total_aum: number;
      total_monthly_revenue: number;
      account_count: number;
      avg_fee_bps: number;
    }>>`
      SELECT advisor_name, total_aum, total_monthly_revenue, account_count,
             weighted_fee_bps as avg_fee_bps
      FROM managed_accounts_summary
    `;

    return NextResponse.json({ accounts: result });
  } catch (err) {
    // Table might not exist yet — return empty
    console.error('[managed-accounts]', err);
    return NextResponse.json({ accounts: [] });
  }
}

export const dynamic = 'force-dynamic';
