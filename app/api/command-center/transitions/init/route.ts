import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

/**
 * POST /api/command-center/transitions/init
 * Initialize/refresh all transitions data systems
 * - TRAN AUM from HubSpot
 * - Google Sheets sync
 * - Team mappings
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    console.log('[transitions/init] Starting comprehensive data sync...');
    const results: Record<string, any> = {};
    const errors: string[] = [];

    // 1. Sync TRAN AUM from HubSpot
    try {
      console.log('[transitions/init] Step 1: Syncing TRAN AUM from HubSpot...');
      const tranAumRes = await fetch(`${req.nextUrl.origin}/api/command-center/transitions/tran-aum`, {
        method: 'POST',
        headers: {
          cookie: req.headers.get('cookie') || '',
        },
      });

      if (tranAumRes.ok) {
        const tranAumData = await tranAumRes.json();
        results.tran_aum = {
          success: true,
          ...tranAumData,
        };
        console.log(`[transitions/init] ✓ TRAN AUM synced: ${tranAumData.totalAdvisors} advisors`);
      } else {
        const errorText = await tranAumRes.text();
        errors.push(`TRAN AUM sync failed: ${errorText}`);
        results.tran_aum = { success: false, error: errorText };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`TRAN AUM sync error: ${msg}`);
      results.tran_aum = { success: false, error: msg };
    }

    // 2. Sync Google Sheets
    try {
      console.log('[transitions/init] Step 2: Syncing Google Sheets...');
      const sheetsRes = await fetch(`${req.nextUrl.origin}/api/command-center/transitions/sync`, {
        method: 'POST',
        headers: {
          cookie: req.headers.get('cookie') || '',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ background: false }),
      });

      if (sheetsRes.ok) {
        const sheetsData = await sheetsRes.json();
        results.google_sheets = {
          success: true,
          ...sheetsData,
        };
        console.log(`[transitions/init] ✓ Google Sheets synced: ${sheetsData.totalRecordsInserted} records`);
      } else {
        const errorText = await sheetsRes.text();
        errors.push(`Google Sheets sync failed: ${errorText}`);
        results.google_sheets = { success: false, error: errorText };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Google Sheets sync error: ${msg}`);
      results.google_sheets = { success: false, error: msg };
    }

    // 3. Sync Team Mappings
    try {
      console.log('[transitions/init] Step 3: Syncing team mappings...');
      const teamRes = await fetch(`${req.nextUrl.origin}/api/command-center/transitions/team-mappings`, {
        method: 'POST',
        headers: {
          cookie: req.headers.get('cookie') || '',
        },
      });

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        results.team_mappings = {
          success: true,
          ...teamData,
        };
        console.log(`[transitions/init] ✓ Team mappings synced: ${teamData.totalMappings} mappings`);
      } else {
        const errorText = await teamRes.text();
        errors.push(`Team mappings sync failed: ${errorText}`);
        results.team_mappings = { success: false, error: errorText };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Team mappings sync error: ${msg}`);
      results.team_mappings = { success: false, error: msg };
    }

    // 4. Check database counts
    try {
      const counts: Record<string, number> = {};

      const clientsResult = await pool.query('SELECT COUNT(*) as count FROM transition_clients');
      counts.transition_clients = parseInt(clientsResult.rows[0]?.count || '0');

      const aumResult = await pool.query('SELECT COUNT(*) as count FROM advisor_tran_aum');
      counts.advisor_tran_aum = parseInt(aumResult.rows[0]?.count || '0');

      const teamResult = await pool.query('SELECT COUNT(*) as count FROM advisor_team_mappings');
      counts.advisor_team_mappings = parseInt(teamResult.rows[0]?.count || '0');

      results.database_counts = counts;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Database count check error: ${msg}`);
    }

    const allSuccess = errors.length === 0;

    return NextResponse.json({
      success: allSuccess,
      timestamp: new Date().toISOString(),
      results,
      errors: errors.length > 0 ? errors : undefined,
      message: allSuccess
        ? 'All systems initialized successfully'
        : `Initialization completed with ${errors.length} error(s)`,
    });
  } catch (err) {
    console.error('[transitions/init]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
