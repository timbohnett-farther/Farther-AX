// app/api/scheduler/tick/route.ts — Railway cron endpoint
// Called every 5 minutes: GET /api/scheduler/tick?secret=CRON_SECRET

import { NextRequest, NextResponse } from 'next/server';
import { runSchedulerTick } from '@/lib/agents/scheduler';

const CRON_SECRET = process.env.CRON_SECRET || '';

export async function GET(req: NextRequest) {
  // Validate cron secret
  const secret = req.nextUrl.searchParams.get('secret');
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runSchedulerTick();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Scheduler Tick] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minute max for cron execution
