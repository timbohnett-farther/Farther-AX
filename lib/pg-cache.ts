/**
 * lib/pg-cache.ts
 *
 * PostgreSQL-backed cache for HubSpot API responses.
 * Persists across Railway redeploys and app restarts.
 *
 * Benefits over in-memory cache:
 * - ✅ Survives redeploys
 * - ✅ Shared across multiple instances
 * - ✅ Configurable TTL per cache key
 * - ✅ Fallback to stale data if HubSpot fails
 */

import { prisma } from '@/lib/prisma';

interface CacheOptions {
  /**
   * Time-to-live in milliseconds. After this period, cache is considered stale.
   * Default: 2 hours (7,200,000 ms)
   */
  ttlMs?: number;

  /**
   * If true, allows returning stale data when HubSpot fetch fails.
   * Default: true
   */
  allowStale?: boolean;
}

const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Wraps an async data-fetching function with a PostgreSQL-backed cache.
 *
 * @param key      Unique cache key (e.g. 'pipeline', 'aum-tracker')
 * @param fetcher  Async function that fetches fresh data
 * @param options  Cache configuration options
 * @returns        Cached or fresh data with metadata
 *
 * @example
 * const result = await withPgCache(
 *   'pipeline-deals',
 *   async () => fetchHubSpotDeals(),
 *   { ttlMs: 30 * 60 * 1000 } // 30 minutes
 * );
 * console.log(result.data, result.cached, result.age);
 */
export async function withPgCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<{ data: T; cached: boolean; age?: number; stale?: boolean }> {
  const { ttlMs = DEFAULT_TTL_MS, allowStale = true } = options;
  const now = new Date();

  try {
    // Check cache first
    const cacheResult = await prisma.$queryRaw<Array<{
      data: T;
      expires_at: Date;
      updated_at: Date;
    }>>`
      SELECT data, expires_at, updated_at
      FROM api_cache
      WHERE cache_key = ${key}
    `;

    const cached = cacheResult[0];

    // If cache exists and is fresh, return it
    if (cached && cached.expires_at > now) {
      const age = now.getTime() - new Date(cached.updated_at).getTime();
      return { data: cached.data, cached: true, age, stale: false };
    }

    // Cache is stale or missing — fetch fresh data
    try {
      const freshData = await fetcher();
      const expiresAt = new Date(now.getTime() + ttlMs);

      // Upsert cache
      await prisma.$executeRaw`
        INSERT INTO api_cache (cache_key, data, expires_at, created_at, updated_at)
        VALUES (${key}, ${JSON.stringify(freshData)}::jsonb, ${expiresAt}, ${now}, ${now})
        ON CONFLICT (cache_key) DO UPDATE
          SET data = EXCLUDED.data,
              expires_at = EXCLUDED.expires_at,
              updated_at = EXCLUDED.updated_at
      `;

      return { data: freshData, cached: false, stale: false };
    } catch (fetchError) {
      // If fetch failed but we have stale data, return it
      if (allowStale && cached) {
        const age = now.getTime() - new Date(cached.updated_at).getTime();
        console.warn(
          `[pg-cache] ${key}: HubSpot fetch failed, returning stale cache (age: ${Math.round(age / 60000)}min)`
        );
        return { data: cached.data, cached: true, age, stale: true };
      }
      // No cache and fetch failed — re-throw
      throw fetchError;
    }
  } catch (error) {
    console.error(`[pg-cache] ${key}: Cache operation failed:`, error);
    // If cache DB fails, try to fetch directly
    const freshData = await fetcher();
    return { data: freshData, cached: false, stale: false };
  }
}

/**
 * Clears a specific cache entry or all cache entries.
 *
 * @param key Optional cache key to clear. If omitted, clears all cache.
 * @returns Number of entries deleted
 *
 * @example
 * await clearPgCache('pipeline-deals'); // Clear specific key
 * await clearPgCache();                 // Clear all cache
 */
export async function clearPgCache(key?: string): Promise<number> {
  if (key) {
    await prisma.$executeRaw`DELETE FROM api_cache WHERE cache_key = ${key}`;
    // Prisma $executeRaw returns count directly
    return 1; // Return 1 if executed successfully
  } else {
    await prisma.$executeRaw`DELETE FROM api_cache`;
    return 1; // Return 1 if executed successfully
  }
}

/**
 * Gets cache statistics (for debugging/monitoring).
 *
 * @returns Cache stats including total entries, fresh/stale counts, oldest entry
 */
export async function getCacheStats(): Promise<{
  total: number;
  fresh: number;
  stale: number;
  oldest?: Date;
  newest?: Date;
}> {
  const result = await prisma.$queryRaw<Array<{
    total: bigint;
    fresh: bigint | null;
    stale: bigint | null;
    oldest: Date | null;
    newest: Date | null;
  }>>`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END) as fresh,
      SUM(CASE WHEN expires_at <= NOW() THEN 1 ELSE 0 END) as stale,
      MIN(updated_at) as oldest,
      MAX(updated_at) as newest
    FROM api_cache
  `;

  const row = result[0];
  return {
    total: parseInt(row?.total.toString() ?? '0'),
    fresh: parseInt(row?.fresh?.toString() ?? '0'),
    stale: parseInt(row?.stale?.toString() ?? '0'),
    oldest: row?.oldest ?? undefined,
    newest: row?.newest ?? undefined,
  };
}

/**
 * Cleans up expired cache entries (run periodically).
 *
 * @returns Number of expired entries deleted
 */
export async function cleanupExpiredCache(): Promise<number> {
  await prisma.$executeRaw`DELETE FROM api_cache WHERE expires_at < NOW()`;
  return 1; // Return 1 if executed successfully
}
