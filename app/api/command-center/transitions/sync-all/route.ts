import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const SYNC_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

async function shouldSkip(): Promise<boolean> {
  try {
    const result = await pool.query<{ expires_at: Date }>(
      `SELECT expires_at FROM api_cache WHERE cache_key = 'transitions-sync-all-last-run'`
    );
    if (result.rows[0] && result.rows[0].expires_at > new Date()) return true;
  } catch (err) { console.warn('[sync-all] Cache check failed, proceeding:', err instanceof Error ? err.message : String(err)); }
  return false;
}

async function markRun(): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SYNC_COOLDOWN_MS);
  await pool.query(
    `INSERT INTO api_cache (cache_key, data, expires_at, created_at, updated_at)
     VALUES ('transitions-sync-all-last-run', '"ok"', $1, $2, $2)
     ON CONFLICT (cache_key) DO UPDATE
       SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at, updated_at = EXCLUDED.updated_at`,
    [expiresAt, now]
  );
}

export async function GET() {
  try {
    if (await shouldSkip()) {
      return NextResponse.json({ status: 'skipped', reason: 'synced within last hour' });
    }

    const results: Record<string, unknown> = {};

    // 1. Google Sheets sync
    try {
      const baseUrl = process.env.NEXTAUTH_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'http://localhost:3000');
      const sheetsRes = await fetch(`${baseUrl}/api/command-center/transitions/sync`);
      results.sheets = await sheetsRes.json();
    } catch (err) {
      results.sheets = { error: String(err) };
    }

    // 2. DocuSign sync (if docusign-sync lib exists and token is available)
    try {
      const { runFullSync } = await import('@/lib/docusign-sync');
      results.docusign = await runFullSync();
    } catch (err) {
      results.docusign = { error: String(err) };
    }

    // 3. Change detection
    try {
      const { detectChanges } = await import('@/lib/change-detection');
      const changes = await detectChanges();
      results.changes = { count: changes.length };
    } catch (err) {
      results.changes = { error: String(err) };
    }

    await markRun();

    return NextResponse.json({
      status: 'complete',
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (err) {
    console.error('[transitions/sync-all]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
