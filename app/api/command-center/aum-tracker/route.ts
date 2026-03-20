/**
 * app/api/command-center/aum-tracker/route.ts
 *
 * GET /api/command-center/aum-tracker
 *
 * For each launched advisor (Step 7), fetches:
 *   - Expected AUM from the deal record (transferable_aum)
 *   - Actual current AUM from the associated contact (advisor_current_aum)
 *
 * Returns a list of advisors with expected vs actual AUM for tracking
 * transfer progress.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const PIPELINE_ID = '751770';
const LAUNCHED_STAGE_ID = '100411705';
const TEAMS_OBJECT_TYPE = '2-43222882';

interface DealResult {
  id: string;
  properties: Record<string, string | null>;
}

// ── Step 1: Fetch all launched deals ─────────────────────────────────────────
async function fetchLaunchedDeals(): Promise<DealResult[]> {
  const deals: DealResult[] = [];
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filterGroups: [{
        filters: [
          { propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID },
          { propertyName: 'dealstage', operator: 'EQ', value: LAUNCHED_STAGE_ID },
        ],
      }],
      properties: [
        'dealname', 'transferable_aum', 'aum', 'initial_aum', 'book_assets',
        'actual_launch_date', 'desired_start_date', 'client_households',
        'transferable_households', 'current_firm__cloned_', 'transition_type',
      ],
      sorts: [{ propertyName: 'dealname', direction: 'ASCENDING' }],
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
    deals.push(...(data.results ?? []));
    after = data.paging?.next?.after;
  } while (after);

  return deals;
}

// ── Step 2: Batch fetch contact IDs for deals ────────────────────────────────
async function fetchDealContactAssociations(dealIds: string[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {};

  // HubSpot batch associations: max 100 per request
  for (let i = 0; i < dealIds.length; i += 100) {
    const batch = dealIds.slice(i, i + 100);
    const res = await fetch(
      'https://api.hubapi.com/crm/v4/associations/deals/contacts/batch/read',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: batch.map(id => ({ id })) }),
      }
    );
    if (!res.ok) continue;
    const data = await res.json();
    for (const result of data.results ?? []) {
      const dealId = result.from?.id;
      const contactId = result.to?.[0]?.toObjectId;
      if (dealId && contactId) {
        map[dealId] = String(contactId);
      }
    }
  }

  return map;
}

// ── Step 3: Batch fetch contact AUM properties ───────────────────────────────
async function fetchContactAUM(contactIds: string[]): Promise<Record<string, { aum: number | null; name: string }>> {
  const map: Record<string, { aum: number | null; name: string }> = {};
  const uniqueIds = Array.from(new Set(contactIds));

  // HubSpot batch read: max 100 per request
  for (let i = 0; i < uniqueIds.length; i += 100) {
    const batch = uniqueIds.slice(i, i + 100);
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/batch/read', {
      method: 'POST',
      headers: { Authorization: `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: batch.map(id => ({ id })),
        properties: ['advisor_current_aum', 'firstname', 'lastname'],
      }),
    });
    if (!res.ok) continue;
    const data = await res.json();
    for (const contact of data.results ?? []) {
      const rawAum = contact.properties?.advisor_current_aum;
      map[contact.id] = {
        aum: rawAum ? parseFloat(rawAum) : null,
        name: [contact.properties?.firstname, contact.properties?.lastname].filter(Boolean).join(' '),
      };
    }
  }

  return map;
}

// ── Step 4: Batch fetch Teams associations + fee rate ────────────────────────
async function fetchDealTeamAssociations(dealIds: string[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (let i = 0; i < dealIds.length; i += 100) {
    const batch = dealIds.slice(i, i + 100);
    const res = await fetch(
      `https://api.hubapi.com/crm/v4/associations/deals/${TEAMS_OBJECT_TYPE}/batch/read`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: batch.map(id => ({ id })) }),
      }
    );
    if (!res.ok) continue;
    const data = await res.json();
    for (const result of data.results ?? []) {
      const dealId = result.from?.id;
      const teamId = result.to?.[0]?.toObjectId;
      if (dealId && teamId) {
        map[dealId] = String(teamId);
      }
    }
  }
  return map;
}

async function fetchTeamFeeRates(teamIds: string[]): Promise<Record<string, number | null>> {
  const map: Record<string, number | null> = {};
  const uniqueIds = Array.from(new Set(teamIds));

  for (let i = 0; i < uniqueIds.length; i += 100) {
    const batch = uniqueIds.slice(i, i + 100);
    const res = await fetch(`https://api.hubapi.com/crm/v3/objects/${TEAMS_OBJECT_TYPE}/batch/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: batch.map(id => ({ id })),
        properties: ['average_fee_rate'],
      }),
    });
    if (!res.ok) continue;
    const data = await res.json();
    for (const team of data.results ?? []) {
      const raw = team.properties?.average_fee_rate;
      map[team.id] = raw ? parseFloat(raw) : null;
    }
  }
  return map;
}

// ── GET handler ──────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeAll = searchParams.get('all') === 'true';
  try {
    // Step 1: Get all launched deals
    const deals = await fetchLaunchedDeals();
    const dealIds = deals.map(d => d.id);

    // Step 2: Get contact and team associations in parallel
    const [dealContactMap, dealTeamMap] = await Promise.all([
      fetchDealContactAssociations(dealIds),
      fetchDealTeamAssociations(dealIds),
    ]);

    // Step 3: Get actual AUM from contacts and fee rates from teams in parallel
    const contactIds = Object.values(dealContactMap).filter(Boolean);
    const teamIds = Object.values(dealTeamMap).filter(Boolean);
    const [contactAumMap, teamFeeMap] = await Promise.all([
      fetchContactAUM(contactIds),
      fetchTeamFeeRates(teamIds),
    ]);

    // Step 5: Build the response
    const advisors = deals.map(deal => {
      const contactId = dealContactMap[deal.id];
      const teamId = dealTeamMap[deal.id];
      const contactData = contactId ? contactAumMap[contactId] : null;
      // average_fee_rate is stored as basis points (e.g. 100 = 100 bps = 1%)
      // Pass through the raw value — no conversion needed
      const feeRateRaw = teamId ? teamFeeMap[teamId] : null;
      const expectedAum = parseFloat(deal.properties.transferable_aum ?? '0') || null;
      const actualAum = contactData?.aum ?? null;
      const launchDate = deal.properties.actual_launch_date || deal.properties.desired_start_date;

      // Calculate transfer percentage
      let transferPct: number | null = null;
      if (expectedAum && actualAum && expectedAum > 0) {
        transferPct = Math.round((actualAum / expectedAum) * 100);
      }

      // Calculate current revenue: AUM × (BPS / 10,000)
      // e.g. $50M × (100 bps / 10000) = $500K
      let currentRevenue: number | null = null;
      if (actualAum && feeRateRaw && feeRateRaw > 0) {
        currentRevenue = Math.round(actualAum * (feeRateRaw / 10000));
      }

      // Days since launch
      let daysSinceLaunch: number | null = null;
      if (launchDate) {
        daysSinceLaunch = Math.floor((Date.now() - new Date(launchDate).getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        deal_id: deal.id,
        advisor_name: deal.properties.dealname ?? '—',
        contact_id: contactId ?? null,
        expected_aum: expectedAum,
        actual_aum: actualAum,
        transfer_pct: transferPct,
        fee_rate_bps: feeRateRaw,
        current_revenue: currentRevenue,
        launch_date: launchDate ?? null,
        days_since_launch: daysSinceLaunch,
        prior_firm: deal.properties.current_firm__cloned_ ?? null,
        households: deal.properties.client_households ? parseInt(deal.properties.client_households) : null,
        transition_type: deal.properties.transition_type ?? null,
      };
    });

    // Filter: always exclude test advisors; optionally limit to graduation window
    const GRADUATION_DAYS = 90;
    const filtered = advisors.filter(a => {
      if (a.advisor_name.toLowerCase().includes('test')) return false;
      // When ?all=true, include all launched advisors (for pipeline table)
      if (includeAll) return true;
      // Default: only include advisors within 90-day graduation window
      return a.days_since_launch === null || a.days_since_launch <= GRADUATION_DAYS;
    });

    // Sort by advisor name (last name)
    filtered.sort((a, b) => {
      const lastA = (a.advisor_name.split(/\s+/).pop() ?? '').toLowerCase();
      const lastB = (b.advisor_name.split(/\s+/).pop() ?? '').toLowerCase();
      return lastA.localeCompare(lastB);
    });

    // Summary stats
    const withExpected = filtered.filter(a => a.expected_aum);
    const withActual = filtered.filter(a => a.actual_aum);
    const totalExpected = withExpected.reduce((sum, a) => sum + (a.expected_aum ?? 0), 0);
    const totalActual = withActual.reduce((sum, a) => sum + (a.actual_aum ?? 0), 0);
    const totalRevenue = filtered.reduce((sum, a) => sum + (a.current_revenue ?? 0), 0);

    return NextResponse.json({
      advisors: filtered,
      total: filtered.length,
      summary: {
        total_expected_aum: totalExpected,
        total_actual_aum: totalActual,
        overall_transfer_pct: totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : null,
        advisors_with_expected: withExpected.length,
        advisors_with_actual: withActual.length,
        total_current_revenue: totalRevenue,
      },
    });
  } catch (err) {
    console.error('[aum-tracker]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
