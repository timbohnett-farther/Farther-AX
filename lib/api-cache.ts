/**
 * lib/api-cache.ts
 *
 * Server-side in-memory cache for HubSpot API responses.
 * - 8-hour TTL (refreshes ~3x per day)
 * - If HubSpot fails, returns the last good cached response (stale fallback)
 * - Prevents "Failed to load" errors when HubSpot is slow or rate-limited
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

/**
 * Wraps an async data-fetching function with an in-memory cache.
 *
 * @param key    Unique cache key (e.g. 'pipeline', 'aum-tracker')
 * @param fetcher Async function that fetches fresh data
 * @param ttlMs  Cache TTL in milliseconds (default: 8 hours)
 * @returns      Cached or fresh data
 */
/** Clear all cached entries (used by cache-bust endpoint) */
export function clearCache() {
  cache.clear();
}

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = EIGHT_HOURS_MS
): Promise<{ data: T; cached: boolean; age?: number }> {
  const now = Date.now();
  const existing = cache.get(key) as CacheEntry<T> | undefined;

  // If cache is fresh, return it immediately
  if (existing && (now - existing.timestamp) < ttlMs) {
    return { data: existing.data, cached: true, age: now - existing.timestamp };
  }

  // Cache is stale or missing — try to fetch fresh data
  try {
    const freshData = await fetcher();
    cache.set(key, { data: freshData, timestamp: now });
    return { data: freshData, cached: false };
  } catch (err) {
    // If fetch failed but we have stale data, return it instead of erroring
    if (existing) {
      console.warn(`[api-cache] ${key}: HubSpot fetch failed, returning stale cache (age: ${Math.round((now - existing.timestamp) / 60000)}min)`);
      return { data: existing.data, cached: true, age: now - existing.timestamp };
    }
    // No cache at all — re-throw so the route can handle it
    throw err;
  }
}
