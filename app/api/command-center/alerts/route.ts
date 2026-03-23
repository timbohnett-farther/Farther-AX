import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { ONBOARDING_TASKS, PHASE_META, calculateDueDate } from '@/lib/onboarding-tasks';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const PIPELINE_ID = '751770';
const ONBOARDING_STAGE_IDS = ['2496936', '100411705'];
const LAUNCHED_STAGE_ID = '100411705';
const MANAGED_ACCOUNTS_OBJECT_TYPE = '2-13676628';

interface HubSpotDeal {
  id: string;
  properties: Record<string, string | null>;
}

// ── HubSpot fetch helpers ───────────────────────────────────────────────────

async function fetchOnboardingDeals(): Promise<HubSpotDeal[]> {
  const deals: HubSpotDeal[] = [];
  let after: string | undefined;

  do {
    const body = {
      filterGroups: [{
        filters: [
          { propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID },
          { propertyName: 'dealstage', operator: 'IN', values: ONBOARDING_STAGE_IDS },
        ],
      }],
      properties: ['dealname', 'dealstage', 'closedate', 'desired_start_date', 'actual_launch_date', 'transferable_aum', 'transition_type'],
      limit: 100,
      ...(after ? { after } : {}),
    };

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) break;
    const data = await res.json();
    deals.push(...data.results);
    after = data.paging?.next?.after;
  } while (after);

  return deals;
}

async function fetchManagedAccountsByAdvisor(): Promise<Record<string, { totalMv: number; count: number }>> {
  const map: Record<string, { totalMv: number; count: number }> = {};
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filterGroups: [
        { filters: [{ propertyName: 'current_value', operator: 'HAS_PROPERTY' }] },
        { filters: [{ propertyName: 'bd_market_value', operator: 'HAS_PROPERTY' }] },
      ],
      properties: ['advisor_name', 'current_value', 'bd_market_value'],
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
    if (!res.ok) break;
    const data = await res.json();

    for (const acct of data.results ?? []) {
      const advisorName = (acct.properties?.advisor_name ?? '').trim();
      const mv = parseFloat(acct.properties?.current_value ?? '0')
        || parseFloat(acct.properties?.bd_market_value ?? '0')
        || 0;
      if (!advisorName || mv <= 0) continue;
      if (!map[advisorName]) map[advisorName] = { totalMv: 0, count: 0 };
      map[advisorName].totalMv += mv;
      map[advisorName].count += 1;
    }

    after = data.paging?.next?.after;
  } while (after);

  return map;
}

// ── AUM Pace targets (matches advisor-hub logic) ────────────────────────────

interface PaceTarget { days: number; expectedPct: number }

const PACE_TARGETS: Record<string, PaceTarget[]> = {
  'Master Merge': [{ days: 14, expectedPct: 95 }],
  'LPOA': [
    { days: 30, expectedPct: 60 },
    { days: 45, expectedPct: 80 },
    { days: 60, expectedPct: 90 },
  ],
  'Repaper': [{ days: 90, expectedPct: 90 }],
};

function evaluatePace(
  transferPct: number,
  daysSinceLaunch: number,
  transitionType: string | null,
): { status: 'on-track' | 'warning' | 'behind' | 'unknown'; expectedPct: number; deficit: number } {
  const targets = transitionType ? PACE_TARGETS[transitionType] : null;
  if (!targets || targets.length === 0) return { status: 'unknown', expectedPct: 0, deficit: 0 };

  // Find the relevant target
  let expectedPct = 0;
  for (const t of targets) {
    if (daysSinceLaunch <= t.days) {
      // Linear interpolation up to this target
      expectedPct = Math.round((daysSinceLaunch / t.days) * t.expectedPct);
      break;
    }
    expectedPct = t.expectedPct; // past this milestone, use its full target
  }

  const deficit = expectedPct - transferPct;
  if (deficit <= 5) return { status: 'on-track', expectedPct, deficit };
  if (deficit <= 15) return { status: 'warning', expectedPct, deficit };
  return { status: 'behind', expectedPct, deficit };
}

// ── Sentiment tier severity (for detecting negative shifts) ─────────────────

const TIER_RANK: Record<string, number> = {
  'Advocate': 5,
  'Positive': 4,
  'Neutral': 3,
  'At Risk': 2,
  'High Risk': 1,
};

// ── Alert types ─────────────────────────────────────────────────────────────

interface TaskAlert {
  type: 'task_overdue';
  deal_id: string;
  deal_name: string;
  task_key: string;
  task_label: string;
  phase: string;
  phase_label: string;
  owner: string;
  due_date: string;
  days_overdue: number;
  is_hard_gate: boolean;
}

interface SentimentAlert {
  type: 'sentiment_drop';
  deal_id: string;
  deal_name: string;
  previous_tier: string;
  current_tier: string;
  previous_score: number;
  current_score: number;
  score_change: number;
  changed_at: string;
}

interface AumAlert {
  type: 'aum_behind';
  deal_id: string;
  deal_name: string;
  transfer_pct: number;
  expected_pct: number;
  deficit: number;
  days_since_launch: number;
  transition_type: string;
  pace_status: 'warning' | 'behind';
  expected_aum: number;
  actual_aum: number;
}

type Alert = TaskAlert | SentimentAlert | AumAlert;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const alerts: Alert[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // Run all data fetches in parallel
  const [deals, completedResult, sentimentResult, managedAccounts] = await Promise.all([
    fetchOnboardingDeals(),
    pool.query(
      `SELECT deal_id, task_key FROM onboarding_tasks
       WHERE (is_legacy IS NULL OR is_legacy = FALSE) AND completed = TRUE`
    ),
    pool.query(
      `SELECT DISTINCT ON (h.deal_id)
         h.deal_id,
         s.deal_name,
         h.tier AS current_tier,
         h.composite_score AS current_score,
         h.scored_at AS changed_at,
         prev.tier AS previous_tier,
         prev.composite_score AS previous_score
       FROM advisor_sentiment_history h
       JOIN advisor_sentiment s ON s.deal_id = h.deal_id
       LEFT JOIN LATERAL (
         SELECT tier, composite_score
         FROM advisor_sentiment_history
         WHERE deal_id = h.deal_id AND scored_at < h.scored_at
         ORDER BY scored_at DESC
         LIMIT 1
       ) prev ON TRUE
       WHERE prev.tier IS NOT NULL
       ORDER BY h.deal_id, h.scored_at DESC`
    ),
    fetchManagedAccountsByAdvisor(),
  ]);

  // ── 1. Task overdue alerts ────────────────────────────────────────────────

  const completedSet = new Set<string>();
  for (const row of completedResult.rows) {
    completedSet.add(`${row.deal_id}:${row.task_key}`);
  }

  for (const deal of deals) {
    const name = deal.properties.dealname ?? 'Unknown';
    if (name.toLowerCase().includes('test')) continue;

    const day0_date = deal.properties.closedate || null;
    const launch_date = deal.properties.actual_launch_date || deal.properties.desired_start_date || null;

    for (const task of ONBOARDING_TASKS) {
      const dueDate = calculateDueDate(task, { day0_date, launch_date });
      if (!dueDate) continue;
      if (dueDate >= today) continue;
      if (completedSet.has(`${deal.id}:${task.key}`)) continue;

      const daysOverdue = Math.floor(
        (new Date(today).getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      alerts.push({
        type: 'task_overdue',
        deal_id: deal.id,
        deal_name: name,
        task_key: task.key,
        task_label: task.label,
        phase: task.phase,
        phase_label: PHASE_META[task.phase].label,
        owner: task.owner,
        due_date: dueDate,
        days_overdue: daysOverdue,
        is_hard_gate: task.is_hard_gate,
      });
    }
  }

  // ── 2. Sentiment drop alerts ──────────────────────────────────────────────

  for (const row of sentimentResult.rows) {
    const prevRank = TIER_RANK[row.previous_tier] ?? 3;
    const currRank = TIER_RANK[row.current_tier] ?? 3;

    // Alert if dropped to At Risk or High Risk from a better tier
    if (currRank <= 2 && prevRank > currRank) {
      alerts.push({
        type: 'sentiment_drop',
        deal_id: row.deal_id,
        deal_name: row.deal_name ?? 'Unknown',
        previous_tier: row.previous_tier,
        current_tier: row.current_tier,
        previous_score: parseFloat(row.previous_score),
        current_score: parseFloat(row.current_score),
        score_change: parseFloat(row.current_score) - parseFloat(row.previous_score),
        changed_at: row.changed_at?.toISOString?.() ?? '',
      });
    }
  }

  // ── 3. AUM pace alerts ────────────────────────────────────────────────────

  for (const deal of deals) {
    const name = deal.properties.dealname ?? 'Unknown';
    if (name.toLowerCase().includes('test')) continue;
    if (deal.properties.dealstage !== LAUNCHED_STAGE_ID) continue;

    const launchDate = deal.properties.actual_launch_date || deal.properties.desired_start_date;
    if (!launchDate) continue;

    const daysSinceLaunch = Math.floor((Date.now() - new Date(launchDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLaunch < 0 || daysSinceLaunch > 90) continue;

    const expectedAum = parseFloat(deal.properties.transferable_aum ?? '0') || 0;
    if (expectedAum <= 0) continue;

    const managed = managedAccounts[name];
    const actualAum = managed?.totalMv ?? 0;
    const transferPct = Math.round((actualAum / expectedAum) * 100);
    const transitionType = deal.properties.transition_type ?? null;

    const pace = evaluatePace(transferPct, daysSinceLaunch, transitionType);

    if (pace.status === 'warning' || pace.status === 'behind') {
      alerts.push({
        type: 'aum_behind',
        deal_id: deal.id,
        deal_name: name,
        transfer_pct: transferPct,
        expected_pct: pace.expectedPct,
        deficit: pace.deficit,
        days_since_launch: daysSinceLaunch,
        transition_type: transitionType ?? 'Unknown',
        pace_status: pace.status,
        expected_aum: expectedAum,
        actual_aum: actualAum,
      });
    }
  }

  // ── Summary counts ────────────────────────────────────────────────────────

  const taskAlerts = alerts.filter((a): a is TaskAlert => a.type === 'task_overdue');
  const sentimentAlerts = alerts.filter((a): a is SentimentAlert => a.type === 'sentiment_drop');
  const aumAlerts = alerts.filter((a): a is AumAlert => a.type === 'aum_behind');

  return NextResponse.json({
    total: alerts.length,
    counts: {
      task_overdue: taskAlerts.length,
      hard_gates: taskAlerts.filter(a => a.is_hard_gate).length,
      sentiment_drop: sentimentAlerts.length,
      aum_behind: aumAlerts.length,
      aum_critical: aumAlerts.filter(a => a.pace_status === 'behind').length,
    },
    alerts,
  });
}

export const dynamic = 'force-dynamic';
