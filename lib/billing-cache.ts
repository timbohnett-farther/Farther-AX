/**
 * lib/billing-cache.ts
 *
 * PostgreSQL-backed cache for commission/billing API responses.
 * Similar to pg-cache.ts but uses the billing DB connection.
 *
 * Benefits:
 * - ✅ Survives redeploys
 * - ✅ Shared across multiple instances
 * - ✅ Configurable TTL per cache key
 * - ✅ Fallback to stale data on failure
 */

import { billingQuery, billingQueryOne } from '@/lib/billing-db';

interface CacheOptions {
  /**
   * Time-to-live in milliseconds. After this period, cache is considered stale.
   * Default: 1 hour (3,600,000 ms)
   */
  ttlMs?: number;

  /**
   * If true, allows returning stale data when fetch fails.
   * Default: true
   */
  allowStale?: boolean;
}

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Wraps an async data-fetching function with a PostgreSQL-backed cache.
 *
 * @param key      Unique cache key (e.g. 'commission-summary')
 * @param fetcher  Async function that fetches fresh data
 * @param options  Cache configuration options
 * @returns        Cached or fresh data with metadata
 *
 * @example
 * const result = await withBillingCache(
 *   'commission-summary',
 *   async () => fetchCommissionData(),
 *   { ttlMs: 60 * 60 * 1000 } // 1 hour
 * );
 */
export async function withBillingCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<{ data: T; cached: boolean; age?: number; stale?: boolean }> {
  const { ttlMs = DEFAULT_TTL_MS, allowStale = true } = options;
  const now = new Date();

  try {
    // Check cache first
    const cached = await billingQueryOne<{
      data: T;
      expires_at: Date;
      updated_at: Date;
    }>(
      `SELECT data, expires_at, updated_at
       FROM api_cache
       WHERE cache_key = $1`,
      [key]
    );

    // If cache exists and is fresh, return it
    if (cached && new Date(cached.expires_at) > now) {
      const age = now.getTime() - new Date(cached.updated_at).getTime();
      return { data: cached.data, cached: true, age, stale: false };
    }

    // Cache is stale or missing — fetch fresh data
    try {
      const freshData = await fetcher();
      const expiresAt = new Date(now.getTime() + ttlMs);

      // Upsert cache
      await billingQuery(
        `INSERT INTO api_cache (cache_key, data, expires_at, created_at, updated_at)
         VALUES ($1, $2::jsonb, $3, $4, $5)
         ON CONFLICT (cache_key) DO UPDATE
           SET data = EXCLUDED.data,
               expires_at = EXCLUDED.expires_at,
               updated_at = EXCLUDED.updated_at`,
        [key, JSON.stringify(freshData), expiresAt, now, now]
      );

      return { data: freshData, cached: false, stale: false };
    } catch (fetchError) {
      // If fetch failed but we have stale data, return it
      if (allowStale && cached) {
        const age = now.getTime() - new Date(cached.updated_at).getTime();
        console.warn(
          `[billing-cache] ${key}: Fetch failed, returning stale cache (age: ${Math.round(age / 60000)}min)`
        );
        return { data: cached.data, cached: true, age, stale: true };
      }
      // No cache and fetch failed — re-throw
      throw fetchError;
    }
  } catch (error) {
    console.error(`[billing-cache] ${key}: Cache operation failed:`, error);
    // If cache DB fails, try to fetch directly
    const freshData = await fetcher();
    return { data: freshData, cached: false, stale: false };
  }
}

/**
 * Clears a specific cache entry or all commission cache entries.
 *
 * @param key Optional cache key to clear. If omitted, clears all commission-* keys.
 * @returns Number of entries deleted
 */
export async function clearBillingCache(key?: string): Promise<number> {
  if (key) {
    const result = await billingQuery(
      `DELETE FROM api_cache WHERE cache_key = $1`,
      [key]
    );
    return result.length;
  } else {
    const result = await billingQuery(
      `DELETE FROM api_cache WHERE cache_key LIKE 'commission-%'`
    );
    return result.length;
  }
}
