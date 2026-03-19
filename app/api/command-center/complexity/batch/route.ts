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

// Lightweight scoring using only deal-level data (no extra API calls).
// This gives a reasonable estimate without the team object or notes.
// Full score requires the single-deal endpoint.
function quickScore(deal: Record<string, string | null | undefined>) {
  return computeComplexityScore(deal, null, []);
}

// ── POST: Batch compute complexity for multiple deals ────────────────────────
// Body: { dealIds: string[] }
// Returns a map of dealId → { score, tier, tierColor }
// Uses quick scoring (deal data only) for speed. For full scoring, use the
// single-deal GET endpoint which fetches team object + notes.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dealIds: string[] = body.dealIds ?? [];

    if (dealIds.length === 0) {
      return NextResponse.json({ scores: {} });
    }

    // Cap at 200 to prevent abuse
    const ids = dealIds.slice(0, 200);

    // Batch fetch deals from HubSpot (up to 100 at a time)
    const allDeals: Record<string, Record<string, string | null>> = {};

    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/batch/read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: DEAL_PROPS.split(','),
          inputs: batch.map(id => ({ id })),
        }),
      });

      if (!res.ok) {
        console.error(`[complexity batch] HubSpot batch read failed: ${res.status}`);
        continue;
      }

      const data = await res.json();
      for (const result of data.results ?? []) {
        allDeals[result.id] = result.properties;
      }
    }

    // For deals in Step 5+ (Offer Review and beyond), try to fetch team data
    // These are the deals where complexity matters most for staffing
    const advancedStages = ['2496935', '2496936', '100411705'];
    const advancedDealIds = Object.entries(allDeals)
      .filter(([, props]) => advancedStages.includes(props.dealstage ?? ''))
      .map(([id]) => id);

    // Fetch team records for advanced deals (parallel, max 10 concurrent)
    const teamData: Record<string, Record<string, string | null> | null> = {};
    const CONCURRENCY = 10;

    for (let i = 0; i < advancedDealIds.length; i += CONCURRENCY) {
      const batch = advancedDealIds.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (dealId) => {
          const assocRes = await fetch(
            `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/${TEAMS_OBJECT_TYPE}`,
            { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
          );
          if (!assocRes.ok) return { dealId, team: null };
          const assocData = await assocRes.json();
          const results = assocData.results ?? [];
          if (results.length === 0) return { dealId, team: null };

          const teamId = results[0].toObjectId;
          const teamRes = await fetch(
            `https://api.hubapi.com/crm/v3/objects/${TEAMS_OBJECT_TYPE}/${teamId}?properties=${TEAM_PROPS}`,
            { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
          );
          if (!teamRes.ok) return { dealId, team: null };
          const teamObj = await teamRes.json();
          return { dealId, team: teamObj.properties ?? null };
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          teamData[result.value.dealId] = result.value.team;
        }
      }
    }

    // Compute scores
    const scores: Record<string, { score: number; tier: string; tierColor: string; estimatedDays: number }> = {};

    for (const [dealId, props] of Object.entries(allDeals)) {
      const team = teamData[dealId] ?? null;
      const result = team ? computeComplexityScore(props, team, []) : quickScore(props);
      scores[dealId] = {
        score: result.score,
        tier: result.tier,
        tierColor: result.tierColor,
        estimatedDays: result.estimatedDays,
      };
    }

    return NextResponse.json({ scores });
  } catch (err) {
    console.error('[complexity batch]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
