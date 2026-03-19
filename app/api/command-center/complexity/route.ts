import { NextResponse } from 'next/server';
import { computeComplexityScore } from '@/lib/complexity-score';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const TEAMS_OBJECT_TYPE = '2-43222882';

const DEAL_PROPS = [
  'dealname', 'dealstage', 'createdate', 'hs_lastmodifieddate',
  'transferable_aum', 'aum', 'client_households', 'transferable_households',
  'transition_type', 'transition_notes', 'prior_transitions', 'prior_transitions_notes',
  'firm_type', 'n401k_aum', 'insurance_annuity_revenue', 'broker_dealer_revenue',
  'crm_platform__cloned_', 'financial_planning_platform__cloned_',
  'performance_platform__cloned_', 'technology_platforms_being_used__cloned_',
  'people', 'description',
].join(',');

const TEAM_PROPS = [
  'transferable_aum', 'n401k_aum', 'transferable_401k_aum',
  'insurance_annuity_revenue', 'broker_dealer_revenue',
  'client_households', 'transferable_households',
  'people', 'support_staff', 'total_number_of_owners_or_partners',
  'crm_platform', 'financial_planning_platform', 'performance_platform',
  'technology_platforms_being_used', 'tamp', 'investment_products',
  'alternative_assets__', 'firm_type', 'transition_type',
  'obas__yes_no', 'outside_business_activities',
  'restrictive_covenants',
].join(',');

async function fetchDeal(id: string) {
  const res = await fetch(
    `https://api.hubapi.com/crm/v3/objects/deals/${id}?properties=${DEAL_PROPS}`,
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
      filterGroups: [{ filters: [{ propertyName: 'associations.deal', operator: 'EQ', value: dealId }] }],
      properties: ['hs_note_body'],
      sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
      limit: 20,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

async function fetchTeamsRecord(dealId: string) {
  const res = await fetch(
    `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/${TEAMS_OBJECT_TYPE}`,
    { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const results = data.results ?? [];
  if (results.length === 0) return null;
  const teamId = results[0].toObjectId;
  const teamRes = await fetch(
    `https://api.hubapi.com/crm/v3/objects/${TEAMS_OBJECT_TYPE}/${teamId}?properties=${TEAM_PROPS}`,
    { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
  );
  if (!teamRes.ok) return null;
  const teamData = await teamRes.json();
  return teamData.properties ?? null;
}

// ── GET: Compute complexity for a single deal ────────────────────────────────
// Usage: GET /api/command-center/complexity?dealId=123
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');

    if (!dealId) {
      return NextResponse.json({ error: 'dealId query param is required' }, { status: 400 });
    }

    const [dealData, notes, team] = await Promise.all([
      fetchDeal(dealId),
      fetchNotes(dealId),
      fetchTeamsRecord(dealId),
    ]);

    const result = computeComplexityScore(dealData.properties, team, notes);

    return NextResponse.json({
      dealId,
      dealName: dealData.properties?.dealname ?? 'Unknown',
      ...result,
    });
  } catch (err) {
    console.error('[complexity]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
