import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { clearPgCache, getCacheStats, cleanupExpiredCache } from '@/lib/pg-cache';

/**
 * Cache Management API
 *
 * GET  /api/command-center/cache        - Get cache statistics
 * POST /api/command-center/cache        - Clear cache or cleanup expired entries
 */

// GET: Get cache statistics
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const stats = await getCacheStats();
    return NextResponse.json({
      ...stats,
      message: `Cache contains ${stats.total} entries (${stats.fresh} fresh, ${stats.stale} stale)`,
    });
  } catch (err) {
    console.error('[cache] Failed to get stats:', err);
    return NextResponse.json(
      { error: 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}

// POST: Clear cache or cleanup expired entries
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json() as { action?: string; key?: string };
    const { action, key } = body;

    if (action === 'cleanup') {
      // Clean up expired entries
      const deleted = await cleanupExpiredCache();
      return NextResponse.json({
        success: true,
        deleted,
        message: `Cleaned up ${deleted} expired cache entries`,
      });
    } else {
      // Clear cache (all or specific key)
      const deleted = await clearPgCache(key);
      return NextResponse.json({
        success: true,
        deleted,
        message: key
          ? `Cleared cache for key: ${key}`
          : `Cleared all cache (${deleted} entries)`,
      });
    }
  } catch (err) {
    console.error('[cache] Cache operation failed:', err);
    return NextResponse.json(
      { error: 'Cache operation failed' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
