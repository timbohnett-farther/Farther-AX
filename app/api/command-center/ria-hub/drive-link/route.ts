import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — fetch drive link for a deal
export async function GET(req: NextRequest) {
  try {
    const dealId = req.nextUrl.searchParams.get('dealId');
    if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 });

    const result = await prisma.$queryRaw<Array<{
      deal_id: string;
      folder_url: string;
      folder_name: string;
      updated_by: string;
      updated_at: Date;
    }>>`
      SELECT * FROM advisor_drive_links WHERE deal_id = ${dealId}
    `;

    return NextResponse.json({ link: result[0] ?? null });
  } catch (err) {
    console.error('[drive-link GET]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST — save or update drive link for a deal
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dealId, folderUrl, folderName } = await req.json();
    if (!dealId || !folderUrl) {
      return NextResponse.json({ error: 'dealId and folderUrl required' }, { status: 400 });
    }

    const result = await prisma.$queryRaw<Array<{
      deal_id: string;
      folder_url: string;
      folder_name: string;
      updated_by: string;
      updated_at: Date;
    }>>`
      INSERT INTO advisor_drive_links (deal_id, folder_url, folder_name, updated_by, updated_at)
      VALUES (${dealId}, ${folderUrl}, ${folderName || 'Advisor Folder'}, ${session.user?.email || ''}, NOW())
      ON CONFLICT (deal_id)
      DO UPDATE SET folder_url = ${folderUrl}, folder_name = ${folderName || 'Advisor Folder'}, updated_by = ${session.user?.email || ''}, updated_at = NOW()
      RETURNING *
    `;

    return NextResponse.json({ link: result[0] });
  } catch (err) {
    console.error('[drive-link POST]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — remove drive link
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dealId = req.nextUrl.searchParams.get('dealId');
    if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 });

    await prisma.$executeRaw`DELETE FROM advisor_drive_links WHERE deal_id = ${dealId}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[drive-link DELETE]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
