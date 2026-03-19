import { NextResponse } from 'next/server';

// Support both env var names so Railway config doesn't need to change
const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const PIPELINE_ID = '751770';

const DEAL_PROPERTIES = [
  // Identity
  'dealname', 'dealstage', 'pipeline', 'hubspot_owner_id', 'createdate', 'hs_lastmodifieddate',
  // AUM & Revenue
  'aum', 'transferable_aum', 'transferable_aum__', 't12_revenue', 'fee_based_revenue',
  'projected_revenue', 'expected_revenue', 'insurance_annuity_revenue', 'broker_dealer_revenue',
  'n401k_aum', 'n401k_revenue', 'book_assets', 'book_acquired___inherited__',
  'initial_aum', 'initial_aum_date', 'new_aum_projected_amount',
  'average_household_assets',
  // Clients
  'client_households', 'transferable_households', 'of_client_households__cloned_',
  // Transition
  'transition_type', 'transition_owner', 'transition_notes', 'prior_transitions', 'prior_transitions_notes',
  // Dates
  'desired_start_date', 'actual_launch_date', 'closedate',
  // Firm
  'current_firm__cloned_', 'custodian__cloned_', 'onboarding_custodian__select_all_that_apply_',
  'firm_type', 'ibd',
  // Advisor intel
  'advisor', 'advisor_goals', 'advisor_top_care_abouts', 'advisor_pain_points',
  'advisor_go_to_market_strategy', 'advisor_debt',
  // Tech stack
  'crm_platform__cloned_', 'financial_planning_platform__cloned_', 'performance_platform__cloned_',
  'technology_platforms_being_used__cloned_',
  // Recruiting
  'advisor_recruiting_lead_source', 'referred_by__cloned_',
  'onboarder',
  // Staff
  'people',
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
      headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`HubSpot ${res.status}: ${errBody}`);
    }
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
  for (const o of data.results) map[o.id] = `${o.firstName} ${o.lastName}`.trim();
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
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
