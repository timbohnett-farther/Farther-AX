/**
 * Background Sync Worker — Railway Cron Job
 *
 * Calls EXISTING fetch functions on a schedule (every 5 minutes).
 * Does NOT modify what is fetched or how it is fetched.
 * Simply stores the results in Redis + S3 Bucket cache layers.
 *
 * Railway Cron Configuration:
 *   Schedule: every 5 minutes (cron: 0/5 * * * *)
 *   Command:  npx tsx worker/sync.ts
 */

import { writeThroughCache } from '../lib/cached-fetchers';
import { getSyncState, setSyncState, invalidatePattern } from '../lib/redis-client';
import { withPgCache } from '../lib/pg-cache';
import { getPipelineDeals } from '../lib/hubspot';
import { getAppUrl } from '../lib/app-url';
import pool from '../lib/db';

// ── Sync Advisors ───────────────────────────────────────────────────────────

async function syncAdvisors(): Promise<number> {
  console.log('[Sync] Starting advisor cache refresh...');

  const lastRunStr = await getSyncState('advisor_sync');
  const lastRun = lastRunStr ? new Date(lastRunStr) : new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get all active pipeline deals (using shared function with 2-minute cache)
  const deals = await getPipelineDeals(['dealname', 'dealstage', 'hs_lastmodifieddate']);
  console.log(`[Sync] Found ${deals.length} active pipeline deals`);

  // Check which advisors have been modified since last sync
  let updated = 0;
  const BATCH_SIZE = 5;

  for (let i = 0; i < deals.length; i += BATCH_SIZE) {
    const batch = deals.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (deal) => {
      try {
        const lastModified = deal.properties.hs_lastmodifieddate;
        if (lastModified && new Date(lastModified) <= lastRun) {
          return; // Skip — not modified since last sync
        }

        // Fetch full advisor data via the existing API route pattern
        // This triggers the existing DB-first + HubSpot logic
        const baseUrl = getAppUrl();

        const res = await fetch(`${baseUrl}/api/command-center/advisor/${deal.id}`, {
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (res.ok) {
          const advisorData = await res.json();
          // Write through to Redis + S3
          await writeThroughCache('advisor', deal.id, advisorData);
          updated++;
          console.log(`[Sync] Updated advisor ${deal.id}: ${deal.properties.dealname}`);
        }
      } catch (err) {
        console.error(`[Sync] Failed to sync advisor ${deal.id}:`, err);
      }
    }));
  }

  await setSyncState('advisor_sync', new Date().toISOString());
  console.log(`[Sync] Advisor sync complete: ${updated}/${deals.length} updated`);
  return updated;
}

// ── Sync Pipeline & Metrics (refresh the aggregate caches) ──────────────────

async function syncPipelineAndMetrics(): Promise<void> {
  console.log('[Sync] Refreshing pipeline and metrics caches...');

  const baseUrl = getAppUrl();

  // Hit the existing API endpoints to trigger cache refresh
  // The endpoints already handle withPgCache + Redis/S3 backfill
  const endpoints = [
    '/api/command-center/pipeline',
    '/api/command-center/metrics',
  ];

  await Promise.all(endpoints.map(async (endpoint) => {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const source = res.headers.get('X-Cache') || 'unknown';
      console.log(`[Sync] ${endpoint}: ${res.status} (source: ${source})`);
    } catch (err) {
      console.error(`[Sync] Failed to refresh ${endpoint}:`, err);
    }
  }));

  console.log('[Sync] Pipeline and metrics cache refresh complete');
}

// ── Sync Transitions (trigger Google Sheets incremental sync) ───────────────

async function syncTransitions(): Promise<void> {
  console.log('[Sync] Triggering transition sheet sync...');

  const baseUrl = getAppUrl();

  try {
    const res = await fetch(`${baseUrl}/api/command-center/transitions/sync`);
    if (res.ok) {
      const data = await res.json();
      console.log(`[Sync] Transitions synced: ${data.summary?.total_synced ?? 0} workbooks, ${data.summary?.total_rows ?? 0} rows`);

      // Invalidate cached transition queries so next user request gets fresh data
      await invalidatePattern('transitions:*');
    } else {
      console.error(`[Sync] Transition sync failed: ${res.status}`);
    }
  } catch (err) {
    console.error('[Sync] Transition sync failed:', err);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[Sync] ═══════════════════════════════════════════════════');
  console.log(`[Sync] Background sync started at ${new Date().toISOString()}`);
  console.log('[Sync] ═══════════════════════════════════════════════════');

  try {
    // Run all syncs in parallel (they are independent)
    await Promise.allSettled([
      syncAdvisors(),
      syncPipelineAndMetrics(),
      syncTransitions(),
    ]);

    await setSyncState('last_run', new Date().toISOString());
    console.log('[Sync] All syncs complete');
  } catch (err) {
    console.error('[Sync] Fatal error:', err);
  }

  // Close DB pool
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('[Sync] Unhandled error:', err);
  process.exit(1);
});
