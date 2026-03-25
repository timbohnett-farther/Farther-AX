import { NextRequest, NextResponse } from 'next/server';
import { clearPgCache } from '@/lib/pg-cache';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';

// Allowed properties that can be updated from the frontend
const ALLOWED_PROPERTIES = new Set([
  'dealstage',
  'desired_start_date',
  'actual_launch_date',
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    // Filter to only allowed properties
    const properties: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_PROPERTIES.has(key) && value != null) {
        properties[key] = String(value);
      }
    }

    if (Object.keys(properties).length === 0) {
      return NextResponse.json({ error: 'No valid properties to update' }, { status: 400 });
    }

    const res = await fetch(
      `https://api.hubapi.com/crm/v3/objects/deals/${params.id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${HUBSPOT_PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[deal update] HubSpot ${res.status}: ${errBody}`);
      return NextResponse.json(
        { error: `HubSpot error: ${res.status}` },
        { status: res.status }
      );
    }

    // Clear pipeline cache so next fetch gets updated data
    await clearPgCache('pipeline');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[deal update]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
