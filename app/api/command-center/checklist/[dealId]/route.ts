import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { TASKS } from '@/lib/onboarding-tasks-v2';
import { calculateDueDate, getDay0Date, getLaunchDate } from '@/lib/due-date-calculator';
import { calculateTaskStatus, getTaskResponsiblePerson, type ResponsiblePerson } from '@/lib/task-status';
import { initializeTasksForDeal } from '@/lib/task-initializer';

export async function GET(
  req: NextRequest,
  { params }: { params: { dealId: string } }
) {
  try {
    console.log('[checklist] GET request started for dealId:', params?.dealId);

    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('[checklist] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dealId } = params;
    console.log('[checklist] Checking TASKS import...', { tasksCount: TASKS?.length });

    if (!TASKS || !Array.isArray(TASKS)) {
      console.error('[checklist] TASKS import failed or invalid!');
      return NextResponse.json(
        { error: 'Task definitions not loaded', tasks: [] },
        { status: 500 }
      );
    }

    // Fetch team member assignments for this deal
    console.log('[checklist] Fetching team assignments...');
    const assignmentsResult = await pool.query(
      `SELECT aa.role, tm.name, tm.email, tm.role as member_role
       FROM advisor_assignments aa
       JOIN team_members tm ON aa.member_id = tm.id
       WHERE aa.deal_id = $1 AND tm.active = TRUE`,
      [dealId]
    );

    const assignments: Record<string, ResponsiblePerson> = {};
    for (const row of assignmentsResult.rows) {
      assignments[row.role] = {
        name: row.name,
        email: row.email,
        role: row.role,
      };
    }

    console.log('[checklist] Team assignments loaded:', Object.keys(assignments));

    // Fetch deal properties from HubSpot
    console.log('[checklist] Fetching deal from HubSpot...');
    let dealData: any = null;
    let dealName: string = '';
    let day0_date: string | null = null;
    let launch_date: string | null = null;

    try {
      const hubspotToken = process.env.HUBSPOT_ACCESS_TOKEN;
      const hubspotResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=dealname,closedate,dealstage,actual_launch_date,desired_start_date`,
        {
          headers: {
            Authorization: `Bearer ${hubspotToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (hubspotResponse.ok) {
        dealData = await hubspotResponse.json();
        const props = dealData.properties;
        dealName = props.dealname || 'Unknown Advisor';

        day0_date = getDay0Date({
          closedate: props.closedate,
          dealstage: props.dealstage,
        });

        launch_date = getLaunchDate({
          actual_launch_date: props.actual_launch_date,
          desired_start_date: props.desired_start_date,
        });

        console.log('[checklist] Deal dates extracted:', { day0_date, launch_date, dealstage: props.dealstage });
      } else {
        console.warn('[checklist] Failed to fetch deal from HubSpot:', hubspotResponse.status);
      }
    } catch (hubspotError) {
      console.error('[checklist] Error fetching HubSpot deal:', hubspotError);
    }

    // Auto-initialize all tasks if deal is Stage 6+ and has a Day 0 date
    const dealStage = dealData?.properties?.dealstage;
    const isStage6Plus = dealStage === '2496936' || dealStage === '100411705';
    if (isStage6Plus && day0_date) {
      try {
        const initResult = await initializeTasksForDeal(dealId, day0_date, launch_date);
        console.log('[checklist] Task initialization result:', initResult === -1 ? 'already initialized' : `${initResult} rows upserted`);
      } catch (initError) {
        console.error('[checklist] Task initialization failed (non-fatal):', initError);
      }
    }

    console.log('[checklist] Querying database for dealId:', dealId);
    const result = await pool.query(
      `SELECT task_key, completed, completed_by, completed_at, notes, due_date
       FROM onboarding_tasks
       WHERE deal_id = $1 AND (is_legacy IS NULL OR is_legacy = FALSE)`,
      [dealId]
    );

    console.log('[checklist] Database returned', result.rows.length, 'saved tasks');

    const saved: Record<string, typeof result.rows[0]> = {};
    for (const row of result.rows) saved[row.task_key] = row;

    // Auto-complete the first task if deal is in Offer Accepted or Launched stage
    const shouldAutoComplete = dealData?.properties?.dealstage === '2496936' || dealData?.properties?.dealstage === '100411705';
    if (shouldAutoComplete && !saved['p0_mark_signed']?.completed) {
      console.log('[checklist] Auto-completing p0_mark_signed task');
      await pool.query(`
        INSERT INTO onboarding_tasks (deal_id, task_key, phase, completed, completed_by, completed_at, is_legacy, updated_at)
        VALUES ($1, $2, $3, TRUE, $4, $5, FALSE, NOW())
        ON CONFLICT (deal_id, task_key) DO UPDATE
          SET completed    = TRUE,
              completed_by = EXCLUDED.completed_by,
              completed_at = EXCLUDED.completed_at,
              updated_at   = NOW()
      `, [
        dealId,
        'p0_mark_signed',
        'phase_0',
        'system-auto',
        day0_date || new Date().toISOString(),
      ]);

      // Update local cache
      saved['p0_mark_signed'] = {
        task_key: 'p0_mark_signed',
        completed: true,
        completed_by: 'system-auto',
        completed_at: day0_date || new Date().toISOString(),
        notes: null,
        due_date: null,
      };
    }

    const tasks = TASKS.map(task => {
      // Calculate due date
      let dueDateResult;
      try {
        dueDateResult = calculateDueDate({
          timing: task.timing,
          day0_date,
          launch_date,
        });
      } catch (err) {
        console.error('[checklist] Error calculating due date for task:', task.id, err);
        dueDateResult = { due_date: null, anchor: 'day0', offset_days: 0 };
      }

      const finalDueDate = saved[task.id]?.due_date || dueDateResult.due_date;

      // Calculate task status (countdown, overdue, etc.)
      let taskStatus;
      try {
        taskStatus = calculateTaskStatus(
          finalDueDate,
          saved[task.id]?.completed ?? false,
          saved[task.id]?.completed_at ?? null
        );
      } catch (err) {
        console.error('[checklist] Error calculating task status for task:', task.id, err);
        taskStatus = {
          status: 'no_due_date',
          displayText: 'Error calculating status',
          daysRemaining: null,
          needsAlert: false,
          needsDirectorAlert: false,
        };
      }

      // Get responsible person based on task owner and assignments
      const responsiblePerson = getTaskResponsiblePerson(task.owner, assignments);

      return {
        id: task.id,
        label: task.label,
        phase: task.phase,
        owner: task.owner,
        timing: task.timing,
        is_hard_gate: task.is_hard_gate,
        resources: task.resources ?? null,
        completed: saved[task.id]?.completed ?? false,
        completed_by: saved[task.id]?.completed_by ?? null,
        completed_at: saved[task.id]?.completed_at ?? null,
        notes: saved[task.id]?.notes ?? null,
        due_date: finalDueDate,
        due_anchor: dueDateResult.anchor,
        offset_days: dueDateResult.offset_days,
        responsible_person: responsiblePerson,
        status: taskStatus.status,
        countdown_display: taskStatus.displayText,
        days_remaining: taskStatus.daysRemaining,
        needs_alert: taskStatus.needsAlert,
        needs_director_alert: taskStatus.needsDirectorAlert,
      };
    });

    console.log('[checklist] Returning', tasks.length, 'tasks with due dates and status');
    return NextResponse.json({
      dealId,
      dealName,
      tasks,
      day0_date,
      launch_date,
      assignments,
    });
  } catch (error) {
    console.error('[checklist] FATAL ERROR:', error);
    console.error('[checklist] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        error: 'Failed to load tasks',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { dealId } = params;
  const body = await req.json() as {
    taskId: string;
    completed: boolean;
    notes?: string;
    due_date?: string | null;
  };
  const { taskId, completed, notes, due_date } = body;

  const userEmail = session.user?.email ?? 'unknown';
  const taskDef = TASKS.find(t => t.id === taskId);
  const phase = taskDef?.phase ?? 'phase_0';

  await pool.query(`
    INSERT INTO onboarding_tasks (deal_id, task_key, phase, completed, completed_by, completed_at, notes, due_date, is_legacy, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NOW())
    ON CONFLICT (deal_id, task_key) DO UPDATE
      SET completed    = EXCLUDED.completed,
          completed_by = EXCLUDED.completed_by,
          completed_at = EXCLUDED.completed_at,
          notes        = COALESCE(EXCLUDED.notes, onboarding_tasks.notes),
          due_date     = COALESCE(EXCLUDED.due_date, onboarding_tasks.due_date),
          is_legacy    = FALSE,
          updated_at   = NOW()
  `, [
    dealId,
    taskId,
    phase,
    completed,
    completed ? userEmail : null,
    completed ? new Date().toISOString() : null,
    notes ?? null,
    due_date ?? null,
  ]);

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
