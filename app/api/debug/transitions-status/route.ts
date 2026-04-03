import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to check transitions data status
 * GET /api/debug/transitions-status
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const checks: Record<string, any> = {
      timestamp: new Date().toISOString(),
    };

    // Check transition_clients table
    try {
      const clientsResult = await prisma.$queryRaw<Array<{
        count: bigint;
        last_sync: Date | null;
      }>>`SELECT COUNT(*) as count, MAX(synced_at) as last_sync FROM transition_clients`;
      checks.transition_clients = {
        count: parseInt(clientsResult[0]?.count?.toString() || '0'),
        last_synced: clientsResult[0]?.last_sync?.toISOString() || null,
      };
    } catch (err) {
      checks.transition_clients = { error: err instanceof Error ? err.message : String(err) };
    }

    // Check advisor_tran_aum table
    try {
      const aumResult = await prisma.$queryRaw<Array<{
        count: bigint;
        last_sync: Date | null;
      }>>`SELECT COUNT(*) as count, MAX(last_synced_at) as last_sync FROM advisor_tran_aum`;
      checks.advisor_tran_aum = {
        count: parseInt(aumResult[0]?.count?.toString() || '0'),
        last_synced: aumResult[0]?.last_sync?.toISOString() || null,
      };

    } catch (err) {
      checks.advisor_tran_aum = { error: err instanceof Error ? err.message : String(err) };
    }

    return NextResponse.json(checks, { status: 200 });
  } catch (err) {
    console.error('[debug/transitions-status]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
