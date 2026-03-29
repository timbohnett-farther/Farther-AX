/**
 * app/api/command-center/warm/route.ts
 *
 * POST /api/command-center/warm
 *
 * Background data warming endpoint. Pre-fetches and caches all pipeline +
 * advisor detail data so subsequent page loads are instant from PostgreSQL.
 *
 * - Rate-limited: skips if warmed within the last 2 hours
 * - Batches advisor detail fetches (5 at a time) to avoid overwhelming HubSpot
 * - Fire-and-forget from the client — returns immediately with status
 */

import { NextResponse } from 'next/server';
import { withPgCache } from '@/lib/pg-cache';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const TWELVE_HOURS = 12 * 60 * 60 * 1000;
const WARM_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours between warm runs
const BATCH_SIZE = 5;

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

const CONTACT_PROPS = [
  'firstname', 'lastname', 'email', 'phone', 'mobilephone',
  'city', 'state', 'zip', 'company',
  'hs_linkedin_url', 'linkedin_url',
  'assets', 'client_type', 'advisor_current_aum',
  'notes_last_contacted', 'notes_last_updated',
  'num_notes', 'num_contacted_notes',
  'hs_pinned_engagement_id', 'hs_object_id',
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

// ── Check if warm ran recently ──────────────────────────────────────────────
async function shouldSkipWarm(): Promise<boolean> {
  try {
    const result = await pool.query<{ expires_at: Date }>(
      `SELECT expires_at FROM api_cache WHERE cache_key = 'warm-last-run'`
    );
    if (result.rows[0] && result.rows[0].expires_at > new Date()) {
      return true;
    }
  } catch (err) {
    console.warn('[warm] Cache check failed, proceeding:', err instanceof Error ? err.message : String(err));
  }
  return false;
}

async function markWarmRun(): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + WARM_COOLDOWN_MS);
  await pool.query(
    `INSERT INTO api_cache (cache_key, data, expires_at, created_at, updated_at)
     VALUES ('warm-last-run', '"ok"', $1, $2, $2)
     ON CONFLICT (cache_key) DO UPDATE
       SET data = EXCLUDED.data,
           expires_at = EXCLUDED.expires_at,
           updated_at = EXCLUDED.updated_at`,
    [expiresAt, now]
  );
}

// ── Fetch a single advisor detail (mirrors advisor/[id]/route.ts logic) ─────
async function fetchAdvisorDetail(dealId: string) {
  const headers = { Authorization: `Bearer ${HUBSPOT_PAT}` };
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

  // Fetch deal + notes + team in parallel
  const [dealRes, notesRes, teamAssocRes] = await Promise.all([
    fetch(`https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=${DEAL_PROPS}&associations=contacts,notes`, { headers }),
    fetch('https://api.hubapi.com/crm/v3/objects/notes/search', {
      method: 'POST', headers: jsonHeaders,
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'associations.deal', operator: 'EQ', value: dealId }] }],
        properties: ['hs_note_body', 'hs_timestamp', 'hubspot_owner_id'],
        sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
        limit: 20,
      }),
    }),
    fetch(`https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/${TEAMS_OBJECT_TYPE}`, { headers }),
  ]);

  if (!dealRes.ok) throw new Error(`Deal fetch failed: ${dealRes.status}`);
  const deal = await dealRes.json();
  const notes = notesRes.ok ? (await notesRes.json()).results ?? [] : [];

  // Resolve team record
  let team = null;
  if (teamAssocRes.ok) {
    const teamAssocData = await teamAssocRes.json();
    const teamResults = teamAssocData.results ?? [];
    if (teamResults.length > 0) {
      const teamId = teamResults[0].toObjectId;
      const teamRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/${TEAMS_OBJECT_TYPE}/${teamId}?properties=${TEAM_PROPS}`,
        { headers }
      );
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        team = { id: teamData.id, ...teamData.properties };
      }
    }
  }

  // Fetch associated contacts
  let contact: Record<string, unknown> | null = null;
  let pinnedNote = null;
  const allContacts: Record<string, unknown>[] = [];

  const assocRes = await fetch(
    `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/contacts`,
    { headers }
  );
  if (assocRes.ok) {
    const assocData = await assocRes.json();
    const contactAssocs = assocData.results ?? [];

    if (contactAssocs.length > 0) {
      const primaryContactId = contactAssocs[0].toObjectId;
      const contactRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${primaryContactId}?properties=${CONTACT_PROPS}`,
        { headers }
      );
      if (contactRes.ok) {
        const contactData = await contactRes.json();
        contact = { id: contactData.id, ...contactData.properties };

        // Pinned note
        const pinnedId = contact?.hs_pinned_engagement_id as string | undefined;
        if (pinnedId) {
          const noteRes = await fetch(
            `https://api.hubapi.com/crm/v3/objects/notes/${pinnedId}?properties=hs_note_body,hs_timestamp,hubspot_owner_id,hs_attachment_ids`,
            { headers }
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
      }

      // Fetch additional associated contacts
      for (const assoc of contactAssocs) {
        if (contact && assoc.toObjectId === primaryContactId) {
          allContacts.push(contact);
          continue;
        }
        try {
          const otherRes = await fetch(
            `https://api.hubapi.com/crm/v3/objects/contacts/${assoc.toObjectId}?properties=firstname,lastname,email,phone,company,city,state`,
            { headers }
          );
          if (otherRes.ok) {
            const otherData = await otherRes.json();
            allContacts.push({ id: otherData.id, ...otherData.properties });
          }
        } catch (err) { console.warn('[warm] Contact fetch skipped:', err instanceof Error ? err.message : String(err)); }
      }
    }
  }

  // Fetch engagements if we have a contact
  let engagements: { type: string; id: string; timestamp: string; properties: Record<string, string> }[] = [];
  const contactObjectId = contact?.hs_object_id as string | undefined;
  if (contactObjectId) {
    const engagementTypes = [
      { type: 'emails', props: 'hs_email_subject,hs_email_direction,hs_email_status,hs_timestamp,hs_email_text' },
      { type: 'calls', props: 'hs_call_title,hs_call_direction,hs_call_status,hs_call_duration,hs_timestamp,hs_call_body' },
      { type: 'meetings', props: 'hs_meeting_title,hs_meeting_outcome,hs_timestamp,hs_meeting_start_time,hs_meeting_end_time,hs_meeting_body' },
    ];

    await Promise.all(engagementTypes.map(async ({ type, props }) => {
      try {
        const res = await fetch(`https://api.hubapi.com/crm/v3/objects/${type}/search`, {
          method: 'POST', headers: jsonHeaders,
          body: JSON.stringify({
            filterGroups: [{ filters: [{ propertyName: 'associations.contact', operator: 'EQ', value: contactObjectId }] }],
            properties: props.split(','),
            sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
            limit: 10,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          for (const item of (data.results ?? [])) {
            engagements.push({
              type: type.replace(/s$/, ''),
              id: item.id,
              timestamp: item.properties?.hs_timestamp ?? '',
              properties: item.properties ?? {},
            });
          }
        }
      } catch (err) { console.warn('[warm] Engagement fetch skipped:', err instanceof Error ? err.message : String(err)); }
    }));
    engagements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    engagements = engagements.slice(0, 20);
  }

  return { deal, notes, team, contact, pinnedNote, allContacts, engagements };
}

// ── Get deal IDs from pipeline cache (or fetch fresh) ───────────────────────
async function getDealIds(): Promise<{ id: string; dealname?: string }[]> {
  // Check if pipeline data is already in PG cache
  const result = await pool.query<{ data: { deals?: { id: string; dealname?: string }[] } }>(
    `SELECT data FROM api_cache WHERE cache_key = 'pipeline' AND expires_at > NOW()`
  );
  if (result.rows[0]?.data?.deals) {
    return result.rows[0].data.deals;
  }

  // Pipeline cache is cold — fetch deal IDs directly from HubSpot
  const PIPELINE_ID = '751770';
  const ACTIVE_STAGE_IDS = ['2496931', '2496932', '2496934', '100409509', '2496935', '2496936', '100411705'];
  const deals: { id: string; dealname?: string }[] = [];
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filterGroups: [{
        filters: [
          { propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID },
          { propertyName: 'dealstage', operator: 'IN', values: ACTIVE_STAGE_IDS },
        ],
      }],
      properties: ['dealname'],
      limit: 100,
    };
    if (after) body.after = after;

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) break;
    const data = await res.json();
    for (const d of data.results ?? []) {
      deals.push({ id: d.id, dealname: d.properties?.dealname });
    }
    after = data.paging?.next?.after;
  } while (after);

  return deals;
}

// ── Background warming logic ────────────────────────────────────────────────
async function warmAllCaches(): Promise<{ dealCount: number; cached: number; errors: number }> {
  let cached = 0;
  let errors = 0;

  // 1. Get list of active deals
  console.log('[warm] Getting deal list...');
  const deals = await getDealIds();
  const dealCount = deals.length;
  console.log(`[warm] Found ${dealCount} active deals to warm`);

  // 2. Warm each advisor detail in batches of 5
  for (let i = 0; i < deals.length; i += BATCH_SIZE) {
    const batch = deals.slice(i, i + BATCH_SIZE);
    console.log(`[warm] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(deals.length / BATCH_SIZE)}`);
    const results = await Promise.allSettled(
      batch.map(deal =>
        withPgCache(`advisor-${deal.id}`, () => fetchAdvisorDetail(deal.id), { ttlMs: TWELVE_HOURS })
          .then(r => {
            if (r.cached) cached++;
            console.log(`[warm] ${r.cached ? 'HIT' : 'FETCHED'} advisor-${deal.id} (${deal.dealname ?? deal.id})`);
          })
      )
    );
    for (const r of results) {
      if (r.status === 'rejected') {
        errors++;
        console.error('[warm] Advisor fetch failed:', r.reason);
      }
    }
  }

  console.log(`[warm] Advisor warming done — ${cached} hits, ${errors} errors`);
  return { dealCount, cached, errors };
}

// ── POST handler ────────────────────────────────────────────────────────────
export async function POST() {
  try {
    // Rate limit: skip if warmed recently
    if (await shouldSkipWarm()) {
      console.log('[warm] Skipped — warmed within last 2 hours');
      return NextResponse.json({ status: 'skipped', reason: 'warmed recently' });
    }

    // Mark this warm run immediately to prevent concurrent runs
    await markWarmRun();

    // Start warming in background (don't await — return immediately)
    warmAllCaches()
      .then(result => {
        console.log(`[warm] Complete — ${result.dealCount} deals, ${result.cached} cache hits, ${result.errors} errors`);
      })
      .catch(err => {
        console.error('[warm] Background warming failed:', err);
      });

    return NextResponse.json({ status: 'warming', message: 'Background cache warming started' });
  } catch (err) {
    console.error('[warm]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
