import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { ONBOARDING_TASKS, calculateDueDate } from '@/lib/onboarding-tasks';

export async function GET(
  req: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { dealId } = params;
  const url = new URL(req.url);
  const day0_date = url.searchParams.get('day0_date');
  const launch_date = url.searchParams.get('launch_date');

  try {
    const result = await pool.query(
      `SELECT task_key, completed, completed_by, completed_at, notes, due_date
       FROM onboarding_tasks
       WHERE deal_id = $1 AND (is_legacy IS NULL OR is_legacy = FALSE)`,
      [dealId]
    );

    const saved: Record<string, typeof result.rows[0]> = {};
    for (const row of result.rows) saved[row.task_key] = row;

    const dealDates = { day0_date, launch_date };

    const tasks = ONBOARDING_TASKS.map(task => ({
      ...task,
      completed: saved[task.key]?.completed ?? false,
      completed_by: saved[task.key]?.completed_by ?? null,
      completed_at: saved[task.key]?.completed_at ?? null,
      notes: saved[task.key]?.notes ?? null,
      due_date: calculateDueDate(task, dealDates),
    }));

    return NextResponse.json({ dealId, tasks, dealDates });
  } catch (error) {
    console.error('[checklist] Database error:', error);
    return NextResponse.json(
      { error: 'Failed to load tasks', details: error instanceof Error ? error.message : String(error) },
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
  const body = await req.json() as { taskKey: string; completed: boolean; notes?: string };
  const { taskKey, completed, notes } = body;

  const userEmail = session.user?.email ?? 'unknown';
  const taskDef = ONBOARDING_TASKS.find(t => t.key === taskKey);
  const phase = taskDef?.phase ?? 'phase_0';

  await pool.query(`
    INSERT INTO onboarding_tasks (deal_id, task_key, phase, completed, completed_by, completed_at, notes, due_date, is_legacy, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NOW())
    ON CONFLICT (deal_id, task_key) DO UPDATE
      SET completed    = EXCLUDED.completed,
          completed_by = EXCLUDED.completed_by,
          completed_at = EXCLUDED.completed_at,
          notes        = COALESCE(EXCLUDED.notes, onboarding_tasks.notes),
          due_date     = EXCLUDED.due_date,
          is_legacy    = FALSE,
          updated_at   = NOW()
  `, [
    dealId,
    taskKey,
    phase,
    completed,
    completed ? userEmail : null,
    completed ? new Date().toISOString() : null,
    notes ?? null,
    null,
  ]);

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
