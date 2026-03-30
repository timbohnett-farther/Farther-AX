import { NextResponse } from 'next/server';
import { withPgCache } from '@/lib/pg-cache';
import { paginatedSearch, hubspotFetch } from '@/lib/hubspot';

const PIPELINE_ID = '751770';

// ── Stage definitions ─────────────────────────────────────────────────────────
// Active stages: deals currently progressing through the funnel
// NOTE: Holding Pattern and terminal stages are excluded from the dashboard entirely.
// Launched advisors (Step 7) are included but filtered to 90 days past start date.
const ACTIVE_STAGE_IDS = [
  '2496931',   // Step 1 – First Meeting
  '2496932',   // Step 2 – Financial Model
  '2496934',   // Step 3 – Advisor Demo
  '100409509', // Step 4 – Discovery Day
  '2496935',   // Step 5 – Offer Review
  '2496936',   // Step 6 – Offer Accepted
  '100411705', // Step 7 – Launched
];

const LAUNCHED_STAGE_ID = '100411705';

const DEAL_PROPERTIES = [
  // Identity
  'dealname', 'dealstage', 'pipeline', 'hubspot_owner_id', 'createdate', 'hs_lastmodifieddate',
  // AUM & Revenue
  'aum', 'transferable_aum', 'transferable_aum__', 'current_value', 't12_revenue', 'fee_based_revenue',
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

// ── Type definitions ──────────────────────────────────────────────────────────
type DealResult = { id: string; properties: Record<string, string | null> };

// ── Fetch active deals (in-progress stages) ───────────────────────────────────
async function fetchActiveDeals(): Promise<DealResult[]> {
  // HubSpot allows max 5 filterGroups. We use one group per active stage
  // with AND logic: pipeline = X AND dealstage IN active stages.
  return paginatedSearch<DealResult>(
    'deals',
    [
      {
        filters: [
          { propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID },
          { propertyName: 'dealstage', operator: 'IN', values: ACTIVE_STAGE_IDS },
        ],
      },
    ],
    DEAL_PROPERTIES,
    [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }]
  );
}

// ── Compute days since launch for graduated status ──────────────────────────
function enrichLaunchStatus(deals: DealResult[]): (DealResult & { daysSinceLaunch?: number })[] {
  const now = Date.now();
  return deals.map(deal => {
    if (deal.properties.dealstage !== LAUNCHED_STAGE_ID) return deal;
    const startStr = deal.properties.actual_launch_date || deal.properties.desired_start_date;
    if (!startStr) return deal;
    const daysSinceLaunch = Math.floor((now - new Date(startStr).getTime()) / (1000 * 60 * 60 * 24));
    return { ...deal, daysSinceLaunch };
  });
}

// ── Fetch owners (paginated — HubSpot can have 500+ owners) ─────────────────
async function fetchOwners(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  let after: string | undefined;

  do {
    const url = `/crm/v3/owners?limit=100${after ? `&after=${after}` : ''}`;
    const data = await hubspotFetch<{
      results: Array<{ id: string; firstName: string; lastName: string }>;
      paging?: { next?: { after: string } };
    }>(url);

    for (const o of data.results) {
      map[o.id] = `${o.firstName} ${o.lastName}`.trim();
    }
    after = data.paging?.next?.after;
  } while (after);

  return map;
}

// ── Fresh data fetcher (called by cache on miss) ─────────────────────────────
async function fetchPipelineData() {
  const [rawDeals, owners] = await Promise.all([
    fetchActiveDeals(),
    fetchOwners(),
  ]);

  const deals = enrichLaunchStatus(rawDeals);

  const enriched = deals.map(deal => ({
    id: deal.id,
    ...deal.properties,
    ownerName: owners[deal.properties.hubspot_owner_id ?? ''] ?? null,
    daysSinceLaunch: (deal as { daysSinceLaunch?: number }).daysSinceLaunch ?? null,
  }));

  return { deals: enriched, total: enriched.length };
}

// ── GET handler ─────────────────────────────────────────────────────────────
// Cache waterfall: Redis (L1) → S3 Bucket (L2) → PostgreSQL cache (L3) → HubSpot (L4)
export async function GET() {
  try {
    const { getCached } = await import('@/lib/cached-fetchers');

    const { data, source } = await getCached('pipeline', 'all', async () => {
      // Existing withPgCache logic — UNCHANGED
      const { data } = await withPgCache(
        'pipeline',
        fetchPipelineData,
        { ttlMs: 12 * 60 * 60 * 1000 } // 12 hours
      );
      return data;
    });

    const res = NextResponse.json(data);
    res.headers.set('X-Cache', source.toUpperCase());
    return res;
  } catch (err) {
    console.error('[pipeline]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
