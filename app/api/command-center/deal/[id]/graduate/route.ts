import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Ensure table exists on first call
let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS advisor_graduations (
      deal_id TEXT PRIMARY KEY,
      graduated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      graduated_by TEXT
    )
  `);
  tableReady = true;
}

// ── POST: Graduate a deal early ──────────────────────────────────────────────
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTable();
    const dealId = params.id;
    if (!dealId) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const graduatedBy = body.graduated_by || null;

    const result = await pool.query(
      `INSERT INTO advisor_graduations (deal_id, graduated_by)
       VALUES ($1, $2)
       ON CONFLICT (deal_id)
       DO UPDATE SET graduated_at = NOW(), graduated_by = $2
       RETURNING *`,
      [dealId, graduatedBy]
    );

    return NextResponse.json({ graduation: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[graduate POST]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── DELETE: Un-graduate a deal ───────────────────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTable();
    const dealId = params.id;
    if (!dealId) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    const result = await pool.query(
      `DELETE FROM advisor_graduations WHERE deal_id = $1 RETURNING *`,
      [dealId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Graduation not found' }, { status: 404 });
    }

    return NextResponse.json({ deleted: result.rows[0] });
  } catch (err) {
    console.error('[graduate DELETE]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
