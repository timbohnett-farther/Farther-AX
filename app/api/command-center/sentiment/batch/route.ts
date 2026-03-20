/**
 * app/api/command-center/sentiment/batch/route.ts
 *
 * POST /api/command-center/sentiment/batch
 *
 * One-time batch scoring: fetches all active pipeline deals and scores each
 * sequentially through the /api/command-center/sentiment/score endpoint.
 * Returns progress and results.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minute timeout for batch

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const PIPELINE_ID = '751770';
const ACTIVE_STAGE_IDS = ['2496931', '2496932', '2496934', '100409509', '2496935', '2496936', '100411705'];

interface DealResult {
  id: string;
  properties: Record<string, string | null>;
}

async function fetchAllActiveDeals(): Promise<DealResult[]> {
  const deals: DealResult[] = [];
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filterGroups: [{
        filters: [
          { propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID },
        ],
      }],
      properties: ['dealname', 'dealstage'],
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

  // Filter to active stages and exclude test deals
  return deals.filter(d =>
    ACTIVE_STAGE_IDS.includes(d.properties.dealstage ?? '') &&
    !d.properties.dealname?.toLowerCase().includes('test')
  );
}

export async function POST(req: NextRequest) {
  try {
    const deals = await fetchAllActiveDeals();
    const results: { deal_id: string; name: string; status: string; tier?: string; score?: number }[] = [];

    // Get the base URL from the request
    const baseUrl = new URL(req.url).origin;

    // Score each deal sequentially to avoid rate limits
    for (let i = 0; i < deals.length; i++) {
      const deal = deals[i];
      const name = deal.properties.dealname ?? 'Unknown';
      console.log(`[sentiment-batch] Scoring ${i + 1}/${deals.length}: ${name}`);

      try {
        const res = await fetch(`${baseUrl}/api/command-center/sentiment/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dealId: deal.id }),
        });

        if (res.ok) {
          const data = await res.json();
          results.push({
            deal_id: deal.id,
            name,
            status: 'scored',
            tier: data.tier,
            score: data.composite_score,
          });
        } else {
          results.push({ deal_id: deal.id, name, status: `error: ${res.status}` });
        }
      } catch (err) {
        results.push({ deal_id: deal.id, name, status: `failed: ${err instanceof Error ? err.message : String(err)}` });
      }

      // Small delay between scores to avoid HubSpot rate limits
      if (i < deals.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const scored = results.filter(r => r.status === 'scored').length;
    const failed = results.filter(r => r.status !== 'scored').length;

    return NextResponse.json({
      total: deals.length,
      scored,
      failed,
      results,
    });
  } catch (err) {
    console.error('[sentiment-batch]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
