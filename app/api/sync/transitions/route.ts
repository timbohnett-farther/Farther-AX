import { syncAllTransitions } from '@/lib/transitions-sync';
import { NextResponse } from 'next/server';

/**
 * POST /api/sync/transitions
 *
 * Trigger a full sync of all transition workbooks from Google Sheets to database.
 * This endpoint should be called by a cron job every 30 minutes.
 *
 * Authentication: Bearer token (CRON_SECRET)
 */
export async function POST(request: Request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error('[Transitions Sync API] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedAuth) {
      console.warn('[Transitions Sync API] Unauthorized sync attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Transitions Sync API] Starting sync...');

    // Run the sync
    const result = await syncAllTransitions();

    // Enhanced response with quality metrics
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      workbooks: result.workbooks.map(wb => ({
        sheetId: wb.sheetId,
        workbookName: wb.workbookName,
        synced: wb.synced,
        failed: wb.failed || 0,
        total: wb.total,
        skipped: wb.skipped || false,
        quality: wb.quality,
      })),
      summary: result.summary,
      alerts: result.alerts,
      docusign: result.docusign,
    });
  } catch (error) {
    console.error('[Transitions Sync API] Sync failed:', error);
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
 * GET /api/sync/transitions
 *
 * Get status of most recent transition sync
 */
export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Get last sync time from transition_workbooks table
    const lastWorkbook = await prisma.transitionWorkbook.findFirst({
      orderBy: { last_synced_at: 'desc' },
      select: {
        last_synced_at: true,
        workbook_name: true,
      },
    });

    // Get total counts
    const [totalClients, totalWorkbooks] = await Promise.all([
      prisma.transitionClient.count(),
      prisma.transitionWorkbook.count(),
    ]);

    return NextResponse.json({
      last_synced_at: lastWorkbook?.last_synced_at?.toISOString() || null,
      last_synced_workbook: lastWorkbook?.workbook_name || null,
      total_clients: totalClients,
      total_workbooks: totalWorkbooks,
    });
  } catch (error) {
    console.error('[Transitions Sync API] Failed to fetch status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}
