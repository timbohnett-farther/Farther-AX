import { NextResponse } from 'next/server';
import { withCache } from '@/lib/api-cache';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const ACQUISITIONS_PIPELINE_ID = '668946996';

const DEAL_PROPERTIES = [
  // Identity
  'dealname', 'dealstage', 'pipeline', 'hubspot_owner_id', 'createdate', 'hs_lastmodifieddate',
  // AUM & Revenue
  'aum', 'transferable_aum', 'transferable_aum__', 't12_revenue', 'fee_based_revenue',
  'projected_revenue', 'expected_revenue', 'book_assets', 'book_acquired___inherited__',
  'initial_aum', 'average_household_assets',
  // Clients
  'client_households', 'transferable_households',
  // Transition
  'transition_type', 'transition_owner', 'transition_notes',
  // Dates
  'desired_start_date', 'actual_launch_date', 'closedate',
  // Firm
  'current_firm__cloned_', 'custodian__cloned_', 'onboarding_custodian__select_all_that_apply_',
  'firm_type', 'ibd',
  // Advisor intel
  'advisor', 'advisor_goals', 'advisor_top_care_abouts', 'advisor_pain_points',
  // Recruiting
  'advisor_recruiting_lead_source', 'referred_by__cloned_',
  'onboarder',
  // Staff
  'people',
];

// ── Types ────────────────────────────────────────────────────────────────────
type DealResult = { id: string; properties: Record<string, string | null> };
type PipelineStage = { id: string; label: string; displayOrder: number };

// ── Fetch pipeline definition (stages with human-readable labels) ────────────
async function fetchPipelineStages(): Promise<Record<string, PipelineStage>> {
  const res = await fetch(
    `https://api.hubapi.com/crm/v3/pipelines/deals/${ACQUISITIONS_PIPELINE_ID}`,
    { headers: { Authorization: `Bearer ${HUBSPOT_PAT}` } },
  );
  if (!res.ok) {
    console.warn(`[acquisitions] Failed to fetch pipeline stages: ${res.status}`);
    return {};
  }
  const data = await res.json();
  const map: Record<string, PipelineStage> = {};
  for (const s of data.stages ?? []) {
    map[s.id] = { id: s.id, label: s.label, displayOrder: s.displayOrder };
  }
  return map;
}

// ── Paginated HubSpot search ─────────────────────────────────────────────────
async function paginatedSearch(filterGroups: unknown[]): Promise<DealResult[]> {
  const deals: DealResult[] = [];
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filterGroups,
      properties: DEAL_PROPERTIES,
      sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }],
      limit: 100,
    };
    if (after) body.after = after;

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
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

// ── Fetch all Acquisitions deals ─────────────────────────────────────────────
async function fetchAcquisitionsDeals(): Promise<DealResult[]> {
  return paginatedSearch([
    {
      filters: [
        { propertyName: 'pipeline', operator: 'EQ', value: ACQUISITIONS_PIPELINE_ID },
      ],
    },
  ]);
}

// ── Fetch owners ─────────────────────────────────────────────────────────────
async function fetchOwners(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  let after: string | undefined;

  do {
    const url = `https://api.hubapi.com/crm/v3/owners?limit=100${after ? `&after=${after}` : ''}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${HUBSPOT_PAT}` },
    });
    if (!res.ok) break;
    const data = await res.json();
    for (const o of data.results) map[o.id] = `${o.firstName} ${o.lastName}`.trim();
    after = data.paging?.next?.after;
  } while (after);

  return map;
}

// ── Fresh data fetcher (called by cache on miss) ─────────────────────────────
async function fetchAcquisitionsData() {
  const [deals, stages, owners] = await Promise.all([
    fetchAcquisitionsDeals(),
    fetchPipelineStages(),
    fetchOwners(),
  ]);

  const closedKeywords = ['closed', 'passed', 'lost', 'dead'];
  const terminalStageIds = new Set(
    Object.values(stages)
      .filter(s => closedKeywords.some(kw => s.label.toLowerCase().includes(kw)))
      .map(s => s.id),
  );

  const enriched = deals.map(deal => ({
    id: deal.id,
    ...deal.properties,
    ownerName: owners[deal.properties.hubspot_owner_id ?? ''] ?? null,
    stageLabel: stages[deal.properties.dealstage ?? '']?.label ?? deal.properties.dealstage,
    stageOrder: stages[deal.properties.dealstage ?? '']?.displayOrder ?? 999,
    isTerminal: terminalStageIds.has(deal.properties.dealstage ?? ''),
  }));

  enriched.sort((a, b) => {
    const orderDiff = a.stageOrder - b.stageOrder;
    if (orderDiff !== 0) return orderDiff;
    const nameA = (a as Record<string, unknown>).dealname as string ?? '';
    const nameB = (b as Record<string, unknown>).dealname as string ?? '';
    return nameA.localeCompare(nameB);
  });

  const stageSummary = Object.values(stages)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(s => ({
      id: s.id,
      label: s.label,
      count: deals.filter(d => d.properties.dealstage === s.id).length,
      isTerminal: terminalStageIds.has(s.id),
    }));

  return { deals: enriched, total: enriched.length, stages: stageSummary };
}

// ── GET handler (cached — refreshes 3x/day, stale fallback on HubSpot errors) ─
export async function GET() {
  try {
    const { data, cached } = await withCache('acquisitions', fetchAcquisitionsData);
    const res = NextResponse.json(data);
    if (cached) res.headers.set('X-Cache', 'HIT');
    return res;
  } catch (err) {
    console.error('[acquisitions]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
