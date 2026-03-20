import { NextRequest, NextResponse } from 'next/server';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const TEAMS_OBJECT_TYPE = '2-43222882';

const DEAL_PROPS = [
  'dealname', 'dealstage', 'hubspot_owner_id', 'createdate', 'hs_lastmodifieddate',
  'aum', 'transferable_aum', 'transferable_aum__', 't12_revenue', 'fee_based_revenue',
  'expected_revenue', 'insurance_annuity_revenue', 'broker_dealer_revenue',
  'n401k_aum', 'n401k_revenue', 'book_assets', 'book_acquired___inherited__',
  'initial_aum', 'initial_aum_date', 'new_aum_projected_amount', 'average_household_assets',
  'client_households', 'transferable_households',
  'transition_type', 'transition_owner', 'transition_notes', 'prior_transitions', 'prior_transitions_notes',
  'desired_start_date', 'actual_launch_date', 'closedate',
  'current_firm__cloned_', 'custodian__cloned_', 'onboarding_custodian__select_all_that_apply_',
  'firm_type', 'ibd',
  'advisor', 'advisor_goals', 'advisor_top_care_abouts', 'advisor_pain_points',
  'advisor_go_to_market_strategy', 'advisor_debt',
  'crm_platform__cloned_', 'financial_planning_platform__cloned_', 'performance_platform__cloned_',
  'technology_platforms_being_used__cloned_',
  'advisor_recruiting_lead_source', 'referred_by__cloned_',
  'onboarder', 'people', 'description',
].join(',');

const TEAM_PROPS = [
  'team_name', 'aum', 'transferable_aum', 'transferable_aum__', 't12_revenue',
  'fee_based_revenue', 'broker_dealer_revenue', 'insurance_annuity_revenue', 'n401k_revenue',
  'average_fee_rate', 'average_household_assets', 'average_aum_growth', 'average_revenue_growth',
  'client_households', 'client_accounts', 'transferable_households', 'people', 'support_staff',
  'total_number_of_owners_or_partners', 'largest_client_assets',
  'crm_platform', 'financial_planning_platform', 'performance_platform',
  'technology_platforms_being_used', 'additional_tech_stack_notes', 'tamp', 'investment_products',
  'custodian', 'transition_type', 'firm_type', 'region', 'market',
  'annualized_expenses', 'annualized_income', 'payout_rate', 'effective_payout_rate',
  'marketing_expense', 'office_expense', 'advisor_debt', 'billing_cycle',
  'book_acquired___inherited__', 'book_organically_generated__',
  'obas__yes_no', 'outside_business_activities', 'oba_approval',
  'employment_contract', 'restrictive_covenants',
  'prior_transitions', 'prior_transitions_notes',
  'advisor_go_to_market_strategy', 'farther_focus_area_s',
  'ibd', 'n401k_aum', 'transferable_401k_aum',
  'n1yrago_aum', 'n1yrago_revenue', 'n2yrago_aum', 'n2yrago_revenue',
  'ye_aum', 'ye_revenue', 'book_assets', 'alternative_assets__',
].join(',');

const CONTACT_PROPS = [
  'firstname', 'lastname', 'email', 'phone', 'mobilephone',
  'city', 'state', 'zip', 'company',
  'hs_linkedin_url', 'linkedin_url',
  'assets', 'client_type', 'advisor_current_aum',
  'notes_last_contacted', 'notes_last_updated',
  'num_notes', 'num_contacted_notes',
  'hs_pinned_engagement_id',
  'hs_object_id',
].join(',');

// ── Fetch deal ────────────────────────────────────────────────────────────────
async function fetchDeal(id: string) {
  const res = await fetch(
    `https://api.hubapi.com/crm/v3/objects/deals/${id}?properties=${DEAL_PROPS}&associations=contacts,notes`,
    { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
  );
  if (!res.ok) throw new Error(`Deal fetch failed: ${res.status}`);
  return res.json();
}

// ── Fetch notes associated with deal ──────────────────────────────────────────
async function fetchNotes(dealId: string) {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/notes/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'associations.deal', operator: 'EQ', value: dealId }] }],
      properties: ['hs_note_body', 'hs_timestamp', 'hubspot_owner_id'],
      sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
      limit: 20,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

// ── Fetch teams custom object ─────────────────────────────────────────────────
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
  return { id: teamData.id, ...teamData.properties };
}

// ── Fetch associated contact + pinned note ────────────────────────────────────
async function fetchAssociatedContact(dealId: string) {
  // Step 1: Get contact IDs associated with this deal
  const assocRes = await fetch(
    `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/contacts`,
    { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
  );
  if (!assocRes.ok) return { contact: null, pinnedNote: null, allContacts: [] };
  const assocData = await assocRes.json();
  const contactAssocs = assocData.results ?? [];
  if (contactAssocs.length === 0) return { contact: null, pinnedNote: null, allContacts: [] };

  // Step 2: Fetch primary contact properties
  const primaryContactId = contactAssocs[0].toObjectId;
  const contactRes = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts/${primaryContactId}?properties=${CONTACT_PROPS}`,
    { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
  );
  if (!contactRes.ok) return { contact: null, pinnedNote: null, allContacts: [] };
  const contactData = await contactRes.json();
  const contact = { id: contactData.id, ...contactData.properties };

  // Step 3: Fetch pinned note if exists
  let pinnedNote = null;
  const pinnedId = contact.hs_pinned_engagement_id;
  if (pinnedId) {
    const noteRes = await fetch(
      `https://api.hubapi.com/crm/v3/objects/notes/${pinnedId}?properties=hs_note_body,hs_timestamp,hubspot_owner_id,hs_attachment_ids`,
      { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
    );
    if (noteRes.ok) {
      const noteData = await noteRes.json();
      pinnedNote = {
        id: noteData.id,
        body: noteData.properties?.hs_note_body ?? '',
        timestamp: noteData.properties?.hs_timestamp ?? null,
        ownerId: noteData.properties?.hubspot_owner_id ?? null,
      };
    }
  }

  // Step 4: Fetch additional associated contacts (for Team & Contacts tab)
  const allContacts = [];
  for (const assoc of contactAssocs) {
    if (assoc.toObjectId === primaryContactId) {
      allContacts.push(contact);
      continue;
    }
    try {
      const otherRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${assoc.toObjectId}?properties=firstname,lastname,email,phone,company,city,state`,
        { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
      );
      if (otherRes.ok) {
        const otherData = await otherRes.json();
        allContacts.push({ id: otherData.id, ...otherData.properties });
      }
    } catch {
      // Skip failed contact fetches
    }
  }

  return { contact, pinnedNote, allContacts };
}

// ── Fetch engagements for contact ─────────────────────────────────────────────
async function fetchEngagements(contactId: string) {
  const engagementTypes = [
    { type: 'emails', props: 'hs_email_subject,hs_email_direction,hs_email_status,hs_timestamp,hs_email_text' },
    { type: 'calls', props: 'hs_call_title,hs_call_direction,hs_call_status,hs_call_duration,hs_timestamp,hs_call_body' },
    { type: 'meetings', props: 'hs_meeting_title,hs_meeting_outcome,hs_timestamp,hs_meeting_start_time,hs_meeting_end_time,hs_meeting_body' },
  ];

  const results: { type: string; id: string; timestamp: string; properties: Record<string, string> }[] = [];

  await Promise.all(engagementTypes.map(async ({ type, props }) => {
    try {
      const res = await fetch(`https://api.hubapi.com/crm/v3/objects/${type}/search`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filterGroups: [{ filters: [{ propertyName: 'associations.contact', operator: 'EQ', value: contactId }] }],
          properties: props.split(','),
          sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
          limit: 10,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        for (const item of (data.results ?? [])) {
          results.push({
            type: type.replace(/s$/, ''), // emails→email, calls→call, meetings→meeting
            id: item.id,
            timestamp: item.properties?.hs_timestamp ?? '',
            properties: item.properties ?? {},
          });
        }
      }
    } catch {
      // Silent — engagement fetch is supplementary
    }
  }));

  // Sort all engagements by timestamp descending
  results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return results.slice(0, 20);
}

// ── Main GET handler ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Fetch deal + existing data in parallel
    const [deal, notes, team] = await Promise.all([
      fetchDeal(params.id),
      fetchNotes(params.id),
      fetchTeamsRecord(params.id),
    ]);

    // Get associated contacts from deal
    const { contact, pinnedNote, allContacts } = await fetchAssociatedContact(params.id);

    // Fetch engagements if we have a contact
    let engagements: Awaited<ReturnType<typeof fetchEngagements>> = [];
    if (contact?.hs_object_id) {
      engagements = await fetchEngagements(contact.hs_object_id);
    }

    return NextResponse.json({
      deal,
      notes,
      team,
      contact,
      pinnedNote,
      allContacts,
      engagements,
    });
  } catch (err) {
    console.error('[advisor detail]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
