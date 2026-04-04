/**
 * Cache Integrity Verification Script
 *
 * Compares cached data against live HubSpot/DB data to ensure
 * the cache layer has not altered any data.
 *
 * Usage: npx tsx scripts/verify-integrity.ts
 *
 * Run after deployment to confirm data integrity.
 */

import { getFromRedis } from '../lib/redis-client';
import { getFromBucket } from '../lib/bucket-client';
import { prisma } from '../lib/prisma';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const PIPELINE_ID = '751770';
const ACTIVE_STAGE_IDS = [
  '2496931', '2496932', '2496934', '100409509',
  '2496935', '2496936', '100411705',
];

// ── Fetch sample deal IDs ───────────────────────────────────────────────────

async function getSampleDealIds(count: number = 5): Promise<string[]> {
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
      limit: count,
    }),
  });

  if (!res.ok) throw new Error(`HubSpot fetch failed: ${res.status}`);
  const data = await res.json();
  return data.results.map((d: { id: string }) => d.id);
}

// ── Deep comparison (ignoring _cachedAt metadata) ───────────────────────────

function deepEqual(a: unknown, b: unknown, path: string = ''): string[] {
  const diffs: string[] = [];

  if (a === b) return diffs;
  if (a === null || b === null || typeof a !== typeof b) {
    diffs.push(`${path}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
    return diffs;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const allKeys = Array.from(new Set([...Object.keys(aObj), ...Object.keys(bObj)]));

    for (const key of allKeys) {
      // Skip cache metadata
      if (key === '_cachedAt') continue;

      if (!(key in aObj)) {
        diffs.push(`${path}.${key}: missing in source`);
      } else if (!(key in bObj)) {
        diffs.push(`${path}.${key}: missing in cached`);
      } else {
        diffs.push(...deepEqual(aObj[key], bObj[key], `${path}.${key}`));
      }
    }
  } else if (a !== b) {
    diffs.push(`${path}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
  }

  return diffs;
}

// ── Verify a single advisor ─────────────────────────────────────────────────

async function verifyAdvisor(dealId: string): Promise<{ passed: boolean; diffs: string[] }> {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : 'http://localhost:3000';

  // Fetch live data (bypasses Redis/S3, goes to DB/HubSpot)
  const liveRes = await fetch(`${baseUrl}/api/command-center/advisor/${dealId}`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!liveRes.ok) {
    return { passed: false, diffs: [`Live fetch failed: ${liveRes.status}`] };
  }
  const liveData = await liveRes.json();

  // Check Redis cache
  const redisData = await getFromRedis('advisor', dealId);
  const redisDiffs = redisData ? deepEqual(liveData, redisData, 'redis') : [];

  // Check S3 Bucket cache
  const bucketData = await getFromBucket('advisor', dealId);
  const bucketDiffs = bucketData ? deepEqual(liveData, bucketData, 'bucket') : [];

  const allDiffs = [...redisDiffs, ...bucketDiffs];
  return { passed: allDiffs.length === 0, diffs: allDiffs };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[Verify] ═══════════════════════════════════════════════════');
  console.log(`[Verify] Data integrity check started at ${new Date().toISOString()}`);
  console.log('[Verify] ═══════════════════════════════════════════════════');

  const dealIds = await getSampleDealIds(5);
  console.log(`[Verify] Checking ${dealIds.length} sample advisors...`);

  let allPassed = true;

  for (const dealId of dealIds) {
    console.log(`\n[Verify] Checking advisor ${dealId}...`);
    const { passed, diffs } = await verifyAdvisor(dealId);

    if (passed) {
      console.log(`[Verify] ✓ Advisor ${dealId} — all sources match`);
    } else {
      console.error(`[Verify] ✗ Advisor ${dealId} — ${diffs.length} differences found:`);
      for (const diff of diffs.slice(0, 10)) {
        console.error(`  ${diff}`);
      }
      if (diffs.length > 10) {
        console.error(`  ... and ${diffs.length - 10} more`);
      }
      allPassed = false;
    }
  }

  console.log('\n[Verify] ═══════════════════════════════════════════════════');
  if (allPassed) {
    console.log('[Verify] ✓ ALL CHECKS PASSED — data integrity confirmed');
  } else {
    console.log('[Verify] ✗ SOME CHECKS FAILED — review differences above');
  }
  console.log('[Verify] ═══════════════════════════════════════════════════');

  await prisma.$disconnect();
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error('[Verify] Fatal error:', err);
  process.exit(1);
});
