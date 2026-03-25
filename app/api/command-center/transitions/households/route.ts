import { NextRequest, NextResponse } from 'next/server';
import { getHouseholdsByAdvisor } from '@/lib/household-aggregation';

export async function GET(req: NextRequest) {
  try {
    const advisor = req.nextUrl.searchParams.get('advisor') ?? undefined;
    const households = await getHouseholdsByAdvisor(advisor);
    return NextResponse.json({ households });
  } catch (err) {
    console.error('[transitions/households]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
