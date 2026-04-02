import { syncSingleWorkbook } from '@/lib/transitions-sync';
import { NextResponse } from 'next/server';

/**
 * POST /api/sync/transitions/single
 *
 * Sync a single transition workbook from Google Sheets to database.
 * Used for on-demand refresh when viewing a specific workbook.
 *
 * Body: { sheet_id: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sheet_id } = body;

    if (!sheet_id) {
      return NextResponse.json(
        { error: 'sheet_id required' },
        { status: 400 }
      );
    }

    console.log(`[Transitions Sync API] Syncing single workbook: ${sheet_id}`);

    // Sync workbook
    const result = await syncSingleWorkbook(sheet_id);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error('[Transitions Sync API] Single workbook sync failed:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
