import { syncAllAdvisors } from '@/lib/advisor-sync';
import { NextResponse } from 'next/server';

/**
 * POST /api/sync/advisors
 *
 * Trigger a full sync of all advisors from HubSpot to database.
 * This endpoint should be called by a cron job daily at 3 AM.
 *
 * Authentication: Bearer token (CRON_SECRET)
 */
export async function POST(request: Request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error('[Sync API] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedAuth) {
      console.warn('[Sync API] Unauthorized sync attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Sync API] Starting sync...');

    // Run the sync
    const result = await syncAllAdvisors();

    return NextResponse.json({
      ...result,
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Sync API] Sync failed:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/advisors
 *
 * Get status of most recent sync jobs
 */
export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma');

    const recentJobs = await prisma.syncJob.findMany({
      orderBy: { started_at: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      jobs: recentJobs,
    });
  } catch (error) {
    console.error('[Sync API] Failed to fetch sync jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync jobs' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
