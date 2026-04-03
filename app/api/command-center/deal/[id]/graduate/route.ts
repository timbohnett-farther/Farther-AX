import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Ensure table exists on first call
let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS advisor_graduations (
      deal_id TEXT PRIMARY KEY,
      graduated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      graduated_by TEXT
    )
  `;
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

    const result = await prisma.$queryRaw<Array<{
      deal_id: string;
      graduated_at: Date;
      graduated_by: string | null;
    }>>`
      INSERT INTO advisor_graduations (deal_id, graduated_by)
      VALUES (${dealId}, ${graduatedBy})
      ON CONFLICT (deal_id)
      DO UPDATE SET graduated_at = NOW(), graduated_by = ${graduatedBy}
      RETURNING *
    `;

    return NextResponse.json({ graduation: result[0] }, { status: 201 });
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

    const result = await prisma.$queryRaw<Array<{
      deal_id: string;
      graduated_at: Date;
      graduated_by: string | null;
    }>>`
      DELETE FROM advisor_graduations WHERE deal_id = ${dealId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Graduation not found' }, { status: 404 });
    }

    return NextResponse.json({ deleted: result[0] });
  } catch (err) {
    console.error('[graduate DELETE]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
