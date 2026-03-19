import { NextRequest, NextResponse } from 'next/server';

const HUBSPOT_PAT = process.env.HUBSPOT_PAT!;

const DEAL_PROPS = [
  'dealname', 'transferable_aum', 'aum', 'dealstage', 'desired_start_date',
  'actual_launch_date', 'transition_type', 'onboarder', 'transition_owner',
  'custodian__cloned_', 'current_firm__cloned_', 'client_households',
  'transferable_households', 'firm_type', 'hubspot_owner_id', 'description',
  'advisor_goals', 'advisor_pain_points', 'advisor_top_care_abouts',
  'advisor_go_to_market_strategy',
].join(',');

async function fetchDeal(id: string) {
  const res = await fetch(
    `https://api.hubapi.com/crm/v3/objects/deals/${id}?properties=${DEAL_PROPS}&associations=contacts,notes`,
    { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
  );
  if (!res.ok) throw new Error(`Deal fetch failed: ${res.status}`);
  return res.json();
}

async function fetchNotes(dealId: string) {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/notes/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{
        filters: [{ propertyName: 'associations.deal', operator: 'EQ', value: dealId }],
      }],
      properties: ['hs_note_body', 'hs_timestamp', 'hubspot_owner_id'],
      sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
      limit: 20,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [deal, notes] = await Promise.all([
      fetchDeal(params.id),
      fetchNotes(params.id),
    ]);
    return NextResponse.json({ deal, notes });
  } catch (err) {
    console.error('[deal detail]', err);
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
