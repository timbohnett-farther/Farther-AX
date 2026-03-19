import { NextResponse } from 'next/server';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN!;
const PIPELINE_ID = '751770';
const LAUNCHED_STAGE = '100411705';

export async function GET() {
  try {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID }] }],
        properties: ['dealname', 'transferable_aum', 'dealstage', 'actual_launch_date', 'desired_start_date', 'transition_type', 'firm_type'],
        limit: 200,
      }),
    });
    if (!res.ok) throw new Error('HubSpot error');
    const data = await res.json();
    const deals = data.results as Array<{ properties: Record<string, string | null> }>;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const sumAUM = (list: typeof deals) =>
      list.reduce((acc, d) => acc + parseFloat(d.properties.transferable_aum ?? '0'), 0);

    const launched = deals.filter(d => d.properties.dealstage === LAUNCHED_STAGE);

    const launchedInWindow = (start: Date) =>
      launched.filter(d => {
        const date = d.properties.actual_launch_date ? new Date(d.properties.actual_launch_date) : null;
        return date && date >= start;
      });

    const day30 = new Date(now); day30.setDate(day30.getDate() + 30);
    const day60 = new Date(now); day60.setDate(day60.getDate() + 60);
    const day90 = new Date(now); day90.setDate(day90.getDate() + 90);

    const pipelineInWindow = (end: Date) =>
      deals.filter(d => {
        const date = d.properties.desired_start_date ? new Date(d.properties.desired_start_date) : null;
        return date && date <= end && d.properties.dealstage !== LAUNCHED_STAGE;
      });

    const transitionBreakdown: Record<string, number> = {};
    const stageBreakdown: Record<string, number> = {};
    for (const deal of deals) {
      const t = deal.properties.transition_type ?? 'Not set';
      transitionBreakdown[t] = (transitionBreakdown[t] ?? 0) + 1;
      const s = deal.properties.dealstage ?? 'unknown';
      stageBreakdown[s] = (stageBreakdown[s] ?? 0) + 1;
    }

    const onboardedThisMonth = launchedInWindow(startOfMonth);
    const onboardedThisQuarter = launchedInWindow(startOfQuarter);
    const onboardedThisYear = launchedInWindow(startOfYear);
    const pipeline30 = pipelineInWindow(day30);
    const pipeline60 = pipelineInWindow(day60);
    const pipeline90 = pipelineInWindow(day90);

    return NextResponse.json({
      totalPipelineAUM: sumAUM(deals),
      totalDeals: deals.length,
      launched: { count: launched.length, aum: sumAUM(launched) },
      onboardedThisMonth: { count: onboardedThisMonth.length, aum: sumAUM(onboardedThisMonth) },
      onboardedThisQuarter: { count: onboardedThisQuarter.length, aum: sumAUM(onboardedThisQuarter) },
      onboardedThisYear: { count: onboardedThisYear.length, aum: sumAUM(onboardedThisYear) },
      pipeline30: { count: pipeline30.length, aum: sumAUM(pipeline30) },
      pipeline60: { count: pipeline60.length, aum: sumAUM(pipeline60) },
      pipeline90: { count: pipeline90.length, aum: sumAUM(pipeline90) },
      transitionBreakdown,
      stageBreakdown,
      capacity: { axmCount: 9, totalAUM: 15_000_000_000, advisorCount: 240 },
    });
  } catch (err) {
    console.error('[metrics]', err);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
