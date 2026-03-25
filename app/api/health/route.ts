import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env_vars: {
      hubspot_token: !!process.env.HUBSPOT_ACCESS_TOKEN,
      google_service_account: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      google_drive_folder: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      database_url: !!process.env.DATABASE_URL,
    },
    database: {
      connected: false,
      transition_clients_count: 0,
      error: null,
    },
  };

  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM transition_clients');
    checks.database.connected = true;
    checks.database.transition_clients_count = parseInt(result.rows[0]?.count || '0');
  } catch (err) {
    checks.database.error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(checks, { status: 200 });
}

export const dynamic = 'force-dynamic';
