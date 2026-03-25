import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withPgCache } from '@/lib/pg-cache';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const PIPELINE_ID = '751770';
const LAUNCHED_STAGE = '100411705';
const MANAGED_ACCOUNTS_OBJECT_TYPE = '2-13676628';

interface DealResult {
  properties: Record<string, string | null>;
}

// ── Fetch all pipeline deals (paginated) ────────────────────────────────────
async function fetchPipelineDeals(): Promise<DealResult[]> {
  const deals: DealResult[] = [];
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filterGroups: [{ filters: [{ propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID }] }],
      properties: [
        'dealname', 'transferable_aum', 'dealstage', 'actual_launch_date',
        'createdate', 'desired_start_date', 'transition_type', 'firm_type',
        'client_households',
      ],
      limit: 100,
    };
    if (after) body.after = after;

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`HubSpot ${res.status}: ${e}`); }
    const data = await res.json();
    deals.push(...(data.results ?? []));
    after = data.paging?.next?.after;
  } while (after);

  return deals;
}

// ── Fetch managed accounts totals ───────────────────────────────────────────
async function fetchManagedAccountsTotals(): Promise<{ totalAUM: number; totalRevenue: number; advisorCount: number }> {
  let totalAUM = 0;
  let weightedBpsSum = 0;
  const advisorNames = new Set<string>();
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filterGroups: [
        { filters: [{ propertyName: 'current_value', operator: 'HAS_PROPERTY' }] },
        { filters: [{ propertyName: 'bd_market_value', operator: 'HAS_PROPERTY' }] },
      ],
      properties: ['advisor_name', 'current_value', 'bd_market_value', 'fee_rate_bps'],
      limit: 100,
    };
    if (after) body.after = after;

    const res = await fetch(
      `https://api.hubapi.com/crm/v3/objects/${MANAGED_ACCOUNTS_OBJECT_TYPE}/search`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      console.error('[metrics] Failed to fetch managed accounts:', res.status);
      break;
    }
    const data = await res.json();

    for (const acct of data.results ?? []) {
      const advisorName = (acct.properties?.advisor_name ?? '').trim();
      const mv = parseFloat(acct.properties?.current_value ?? '0')
        || parseFloat(acct.properties?.bd_market_value ?? '0')
        || 0;
      const bps = parseFloat(acct.properties?.fee_rate_bps ?? '0') || 0;

      if (!advisorName || mv <= 0) continue;

      advisorNames.add(advisorName);
      totalAUM += mv;
      weightedBpsSum += mv * bps;
    }

    after = data.paging?.next?.after;
  } while (after);

  // Revenue = totalAUM * weighted avg bps / 10000
  const weightedAvgBps = totalAUM > 0 ? weightedBpsSum / totalAUM : 0;
  const totalRevenue = Math.round((totalAUM * weightedAvgBps) / 10000 * 100) / 100;

  return { totalAUM, totalRevenue, advisorCount: advisorNames.size };
}

// ── Fetch team role counts from DB ──────────────────────────────────────────
async function fetchTeamRoleCounts(): Promise<Record<string, number>> {
  const result = await pool.query(
    `SELECT role, COUNT(*)::int AS count FROM team_members WHERE active = TRUE GROUP BY role`
  );
  const map: Record<string, number> = {};
  for (const row of result.rows) {
    map[row.role] = row.count;
  }
  return map;
}

async function fetchMetricsData() {
  const [deals, teamRoles, managed] = await Promise.all([
    fetchPipelineDeals(),
    fetchTeamRoleCounts(),
    fetchManagedAccountsTotals(),
  ]);

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
  const firmTypeBreakdown: Record<string, number> = {};

  for (const deal of deals) {
    const t = deal.properties.transition_type ?? 'Not set';
    transitionBreakdown[t] = (transitionBreakdown[t] ?? 0) + 1;
    const s = deal.properties.dealstage ?? 'unknown';
    stageBreakdown[s] = (stageBreakdown[s] ?? 0) + 1;
    const f = deal.properties.firm_type ?? 'Not set';
    firmTypeBreakdown[f] = (firmTypeBreakdown[f] ?? 0) + 1;
  }

  let totalDaysToLaunch = 0;
  let launchDayCount = 0;
  for (const d of launched) {
    const launchDate = d.properties.actual_launch_date;
    const createDate = d.properties.createdate;
    if (launchDate && createDate) {
      const days = Math.floor(
        (new Date(launchDate).getTime() - new Date(createDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (days >= 0) { totalDaysToLaunch += days; launchDayCount++; }
    }
  }
  const avgDaysToLaunch = launchDayCount > 0 ? Math.round(totalDaysToLaunch / launchDayCount) : null;

  const totalHouseholds = launched.reduce((sum, d) => {
    return sum + (parseInt(d.properties.client_households ?? '0') || 0);
  }, 0);

  const totalLaunchedAUM = sumAUM(launched);
  const axStaff = (teamRoles['AXM'] ?? 0) + (teamRoles['AXA'] ?? 0);

  const onboardedThisMonth = launchedInWindow(startOfMonth);
  const onboardedThisQuarter = launchedInWindow(startOfQuarter);
  const onboardedThisYear = launchedInWindow(startOfYear);
  const pipeline30 = pipelineInWindow(day30);
  const pipeline60 = pipelineInWindow(day60);
  const pipeline90 = pipelineInWindow(day90);

  return {
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
    firmTypeBreakdown,
    capacity: {
      axStaff,
      platformAUM: managed.totalAUM,
      launchedAdvisors: launched.length,
      aumPerStaff: axStaff > 0 ? managed.totalAUM / axStaff : 0,
    },
    teamRoles,
    launchedStats: {
      totalRevenue: managed.totalRevenue,
      avgDaysToLaunch,
      totalHouseholds,
      totalLaunchedAUM,
    },
  };
}

export async function GET() {
  try {
    const { data, cached, stale } = await withPgCache(
      'metrics',
      fetchMetricsData,
      { ttlMs: 12 * 60 * 60 * 1000 } // 12 hours
    );
    const res = NextResponse.json(data);
    if (cached) res.headers.set('X-Cache', stale ? 'STALE' : 'HIT');
    return res;
  } catch (err) {
    console.error('[metrics]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
