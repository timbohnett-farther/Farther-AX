import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { ONBOARDING_TASKS, PHASE_META, calculateDueDate } from '@/lib/onboarding-tasks';
import type { OnboardingTask } from '@/lib/onboarding-tasks';

const HUBSPOT_PAT = process.env.HUBSPOT_PAT!;
const PIPELINE_ID = '2496930';
const ONBOARDING_STAGE_IDS = ['2496936', '100411705'];

interface HubSpotDeal {
  id: string;
  properties: Record<string, string | null>;
}

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
      properties: ['dealname', 'dealstage', 'closedate', 'desired_start_date', 'actual_launch_date'],
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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const deals = await fetchOnboardingDeals();
  const today = new Date().toISOString().slice(0, 10);

  const taskMap = new Map<string, OnboardingTask>();
  for (const t of ONBOARDING_TASKS) taskMap.set(t.key, t);

  // Fetch all non-legacy completed tasks
  const result = await pool.query(
    `SELECT deal_id, task_key, completed
     FROM onboarding_tasks
     WHERE (is_legacy IS NULL OR is_legacy = FALSE) AND completed = TRUE`
  );
  const completedSet = new Set<string>();
  for (const row of result.rows) {
    completedSet.add(`${row.deal_id}:${row.task_key}`);
  }

  interface Alert {
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

  const alerts: Alert[] = [];

  for (const deal of deals) {
    const name = deal.properties.dealname ?? 'Unknown';
    if (name.toLowerCase().includes('test')) continue;

    const day0_date = deal.properties.closedate || null;
    const launch_date = deal.properties.actual_launch_date || deal.properties.desired_start_date || null;

    for (const task of ONBOARDING_TASKS) {
      const dueDate = calculateDueDate(task, { day0_date, launch_date });
      if (!dueDate) continue;
      if (dueDate >= today) continue; // not overdue
      if (completedSet.has(`${deal.id}:${task.key}`)) continue; // already done

      const daysOverdue = Math.floor(
        (new Date(today).getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      alerts.push({
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

  // Sort: hard gates first, then by days overdue descending
  alerts.sort((a, b) => {
    if (a.is_hard_gate !== b.is_hard_gate) return a.is_hard_gate ? -1 : 1;
    return b.days_overdue - a.days_overdue;
  });

  return NextResponse.json({
    total: alerts.length,
    hard_gates: alerts.filter(a => a.is_hard_gate).length,
    alerts,
  });
}

export const dynamic = 'force-dynamic';
