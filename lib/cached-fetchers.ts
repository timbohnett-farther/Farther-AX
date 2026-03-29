/**
 * Cached Fetchers — Redis → S3 Bucket → Origin waterfall
 *
 * Wraps EXISTING fetch logic with a two-tier cache.
 * Does NOT modify what data is fetched, how it is fetched, or its shape.
 *
 * Cache read path:
 *   1. Redis (L1, 5-min TTL, sub-ms reads)
 *   2. S3 Bucket (L2, durable, survives Redis eviction)
 *   3. Origin (existing PostgreSQL/HubSpot/Sheets logic — UNCHANGED)
 *
 * On cache miss at any level, the result is backfilled into all faster layers.
 */

import { getFromRedis, setInRedis, type CacheNamespace } from './redis-client';
import { getFromBucket, putToBucket } from './bucket-client';

// ── Cache source tracking ───────────────────────────────────────────────────

export type CacheSource = 'redis' | 'bucket' | 'origin';

export interface CachedResult<T> {
  data: T;
  source: CacheSource;
}

// ── Generic cache-through fetcher ───────────────────────────────────────────

/**
 * Generic cache-through function that implements the waterfall pattern.
 *
 * @param namespace  Redis TTL namespace (advisor, pipeline, metrics, transitions)
 * @param id         Unique identifier for this data (deal ID, cache key, etc.)
 * @param fetcher    The EXISTING fetch function — called IDENTICALLY to today
 * @returns          The same data the frontend already consumes, from the fastest source
 */
export async function getCached<T>(
  namespace: CacheNamespace,
  id: string,
  fetcher: () => Promise<T>
): Promise<CachedResult<T>> {
  // L1: Redis hot cache
  try {
    const redisHit = await getFromRedis<T>(namespace, id);
    if (redisHit) {
      return { data: redisHit, source: 'redis' };
    }
  } catch {
    // Redis unavailable — continue to L2
  }

  // L2: S3 Bucket warm cache
  try {
    const bucketHit = await getFromBucket<T>(namespace, id);
    if (bucketHit) {
      // Backfill Redis for next request (non-blocking)
      setInRedis(namespace, id, bucketHit).catch(() => {});
      return { data: bucketHit, source: 'bucket' };
    }
  } catch {
    // Bucket unavailable — continue to origin
  }

  // L3: Origin — call the EXISTING fetch function, UNCHANGED
  const freshData = await fetcher();

  // Backfill both cache layers (non-blocking)
  Promise.all([
    putToBucket(namespace, id, freshData).catch(() => {}),
    setInRedis(namespace, id, freshData).catch(() => {}),
  ]).catch(() => {});

  return { data: freshData, source: 'origin' };
}

/**
 * Write-through: update cache layers when data changes.
 * Called by webhook handlers and background sync workers.
 */
export async function writeThroughCache<T>(
  namespace: CacheNamespace,
  id: string,
  data: T
): Promise<void> {
  await Promise.all([
    setInRedis(namespace, id, data).catch(() => {}),
    putToBucket(namespace, id, data).catch(() => {}),
  ]);
}

/**
 * Invalidate a cached entry across all layers.
 * Forces the next read to go to origin.
 */
export async function invalidateCache(
  namespace: CacheNamespace,
  id: string
): Promise<void> {
  const { invalidateRedis } = await import('./redis-client');
  const { deleteFromBucket } = await import('./bucket-client');

  await Promise.all([
    invalidateRedis(namespace, id).catch(() => {}),
    deleteFromBucket(namespace, id).catch(() => {}),
  ]);
}
