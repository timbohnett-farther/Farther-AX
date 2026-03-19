import { NextResponse } from 'next/server';

const HUBSPOT_PAT = process.env.HUBSPOT_PAT!;
const PIPELINE_ID = '751770';
const DEAL_PROPERTIES = [
  'dealname', 'transferable_aum', 'aum', 'dealstage', 'desired_start_date',
  'actual_launch_date', 'transition_type', 'onboarder', 'transition_owner',
  'custodian__cloned_', 'current_firm__cloned_', 'client_households',
  'transferable_households', 'firm_type', 'hubspot_owner_id',
  'createdate', 'hs_lastmodifieddate',
];

async function fetchAllDeals() {
  const deals: unknown[] = [];
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filterGroups: [{ filters: [{ propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID }] }],
      properties: DEAL_PROPERTIES,
      sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }],
      limit: 100,
    };
    if (after) body.after = after;

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`HubSpot error: ${res.status}`);
    const data = await res.json();
    deals.push(...data.results);
    after = data.paging?.next?.after;
  } while (after);

  return deals;
}

async function fetchOwners() {
  const res = await fetch('https://api.hubapi.com/crm/v3/owners?limit=100', {
    headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` },
  });
  if (!res.ok) return {};
  const data = await res.json();
  const map: Record<string, string> = {};
  for (const o of data.results) {
    map[o.id] = `${o.firstName} ${o.lastName}`.trim();
  }
  return map;
}

export async function GET() {
  try {
    const [deals, owners] = await Promise.all([fetchAllDeals(), fetchOwners()]);

    const enriched = (deals as Array<{ id: string; properties: Record<string, string | null> }>).map(deal => ({
      id: deal.id,
      ...deal.properties,
      ownerName: owners[deal.properties.hubspot_owner_id ?? ''] ?? null,
    }));

    return NextResponse.json({ deals: enriched, total: enriched.length });
  } catch (err) {
    console.error('[pipeline]', err);
    return NextResponse.json({ error: 'Failed to fetch pipeline' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
