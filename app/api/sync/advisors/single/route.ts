import { syncSingleAdvisor, syncAdvisorActivities } from '@/lib/advisor-sync';
import { NextResponse } from 'next/server';

/**
 * POST /api/sync/advisors/single
 *
 * Sync a single advisor and their activities from HubSpot to database.
 * Used for on-demand refresh when viewing an advisor's profile.
 *
 * Body: { hubspot_id: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hubspot_id } = body;

    if (!hubspot_id) {
      return NextResponse.json(
        { error: 'hubspot_id required' },
        { status: 400 }
      );
    }

    console.log(`[Sync API] Syncing single advisor: ${hubspot_id}`);

    // Sync advisor profile
    await syncSingleAdvisor(hubspot_id);

    // Sync activities
    await syncAdvisorActivities(hubspot_id);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      hubspot_id,
    });
  } catch (error) {
    console.error('[Sync API] Single advisor sync failed:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
