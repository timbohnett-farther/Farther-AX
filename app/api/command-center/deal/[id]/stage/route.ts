import { NextRequest, NextResponse } from 'next/server';
import { clearPgCache } from '@/lib/pg-cache';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { dealstage } = await req.json();
    if (!dealstage) {
      return NextResponse.json({ error: 'Missing dealstage' }, { status: 400 });
    }

    const res = await fetch(
      `https://api.hubapi.com/crm/v3/objects/deals/${params.id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${HUBSPOT_PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties: { dealstage } }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[deal stage] HubSpot ${res.status}: ${errBody}`);
      return NextResponse.json(
        { error: `HubSpot error: ${res.status}` },
        { status: res.status }
      );
    }

    // Clear pipeline cache so next fetch gets updated stage
    await clearPgCache('pipeline');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[deal stage]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
