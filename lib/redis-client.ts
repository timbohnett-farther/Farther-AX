/**
 * Redis Hot Cache — L1 cache layer (sub-millisecond reads)
 *
 * Generic storage wrapper. Does NOT interpret, filter, or restructure data.
 * Stores and retrieves whatever JSON is given to it.
 *
 * Requires REDIS_URL environment variable (Railway Redis variable reference).
 * Gracefully degrades if Redis is unavailable — returns null on miss.
 */

import Redis from 'ioredis';

// ── Connection ──────────────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL;

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 100, 2000);
      },
      connectTimeout: 5000,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('[redis-client] Connection error:', err.message);
    });
  }
  return redis;
}

// ── TTL Constants ───────────────────────────────────────────────────────────

const TTL = {
  advisor: 300,        // 5 minutes
  pipeline: 600,       // 10 minutes
  metrics: 600,        // 10 minutes
  transitions: 600,    // 10 minutes
  advisorList: 300,    // 5 minutes
} as const;

export type CacheNamespace = keyof typeof TTL;

// ── Generic Operations ──────────────────────────────────────────────────────

export async function getFromRedis<T>(
  namespace: CacheNamespace,
  id: string
): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const key = `${namespace}:${id}`;
    const cached = await client.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error(`[redis-client] GET ${namespace}:${id} failed:`, err);
    return null;
  }
}

export async function setInRedis<T>(
  namespace: CacheNamespace,
  id: string,
  data: T
): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const key = `${namespace}:${id}`;
    const ttl = TTL[namespace];
    await client.setex(key, ttl, JSON.stringify(data));
  } catch (err) {
    console.error(`[redis-client] SET ${namespace}:${id} failed:`, err);
  }
}

export async function invalidateRedis(
  namespace: CacheNamespace,
  id: string
): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(`${namespace}:${id}`);
  } catch (err) {
    console.error(`[redis-client] DEL ${namespace}:${id} failed:`, err);
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (err) {
    console.error(`[redis-client] DEL pattern ${pattern} failed:`, err);
  }
}

// ── Health Check ────────────────────────────────────────────────────────────

export async function redisHealthCheck(): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

// ── Sync State (for background worker) ──────────────────────────────────────

export async function getSyncState(key: string): Promise<string | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    return await client.get(`sync:${key}`);
  } catch {
    return null;
  }
}

export async function setSyncState(key: string, value: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.set(`sync:${key}`, value);
  } catch (err) {
    console.error(`[redis-client] SET sync:${key} failed:`, err);
  }
}

// ── Export raw client for advanced operations ───────────────────────────────

export { getRedis, TTL };
