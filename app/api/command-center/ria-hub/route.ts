import { NextResponse } from 'next/server';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const PIPELINE_ID = '751770';
const TEAMS_OBJECT_TYPE = '2-43222882';

const ONBOARDING_STAGE_IDS = ['2496936', '100411705'];

const STAGE_LABELS: Record<string, string> = {
  '2496931': 'Step 1 – First Meeting',
  '2496932': 'Step 2 – Financial Model',
  '2496934': 'Step 3 – Advisor Demo',
  '100409509': 'Step 4 – Discovery Day',
  '2496935': 'Step 5 – Offer Review',
  '2496936': 'Step 6 – Offer Accepted',
  '100411705': 'Step 7 – Launched',
  '31214941': 'Holding Pattern',
  '2496937': 'Prospect Passed',
  '26572965': 'Farther Passed',
};

const DEAL_PROPS = [
  'dealname', 'dealstage', 'hubspot_owner_id', 'createdate', 'hs_lastmodifieddate',
  'aum', 'transferable_aum', 't12_revenue', 'fee_based_revenue', 'expected_revenue',
  'client_households', 'transferable_households', 'average_household_assets',
  'transition_type', 'desired_start_date', 'actual_launch_date',
  'current_firm__cloned_', 'custodian__cloned_', 'firm_type', 'ibd',
  'advisor_pain_points', 'advisor_top_care_abouts', 'advisor_goals',
  'advisor_go_to_market_strategy', 'advisor_debt',
  'crm_platform__cloned_', 'financial_planning_platform__cloned_',
  'performance_platform__cloned_', 'technology_platforms_being_used__cloned_',
  'onboarder', 'transition_owner', 'people', 'description',
  'advisor_recruiting_lead_source', 'referred_by__cloned_',
];

const CONTACT_PROPS = [
  'firstname', 'lastname', 'email', 'phone', 'mobilephone',
  'jobtitle', 'company', 'hs_lead_status',
  'industry', 'years_in_industry', 'licenses',
  'city', 'state', 'address',
  'notes_last_updated', 'hs_content_membership_notes',
  'num_associated_deals',
];

const TEAM_PROPS = [
  'team_name', 'aum', 'transferable_aum', 't12_revenue',
  'client_households', 'transferable_households', 'people', 'support_staff',
  'crm_platform', 'financial_planning_platform', 'performance_platform',
  'technology_platforms_being_used', 'tamp', 'investment_products',
  'custodian', 'transition_type', 'firm_type', 'region', 'market',
  'payout_rate', 'effective_payout_rate',
  'obas__yes_no', 'outside_business_activities',
  'employment_contract', 'restrictive_covenants',
  'prior_transitions', 'prior_transitions_notes',
];

interface HubSpotContact {
  id: string;
  properties: Record<string, string | null>;
}

interface HubSpotNote {
  id: string;
  properties: {
    hs_note_body: string | null;
    hs_timestamp: string | null;
    hubspot_owner_id: string | null;
  };
}

interface HubSpotEngagement {
  id: string;
  properties: Record<string, string | null>;
}

async function fetchOnboardingDeals() {
  const allDeals: Array<{ id: string; properties: Record<string, string | null> }> = [];
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filterGroups: [{
        filters: [
          { propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID },
          { propertyName: 'dealstage', operator: 'IN', values: ONBOARDING_STAGE_IDS },
        ],
      }],
      properties: DEAL_PROPS,
      sorts: [{ propertyName: 'dealname', direction: 'ASCENDING' }],
      limit: 100,
    };
    if (after) (body as Record<string, unknown>).after = after;

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) break;
    const data = await res.json();
    allDeals.push(...(data.results ?? []));
    after = data.paging?.next?.after;
  } while (after);

  return allDeals;
}

async function fetchContactsForDeal(dealId: string): Promise<HubSpotContact[]> {
  // Get associated contact IDs
  const assocRes = await fetch(
    `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/contacts`,
    { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
  );
  if (!assocRes.ok) return [];
  const assocData = await assocRes.json();
  const contactIds: string[] = (assocData.results ?? []).map((r: { toObjectId: string }) => String(r.toObjectId));
  if (contactIds.length === 0) return [];

  // Batch read contacts
  const batchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/batch/read', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs: contactIds.map(id => ({ id })),
      properties: CONTACT_PROPS,
    }),
  });
  if (!batchRes.ok) return [];
  const batchData = await batchRes.json();
  return batchData.results ?? [];
}

async function fetchNotesForDeal(dealId: string): Promise<HubSpotNote[]> {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/notes/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'associations.deal', operator: 'EQ', value: dealId }] }],
      properties: ['hs_note_body', 'hs_timestamp', 'hubspot_owner_id'],
      sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
      limit: 30,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

async function fetchCallsForDeal(dealId: string): Promise<HubSpotEngagement[]> {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/calls/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'associations.deal', operator: 'EQ', value: dealId }] }],
      properties: ['hs_call_title', 'hs_call_body', 'hs_call_status', 'hs_timestamp', 'hs_call_duration', 'hs_call_recording_url'],
      sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
      limit: 10,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

async function fetchEmailsForDeal(dealId: string): Promise<HubSpotEngagement[]> {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/emails/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'associations.deal', operator: 'EQ', value: dealId }] }],
      properties: ['hs_email_subject', 'hs_email_text', 'hs_email_status', 'hs_timestamp', 'hs_email_direction'],
      sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
      limit: 10,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

async function fetchTeamRecord(dealId: string) {
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
    `https://api.hubapi.com/crm/v3/objects/${TEAMS_OBJECT_TYPE}/${teamId}?properties=${TEAM_PROPS.join(',')}`,
    { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
  );
  if (!teamRes.ok) return null;
  const teamData = await teamRes.json();
  return { id: teamData.id, ...teamData.properties };
}

export async function GET() {
  try {
    const deals = await fetchOnboardingDeals();

    // Enrich each deal with contacts, notes, calls, emails, and team record
    const enrichedDeals = await Promise.all(
      deals.map(async (deal) => {
        const [contacts, notes, calls, emails, team] = await Promise.all([
          fetchContactsForDeal(deal.id),
          fetchNotesForDeal(deal.id),
          fetchCallsForDeal(deal.id),
          fetchEmailsForDeal(deal.id),
          fetchTeamRecord(deal.id),
        ]);

        return {
          id: deal.id,
          properties: deal.properties,
          stageLabel: STAGE_LABELS[deal.properties.dealstage ?? ''] ?? deal.properties.dealstage,
          contacts: contacts.map((c: HubSpotContact) => ({
            id: c.id,
            firstName: c.properties.firstname,
            lastName: c.properties.lastname,
            email: c.properties.email,
            phone: c.properties.phone || c.properties.mobilephone,
            jobTitle: c.properties.jobtitle,
            company: c.properties.company,
            city: c.properties.city,
            state: c.properties.state,
            yearsInIndustry: c.properties.years_in_industry,
            licenses: c.properties.licenses,
          })),
          notes: notes.map((n: HubSpotNote) => ({
            id: n.id,
            body: n.properties.hs_note_body?.replace(/<[^>]+>/g, '') ?? '',
            timestamp: n.properties.hs_timestamp,
          })),
          calls: calls.map((c: HubSpotEngagement) => ({
            id: c.id,
            title: c.properties.hs_call_title,
            body: c.properties.hs_call_body?.replace(/<[^>]+>/g, '') ?? '',
            status: c.properties.hs_call_status,
            timestamp: c.properties.hs_timestamp,
            duration: c.properties.hs_call_duration,
            recordingUrl: c.properties.hs_call_recording_url,
          })),
          emails: emails.map((e: HubSpotEngagement) => ({
            id: e.id,
            subject: e.properties.hs_email_subject,
            body: e.properties.hs_email_text?.replace(/<[^>]+>/g, '').slice(0, 300) ?? '',
            direction: e.properties.hs_email_direction,
            timestamp: e.properties.hs_timestamp,
          })),
          team,
        };
      })
    );

    return NextResponse.json({ deals: enrichedDeals });
  } catch (err) {
    console.error('[ria-hub]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
