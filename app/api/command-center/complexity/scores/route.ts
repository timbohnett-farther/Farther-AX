import { NextResponse } from 'next/server';
import { computeComplexityScore } from '@/lib/complexity-score';
import { getCached } from '@/lib/cached-fetchers';

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

// Active pipeline stages (excluding archived/closed)
const ACTIVE_STAGES = [
  '2496931', // Qualify
  '2496932', // Discovery Call
  '2496933', // Economic Proposal
  '2496934', // Under LOI
  '2496935', // Offer Review
  '2496936', // Offer Accepted
  '100411705', // Launched
];

function quickScore(deal: Record<string, string | null | undefined>) {
  return computeComplexityScore(deal, null, []);
}

/**
 * GET /api/command-center/complexity/scores
 *
 * Fetches all active deals and returns complexity scores for each.
 * Returns: Record<dealId, { score, tier, tierColor, estimatedDays }>
 */
export async function GET() {
  try {
    const result = await getCached('metrics', 'complexity-scores', async () => {
      if (!HUBSPOT_PAT) {
        throw new Error('HUBSPOT_ACCESS_TOKEN not configured');
      }

      // Fetch all active pipeline deals
      const dealsRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/deals?properties=${DEAL_PROPS}&limit=100`,
        { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
      );

      if (!dealsRes.ok) {
        console.error('[complexity/scores] Failed to fetch deals:', dealsRes.status);
        throw new Error('Failed to fetch deals from HubSpot');
      }

      const dealsData = await dealsRes.json();
      const allDeals = dealsData.results ?? [];

      // Filter to active stages only
      const activeDeals = allDeals.filter((deal: { properties: { dealstage?: string } }) =>
        ACTIVE_STAGES.includes(deal.properties.dealstage ?? '')
      );

      console.log(`[complexity/scores] Processing ${activeDeals.length} active deals`);

      // Build map of dealId → properties
      const dealMap: Record<string, Record<string, string | null>> = {};
      for (const deal of activeDeals) {
        dealMap[deal.id] = deal.properties;
      }

      // For deals in advanced stages, fetch team data
      const advancedStages = ['2496935', '2496936', '100411705'];
      const advancedDealIds = Object.entries(dealMap)
        .filter(([, props]) => advancedStages.includes(props.dealstage ?? ''))
        .map(([id]) => id);

      // Fetch team records (parallel, max 10 concurrent)
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

      for (const [dealId, props] of Object.entries(dealMap)) {
        const team = teamData[dealId] ?? null;
        const computedResult = team ? computeComplexityScore(props, team, []) : quickScore(props);
        scores[dealId] = {
          score: computedResult.score,
          tier: computedResult.tier,
          tierColor: computedResult.tierColor,
          estimatedDays: computedResult.estimatedDays,
        };
      }

      console.log(`[complexity/scores] Computed scores for ${Object.keys(scores).length} deals`);
      return scores;
    });

    return NextResponse.json(result.data);
  } catch (err) {
    console.error('[complexity/scores]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
