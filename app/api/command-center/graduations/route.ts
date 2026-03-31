import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// ── GET: Return all graduated deal IDs ───────────────────────────────────────
export async function GET() {
  try {
    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS advisor_graduations (
        deal_id TEXT PRIMARY KEY,
        graduated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        graduated_by TEXT
      )
    `);

    const result = await pool.query(
      `SELECT deal_id, graduated_at, graduated_by FROM advisor_graduations ORDER BY graduated_at DESC`
    );

    return NextResponse.json({
      graduations: result.rows,
      dealIds: result.rows.map((r: { deal_id: string }) => r.deal_id),
    });
  } catch (err) {
    console.error('[graduations GET]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
