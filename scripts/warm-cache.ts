/**
 * Cache Warm-Up Script
 *
 * Pre-populates Redis + S3 Bucket with all advisor data.
 * Calls EXISTING API routes — no data modification.
 *
 * Usage: npx tsx scripts/warm-cache.ts
 *
 * Run this once after initial deployment to ensure instant page loads
 * for all advisors from the first user visit.
 */

import { writeThroughCache } from '../lib/cached-fetchers';
import { prisma } from '../lib/prisma';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const PIPELINE_ID = '751770';
const ACTIVE_STAGE_IDS = [
  '2496931', '2496932', '2496934', '100409509',
  '2496935', '2496936', '100411705',
];

async function fetchAllDealIds(): Promise<Array<{ id: string; name: string }>> {
  const deals: Array<{ id: string; name: string }> = [];
  let after: string | undefined;

  do {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [
            { propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID },
            { propertyName: 'dealstage', operator: 'IN', values: ACTIVE_STAGE_IDS },
          ],
        }],
        properties: ['dealname'],
        limit: 100,
        ...(after ? { after } : {}),
      }),
    });

    if (!res.ok) throw new Error(`HubSpot deal fetch failed: ${res.status}`);
    const data = await res.json();
    deals.push(...data.results.map((d: { id: string; properties: { dealname: string } }) => ({
      id: d.id,
      name: d.properties.dealname,
    })));
    after = data.paging?.next?.after;
  } while (after);

  return deals;
}

async function warmAdvisors(deals: Array<{ id: string; name: string }>): Promise<number> {
  console.log(`[Warm] Warming ${deals.length} advisor profiles...`);

  const baseUrl = process.env.NEXTAUTH_URL || process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : 'http://localhost:3000';

  let warmed = 0;
  let errors = 0;
  const BATCH_SIZE = 5;

  for (let i = 0; i < deals.length; i += BATCH_SIZE) {
    const batch = deals.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (deal) => {
      try {
        const res = await fetch(`${baseUrl}/api/command-center/advisor/${deal.id}`);
        if (res.ok) {
          const data = await res.json();
          await writeThroughCache('advisor', deal.id, data);
          warmed++;
          console.log(`[Warm] ✓ ${deal.name} (${deal.id}) — ${warmed}/${deals.length}`);
        } else {
          errors++;
          console.error(`[Warm] ✗ ${deal.name} (${deal.id}) — HTTP ${res.status}`);
        }
      } catch (err) {
        errors++;
        console.error(`[Warm] ��� ${deal.name} (${deal.id}) — ${err}`);
      }
    }));

    // Small delay between batches to respect HubSpot rate limits
    if (i + BATCH_SIZE < deals.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`[Warm] Advisor warm complete: ${warmed} warmed, ${errors} errors`);
  return warmed;
}

async function warmPipelineAndMetrics(): Promise<void> {
  console.log('[Warm] Warming pipeline and metrics...');

  const baseUrl = process.env.NEXTAUTH_URL || process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : 'http://localhost:3000';

  for (const endpoint of ['/api/command-center/pipeline', '/api/command-center/metrics']) {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`);
      console.log(`[Warm] ✓ ${endpoint} — ${res.status}`);
    } catch (err) {
      console.error(`[Warm] ✗ ${endpoint} — ${err}`);
    }
  }
}

async function main() {
  console.log('[Warm] ═══════════════════════════════════════════════════');
  console.log(`[Warm] Cache warm-up started at ${new Date().toISOString()}`);
  console.log('[Warm] ══════════���════════════════════════��═══════════════');

  const deals = await fetchAllDealIds();
  console.log(`[Warm] Found ${deals.length} active pipeline deals`);

  await warmAdvisors(deals);
  await warmPipelineAndMetrics();

  console.log('[Warm] ═══════════════════════════════════════════���═══════');
  console.log(`[Warm] Cache warm-up complete at ${new Date().toISOString()}`);
  console.log('[Warm] ═══════════════════════════════════════════════════');

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('[Warm] Fatal error:', err);
  process.exit(1);
});
