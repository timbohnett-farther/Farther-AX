import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

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
      const clientsResult = await pool.query('SELECT COUNT(*) as count, MAX(synced_at) as last_sync FROM transition_clients');
      checks.transition_clients = {
        count: parseInt(clientsResult.rows[0]?.count || '0'),
        last_synced: clientsResult.rows[0]?.last_sync?.toISOString() || null,
      };
    } catch (err) {
      checks.transition_clients = { error: err instanceof Error ? err.message : String(err) };
    }

    // Check advisor_tran_aum table
    try {
      const aumResult = await pool.query('SELECT COUNT(*) as count, MAX(last_synced_at) as last_sync FROM advisor_tran_aum');
      checks.advisor_tran_aum = {
        count: parseInt(aumResult.rows[0]?.count || '0'),
        last_synced: aumResult.rows[0]?.last_sync?.toISOString() || null,
      };

      // Get sample data
      const sampleResult = await pool.query('SELECT advisor_name, tran_aum, revenue, record_count FROM advisor_tran_aum LIMIT 5');
      checks.advisor_tran_aum.sample = sampleResult.rows;
    } catch (err) {
      checks.advisor_tran_aum = { error: err instanceof Error ? err.message : String(err) };
    }

    // Check environment variables
    checks.env_vars = {
      google_service_account: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      google_drive_folder: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      hubspot_token: !!process.env.HUBSPOT_ACCESS_TOKEN || !!process.env.HUBSPOT_PAT,
      database_url: !!process.env.DATABASE_URL,
    };

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
