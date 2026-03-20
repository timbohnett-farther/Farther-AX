import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// GET — fetch drive link for a deal
export async function GET(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get('dealId');
  if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 });

  const result = await pool.query(
    'SELECT * FROM advisor_drive_links WHERE deal_id = $1',
    [dealId]
  );

  return NextResponse.json({ link: result.rows[0] ?? null });
}

// POST — save or update drive link for a deal
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { dealId, folderUrl, folderName } = await req.json();
  if (!dealId || !folderUrl) {
    return NextResponse.json({ error: 'dealId and folderUrl required' }, { status: 400 });
  }

  const result = await pool.query(
    `INSERT INTO advisor_drive_links (deal_id, folder_url, folder_name, updated_by, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (deal_id)
     DO UPDATE SET folder_url = $2, folder_name = $3, updated_by = $4, updated_at = NOW()
     RETURNING *`,
    [dealId, folderUrl, folderName || 'Advisor Folder', session.user?.email || '']
  );

  return NextResponse.json({ link: result.rows[0] });
}

// DELETE — remove drive link
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dealId = req.nextUrl.searchParams.get('dealId');
  if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 });

  await pool.query('DELETE FROM advisor_drive_links WHERE deal_id = $1', [dealId]);
  return NextResponse.json({ success: true });
}

export const dynamic = 'force-dynamic';
