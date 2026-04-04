import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redisHealthCheck } from '@/lib/redis-client';

/**
 * Health check endpoint for Railway deployment verification.
 * Tests actual database connectivity — returns 503 if DB is down.
 * Excluded from NextAuth middleware (publicly accessible).
 */
export async function GET() {
  const status: {
    ok: boolean;
    status: string;
    timestamp: string;
    database: { connected: boolean; error?: string };
    redis: { connected: boolean; configured: boolean };
    env: Record<string, boolean | string>;
  } = {
    ok: false,
    status: 'unhealthy',
    timestamp: new Date().toISOString(),
    database: { connected: false },
    redis: { connected: false, configured: !!process.env.REDIS_URL },
    env: {
      node_version: process.version,
      node_env: process.env.NODE_ENV || 'development',
      database_url: !!process.env.DATABASE_URL,
      redis_url: !!process.env.REDIS_URL,
      nextauth: !!process.env.NEXTAUTH_URL && !!process.env.NEXTAUTH_SECRET,
    },
  };

  // Test actual database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    status.database.connected = true;
  } catch (err) {
    status.database.connected = false;
    status.database.error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(status, { status: 503 });
  }

  // Test Redis connectivity (non-blocking — app is healthy even without Redis)
  try {
    status.redis.connected = await redisHealthCheck();
  } catch {
    status.redis.connected = false;
  }

  status.ok = true;
  status.status = status.redis.connected ? 'healthy' : 'healthy (redis degraded)';

  return NextResponse.json(status);
}

export const dynamic = 'force-dynamic';

