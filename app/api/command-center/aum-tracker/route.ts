/**
 * app/api/command-center/aum-tracker/route.ts
 *
 * GET /api/command-center/aum-tracker
 *
 * For each launched advisor (Step 7), fetches:
 *   - Expected AUM from the deal record (transferable_aum)
 *   - Actual AUM (Est. Market Value → current_value) from the Farther Managed Accounts custom object
 *   - Fee Rate BPS from the same managed accounts
 *   - Revenue = BD Market Value × Fee Rate BPS / 10,000
 *
 * Managed Accounts are aggregated per advisor by matching advisor_name
 * on the custom object to dealname on the deal.
 */

import { NextResponse } from 'next/server';
import { withPgCache } from '@/lib/pg-cache';

export const dynamic = 'force-dynamic';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const PIPELINE_ID = '751770';
const LAUNCHED_STAGE_ID = '100411705';
const MANAGED_ACCOUNTS_OBJECT_TYPE = '2-13676628';

interface DealResult {
  id: string;
  properties: Record<string, string | null>;
}

interface ManagedAccountAgg {
  total_bd_market_value: number;
  // Weighted average fee rate: sum(mv * bps) / sum(mv)
  weighted_fee_bps: number;
  account_count: number;
}

// ── Step 1: Fetch all launched deals ─────────────────────────────────────────
async function fetchLaunchedDeals(): Promise<DealResult[]> {
  const deals: DealResult[] = [];
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filterGroups: [{
        filters: [
          { propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID },
          { propertyName: 'dealstage', operator: 'EQ', value: LAUNCHED_STAGE_ID },
        ],
      }],
      properties: [
        'dealname', 'transferable_aum', 'aum', 'initial_aum', 'book_assets',
        'actual_launch_date', 'desired_start_date', 'client_households',
        'transferable_households', 'current_firm__cloned_', 'transition_type',
      ],
      sorts: [{ propertyName: 'dealname', direction: 'ASCENDING' }],
      limit: 100,
    };
    if (after) body.after = after;

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) break;
    const data = await res.json();
    deals.push(...(data.results ?? []));
    after = data.paging?.next?.after;
  } while (after);

  return deals;
}

// ── Step 2: Fetch ALL Farther Managed Accounts and aggregate by advisor ─────
async function fetchManagedAccountsByAdvisor(): Promise<Record<string, ManagedAccountAgg>> {
  const map: Record<string, { totalMv: number; weightedBpsSum: number; count: number }> = {};
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
      console.error('[aum-tracker] Failed to fetch managed accounts:', res.status, await res.text().catch(() => ''));
      break;
    }
    const data = await res.json();

    for (const acct of data.results ?? []) {
      const advisorName = (acct.properties?.advisor_name ?? '').trim();
      // Prefer Est. Market Value (current_value), fall back to BD Market Value
      const mv = parseFloat(acct.properties?.current_value ?? '0')
        || parseFloat(acct.properties?.bd_market_value ?? '0')
        || 0;
      const bps = parseFloat(acct.properties?.fee_rate_bps ?? '0') || 0;

      if (!advisorName || mv <= 0) continue;

      if (!map[advisorName]) {
        map[advisorName] = { totalMv: 0, weightedBpsSum: 0, count: 0 };
      }
      map[advisorName].totalMv += mv;
      map[advisorName].weightedBpsSum += mv * bps; // for weighted average
      map[advisorName].count += 1;
    }

    after = data.paging?.next?.after;
  } while (after);

  // Convert to final aggregation
  const result: Record<string, ManagedAccountAgg> = {};
  for (const [name, agg] of Object.entries(map)) {
    result[name] = {
      total_bd_market_value: agg.totalMv,
      weighted_fee_bps: agg.totalMv > 0
        ? Math.round((agg.weightedBpsSum / agg.totalMv) * 100) / 100
        : 0,
      account_count: agg.count,
    };
  }
  return result;
}

// ── Fresh data fetcher (called by cache on miss) ─────────────────────────────
async function fetchAumData(includeAll: boolean) {
  const [deals, managedAccounts] = await Promise.all([
    fetchLaunchedDeals(),
    fetchManagedAccountsByAdvisor(),
  ]);

  const advisors = deals.map(deal => {
    const dealName = deal.properties.dealname ?? '—';
    const managed = managedAccounts[dealName] ?? null;

    const expectedAum = parseFloat(deal.properties.transferable_aum ?? '0') || null;
    const actualAum = managed?.total_bd_market_value ?? null;
    const feeRateBps = managed?.weighted_fee_bps ?? null;
    const launchDate = deal.properties.actual_launch_date || deal.properties.desired_start_date;

    let transferPct: number | null = null;
    if (expectedAum && actualAum && expectedAum > 0) {
      transferPct = Math.round((actualAum / expectedAum) * 100);
    }

    let currentRevenue: number | null = null;
    if (actualAum && feeRateBps && feeRateBps > 0) {
      currentRevenue = Math.round((actualAum * feeRateBps) / 10000 * 100) / 100;
    }

    let daysSinceLaunch: number | null = null;
    if (launchDate) {
      daysSinceLaunch = Math.floor((Date.now() - new Date(launchDate).getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      deal_id: deal.id,
      advisor_name: dealName,
      expected_aum: expectedAum,
      actual_aum: actualAum,
      transfer_pct: transferPct,
      fee_rate_bps: feeRateBps,
      current_revenue: currentRevenue,
      launch_date: launchDate ?? null,
      days_since_launch: daysSinceLaunch,
      prior_firm: deal.properties.current_firm__cloned_ ?? null,
      households: deal.properties.client_households ? parseInt(deal.properties.client_households) : null,
      transition_type: deal.properties.transition_type ?? null,
      managed_account_count: managed?.account_count ?? 0,
    };
  });

  const GRADUATION_DAYS = 90;
  const filtered = advisors.filter(a => {
    if (a.advisor_name.toLowerCase().includes('test')) return false;
    if (includeAll) return true;
    return a.days_since_launch === null || a.days_since_launch <= GRADUATION_DAYS;
  });

  filtered.sort((a, b) => {
    const lastA = (a.advisor_name.split(/\s+/).pop() ?? '').toLowerCase();
    const lastB = (b.advisor_name.split(/\s+/).pop() ?? '').toLowerCase();
    return lastA.localeCompare(lastB);
  });

  const withExpected = filtered.filter(a => a.expected_aum);
  const withActual = filtered.filter(a => a.actual_aum);
  const totalExpected = withExpected.reduce((sum, a) => sum + (a.expected_aum ?? 0), 0);
  const totalActual = withActual.reduce((sum, a) => sum + (a.actual_aum ?? 0), 0);
  const totalRevenue = filtered.reduce((sum, a) => sum + (a.current_revenue ?? 0), 0);

  return {
    advisors: filtered,
    total: filtered.length,
    summary: {
      total_expected_aum: totalExpected,
      total_actual_aum: totalActual,
      overall_transfer_pct: totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : null,
      advisors_with_expected: withExpected.length,
      advisors_with_actual: withActual.length,
      total_current_revenue: totalRevenue,
    },
  };
}

// ── GET handler (PostgreSQL-cached — 12hr TTL, stale fallback on HubSpot errors) ─
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeAll = searchParams.get('all') === 'true';
  const cacheKey = includeAll ? 'aum-tracker-all' : 'aum-tracker';
  try {
    const { data, cached, stale } = await withPgCache(
      cacheKey,
      () => fetchAumData(includeAll),
      { ttlMs: 12 * 60 * 60 * 1000 } // 12 hours
    );
    const res = NextResponse.json(data);
    if (cached) res.headers.set('X-Cache', stale ? 'STALE' : 'HIT');
    return res;
  } catch (err) {
    console.error('[aum-tracker]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
