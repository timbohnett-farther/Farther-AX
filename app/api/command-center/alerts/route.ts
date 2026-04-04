import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { TASKS } from '@/lib/onboarding-tasks-v2';
import { calculateDueDate, getDay0Date, getLaunchDate } from '@/lib/due-date-calculator';
import { calculateTaskStatus, getTaskResponsiblePerson, formatTaskAlert, type TaskAlert as TaskAlertType, type ResponsiblePerson } from '@/lib/task-status';
import { withPgCache } from '@/lib/pg-cache';

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

// ── Cached wrappers for HubSpot fetches ─────────────────────────────────────

async function getCachedOnboardingDeals(): Promise<HubSpotDeal[]> {
  const result = await withPgCache('alerts-deals', fetchOnboardingDeals, { ttlMs: 15 * 60 * 1000 });
  return result.data;
}

async function getCachedManagedAccounts(): Promise<Record<string, { totalMv: number; count: number }>> {
  const result = await withPgCache('alerts-managed-accounts', fetchManagedAccountsByAdvisor, { ttlMs: 15 * 60 * 1000 });
  return result.data;
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
  type: 'task_overdue' | 'task_critical';
  deal_id: string;
  deal_name: string;
  task_key: string;  // Changed from task_id
  task_label: string;
  phase: string;
  phase_label: string;  // Added
  owner: string;
  due_date: string;
  days_overdue: number;
  is_hard_gate: boolean;
  responsible_person: ResponsiblePerson | null;
  countdown_display: string;
  priority: 'normal' | 'high' | 'critical';
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

/**
 * GET /api/command-center/alerts
 *
 * Query Parameters:
 * - role: Filter alerts by team member role (e.g., "AXM", "Director")
 * - email: Filter alerts by team member email
 * - severity: Filter by severity ("overdue", "critical")
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const roleFilter = url.searchParams.get('role');
  const emailFilter = url.searchParams.get('email');
  const severityFilter = url.searchParams.get('severity');

  const alerts: Alert[] = [];

  // Run all data fetches in parallel with error isolation
  let deals: HubSpotDeal[] = [];
  let sentimentRows: any[] = [];
  let managedAccounts: Record<string, { totalMv: number; count: number }> = {};

  try {
    const [dealsResult, sentimentResult, managedResult] = await Promise.allSettled([
      getCachedOnboardingDeals(),
      prisma.$queryRaw<Array<{
        deal_id: string;
        deal_name: string | null;
        current_tier: string;
        current_score: number;
        changed_at: Date;
        previous_tier: string | null;
        previous_score: number | null;
      }>>`
        SELECT DISTINCT ON (h.deal_id)
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
        ORDER BY h.deal_id, h.scored_at DESC
      `,
      getCachedManagedAccounts(),
    ]);

    deals = dealsResult.status === 'fulfilled' ? dealsResult.value : [];
    sentimentRows = sentimentResult.status === 'fulfilled' ? sentimentResult.value : [];
    managedAccounts = managedResult.status === 'fulfilled' ? managedResult.value : {};

    if (dealsResult.status === 'rejected') {
      console.error('[Alerts] Failed to fetch deals:', dealsResult.reason);
    }
    if (sentimentResult.status === 'rejected') {
      console.error('[Alerts] Failed to fetch sentiment:', sentimentResult.reason);
    }
    if (managedResult.status === 'rejected') {
      console.error('[Alerts] Failed to fetch managed accounts:', managedResult.reason);
    }
  } catch (err) {
    console.error('[Alerts] Critical error in data fetch:', err);
    return NextResponse.json({
      total: 0,
      counts: { task_overdue: 0, task_critical: 0, hard_gates: 0, sentiment_drop: 0, aum_behind: 0, aum_critical: 0 },
      alerts: [],
      error: 'Failed to fetch alert data',
    });
  }

  // ── Phase labels ────────────────────────────────────────────────────────
  const PHASE_LABELS: Record<string, string> = {
    'phase_0': 'Sales Handoff',
    'phase_1': 'Post-Signing Prep',
    'phase_2': 'Onboarding Kick-Off',
    'phase_3': 'Pre-Launch Build',
    'phase_4': 'T-7 Final Countdown',
    'phase_5': 'Launch Day',
    'phase_6': 'Active Transition',
    'phase_7': 'Graduation & Handoff',
  };

  // ── 1. Task overdue alerts (using v2 system) ──────────────────────────────

  // Batch-fetch ALL assignments and task states in 2 queries instead of 2 per deal
  const dealIds = deals.filter(d => !d.properties.dealname?.toLowerCase().includes('test')).map(d => d.id);

  let allAssignmentsMap: Record<string, Record<string, ResponsiblePerson>> = {};
  let allTasksMap: Record<string, Record<string, any>> = {};

  if (dealIds.length > 0) {
    try {
      const [allAssignments, allTasks] = await Promise.all([
        prisma.$queryRaw<Array<{
          deal_id: string;
          role: string;
          name: string;
          email: string;
        }>>`
          SELECT aa.deal_id, aa.role, tm.name, tm.email
          FROM advisor_assignments aa
          JOIN team_members tm ON aa.member_id = tm.id
          WHERE aa.deal_id = ANY(ARRAY[${Prisma.join(dealIds)}]::text[]) AND tm.active = TRUE
        `,
        prisma.$queryRaw<Array<{
          deal_id: string;
          task_key: string;
          completed: boolean;
          completed_at: string | null;
          due_date: string | null;
        }>>`
          SELECT deal_id, task_key, completed, completed_at, due_date
          FROM onboarding_tasks
          WHERE deal_id = ANY(ARRAY[${Prisma.join(dealIds)}]::text[]) AND (is_legacy IS NULL OR is_legacy = FALSE)
        `,
      ]);

      for (const row of allAssignments) {
        if (!allAssignmentsMap[row.deal_id]) allAssignmentsMap[row.deal_id] = {};
        allAssignmentsMap[row.deal_id][row.role] = { name: row.name, email: row.email, role: row.role };
      }

      for (const row of allTasks) {
        if (!allTasksMap[row.deal_id]) allTasksMap[row.deal_id] = {};
        allTasksMap[row.deal_id][row.task_key] = row;
      }
    } catch (err) {
      console.error('[Alerts] Failed to batch-fetch assignments/tasks:', err);
    }
  }

  for (const deal of deals) {
    try {
      const name = deal.properties.dealname ?? 'Unknown';
      if (name.toLowerCase().includes('test')) continue;

      const day0_date = getDay0Date({
        closedate: deal.properties.closedate ?? undefined,
        dealstage: deal.properties.dealstage ?? undefined,
      });

      const launch_date = getLaunchDate({
        actual_launch_date: deal.properties.actual_launch_date ?? undefined,
        desired_start_date: deal.properties.desired_start_date ?? undefined,
      });

      const assignments = allAssignmentsMap[deal.id] || {};
      const saved = allTasksMap[deal.id] || {};

      // Check each task for alerts
      for (const task of TASKS) {
        const dueDateResult = calculateDueDate({
          timing: task.timing,
          day0_date,
          launch_date,
        });

        const finalDueDate = saved[task.id]?.due_date || dueDateResult.due_date;
        const taskStatus = calculateTaskStatus(
          finalDueDate,
          saved[task.id]?.completed ?? false,
          saved[task.id]?.completed_at ?? null
        );

        // Only include tasks that need alerts
        if (!taskStatus.needsAlert && !taskStatus.needsDirectorAlert) {
          continue;
        }

        const responsiblePerson = getTaskResponsiblePerson(task.owner, assignments);

        // Apply filters — skip if filtering by role/email and no match
        if (roleFilter && responsiblePerson?.role !== roleFilter) {
          continue;
        }
        if (emailFilter && responsiblePerson?.email !== emailFilter) {
          continue;
        }
        if (severityFilter === 'critical' && taskStatus.status !== 'critical') {
          continue;
        }
        if (severityFilter === 'overdue' && taskStatus.status !== 'overdue' && taskStatus.status !== 'critical') {
          continue;
        }

        // Still show alert even if no responsible person assigned —
        // unassigned overdue tasks are MORE urgent, not less
        if (!finalDueDate) {
          continue;
        }

        alerts.push({
          type: taskStatus.status === 'critical' ? 'task_critical' : 'task_overdue',
          deal_id: deal.id,
          deal_name: name,
          task_key: task.id,
          task_label: task.label,
          phase: task.phase,
          phase_label: PHASE_LABELS[task.phase] || task.phase,
          owner: task.owner,
          due_date: finalDueDate,
          days_overdue: Math.abs(taskStatus.daysRemaining || 0),
          is_hard_gate: task.is_hard_gate,
          responsible_person: responsiblePerson ?? { name: 'Unassigned', email: '', role: task.owner },
          countdown_display: taskStatus.displayText,
          priority: taskStatus.status === 'critical' ? 'critical' : 'high',
        });
      }
    } catch (err) {
      console.error(`[Alerts] Error processing deal ${deal.id}:`, err);
      // Continue processing other deals even if one fails
    }
  }

  // ── 2. Sentiment drop alerts ──────────────────────────────────────────────

  for (const row of sentimentRows) {
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

  const taskAlerts = alerts.filter((a): a is TaskAlert => a.type === 'task_overdue' || a.type === 'task_critical');
  const sentimentAlerts = alerts.filter((a): a is SentimentAlert => a.type === 'sentiment_drop');
  const aumAlerts = alerts.filter((a): a is AumAlert => a.type === 'aum_behind');

  // Sort by priority
  alerts.sort((a, b) => {
    if (a.type === 'task_critical' && b.type !== 'task_critical') return -1;
    if (a.type !== 'task_critical' && b.type === 'task_critical') return 1;
    if (a.type === 'task_overdue' && b.type !== 'task_overdue' && b.type !== 'task_critical') return -1;
    if (a.type !== 'task_overdue' && a.type !== 'task_critical' && b.type === 'task_overdue') return 1;
    return 0;
  });

  return NextResponse.json({
    total: alerts.length,
    counts: {
      task_overdue: taskAlerts.filter(a => a.type === 'task_overdue').length,
      task_critical: taskAlerts.filter(a => a.type === 'task_critical').length,
      hard_gates: taskAlerts.filter(a => a.is_hard_gate).length,
      sentiment_drop: sentimentAlerts.length,
      aum_behind: aumAlerts.length,
      aum_critical: aumAlerts.filter(a => a.pace_status === 'behind').length,
    },
    alerts,
  });
}

export const dynamic = 'force-dynamic';
