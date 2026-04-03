/**
 * Cache Health Check Endpoint
 *
 * GET /api/health/cache
 *
 * Reports the health of all cache layers:
 *   - Redis (L1 hot cache)
 *   - S3 Bucket (L2 warm cache)
 *   - PostgreSQL (L3 existing cache)
 *   - Last sync timestamp
 */

import { NextResponse } from 'next/server';
import { redisHealthCheck, getSyncState } from '@/lib/redis-client';
import { bucketHealthCheck } from '@/lib/bucket-client';
import { prisma } from '@/lib/prisma';
import pool from '@/lib/db';

export async function GET() {
  const status: Record<string, string | boolean | null> = {};

  // L1: Redis
  try {
    status.redis = await redisHealthCheck() ? 'healthy' : 'unavailable';
  } catch {
    status.redis = 'unhealthy';
  }

  // L2: S3 Bucket
  try {
    status.bucket = await bucketHealthCheck() ? 'healthy' : 'unavailable';
  } catch {
    status.bucket = 'unhealthy';
  }

  // L3: PostgreSQL
  try {
    await pool.query('SELECT 1');
    status.postgres = 'healthy';
  } catch {
    status.postgres = 'unhealthy';
  }

  // Sync state
  try {
    const lastRun = await getSyncState('last_run');
    status.lastSync = lastRun || 'never';

    const advisorSync = await getSyncState('advisor_sync');
    status.lastAdvisorSync = advisorSync || 'never';
  } catch {
    status.lastSync = 'unknown';
    status.lastAdvisorSync = 'unknown';
  }

  // PostgreSQL cache stats
  try {
    const cacheStats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE expires_at > NOW()) as fresh,
        COUNT(*) FILTER (WHERE expires_at <= NOW()) as stale
      FROM api_cache
    `);
    const row = cacheStats.rows[0];
    status.pgCacheTotal = row.total;
    status.pgCacheFresh = row.fresh;
    status.pgCacheStale = row.stale;
  } catch {
    status.pgCacheTotal = 'unknown';
  }

  // Advisor profiles count (Prisma)
  try {
    const advisorCount = await prisma.advisor.count();
    status.advisorProfilesCached = advisorCount;
  } catch {
    status.advisorProfilesCached = 'unknown';
  }

  const allHealthy =
    status.redis !== 'unhealthy' &&
    status.bucket !== 'unhealthy' &&
    status.postgres === 'healthy';

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      layers: {
        redis: status.redis,
        bucket: status.bucket,
        postgres: status.postgres,
      },
      sync: {
        lastRun: status.lastSync,
        lastAdvisorSync: status.lastAdvisorSync,
      },
      cache: {
        pgTotal: status.pgCacheTotal,
        pgFresh: status.pgCacheFresh,
        pgStale: status.pgCacheStale,
        advisorProfiles: status.advisorProfilesCached,
      },
    },
    { status: allHealthy ? 200 : 503 }
  );
}

export const dynamic = 'force-dynamic';
