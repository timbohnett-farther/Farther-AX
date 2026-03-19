import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';

  const envCheck = {
    HUBSPOT_ACCESS_TOKEN: !!process.env.HUBSPOT_ACCESS_TOKEN,
    HUBSPOT_PAT: !!process.env.HUBSPOT_PAT,
    GROK_API_KEY: !!process.env.GROK_API_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
    tokenLength: token.length,
    tokenPrefix: token.slice(0, 8) || '(empty)',
  };

  if (!token) {
    return NextResponse.json({ ok: false, envCheck, error: 'No HubSpot token found' }, { status: 500 });
  }

  // Quick HubSpot ping
  try {
    const res = await fetch('https://api.hubapi.com/crm/v3/owners?limit=1', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const body = res.ok ? await res.json() : await res.text();
    return NextResponse.json({
      ok: res.ok,
      hubspotStatus: res.status,
      hubspotResponse: res.ok ? `ok (${body?.results?.length ?? 0} results)` : body,
      envCheck,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), envCheck }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
