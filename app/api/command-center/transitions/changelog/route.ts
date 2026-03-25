import { NextRequest, NextResponse } from 'next/server';
import { getChangelog } from '@/lib/change-detection';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const advisor = searchParams.get('advisor') ?? undefined;
    const changeType = searchParams.get('type') ?? undefined;
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const { changes, total } = await getChangelog({
      advisor,
      changeType,
      limit,
      offset,
    });

    return NextResponse.json({ changes, total });
  } catch (err) {
    console.error('[transitions/changelog]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
