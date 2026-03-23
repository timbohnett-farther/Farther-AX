import { NextResponse } from 'next/server';
import { clearCache } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

// POST /api/command-center/cache — clears the server-side HubSpot cache
export async function POST() {
  clearCache();
  return NextResponse.json({ cleared: true, timestamp: new Date().toISOString() });
}
