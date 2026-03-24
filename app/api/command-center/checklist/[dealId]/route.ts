import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { TASKS } from '@/lib/onboarding-tasks-v2';

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

    const url = new URL(req.url);
    const day0_date = url.searchParams.get('day0_date');
    const launch_date = url.searchParams.get('launch_date');

    console.log('[checklist] Querying database for dealId:', dealId);
    const result = await pool.query(
      `SELECT task_key, completed, completed_by, completed_at, notes
       FROM onboarding_tasks
       WHERE deal_id = $1 AND (is_legacy IS NULL OR is_legacy = FALSE)`,
      [dealId]
    );

    console.log('[checklist] Database returned', result.rows.length, 'saved tasks');

    const saved: Record<string, typeof result.rows[0]> = {};
    for (const row of result.rows) saved[row.task_key] = row;

    const tasks = TASKS.map(task => ({
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
    }));

    console.log('[checklist] Returning', tasks.length, 'tasks');
    return NextResponse.json({ dealId, tasks });
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
  const body = await req.json() as { taskId: string; completed: boolean; notes?: string };
  const { taskId, completed, notes } = body;

  const userEmail = session.user?.email ?? 'unknown';
  const taskDef = TASKS.find(t => t.id === taskId);
  const phase = taskDef?.phase ?? 'phase_0';

  await pool.query(`
    INSERT INTO onboarding_tasks (deal_id, task_key, phase, completed, completed_by, completed_at, notes, is_legacy, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, NOW())
    ON CONFLICT (deal_id, task_key) DO UPDATE
      SET completed    = EXCLUDED.completed,
          completed_by = EXCLUDED.completed_by,
          completed_at = EXCLUDED.completed_at,
          notes        = COALESCE(EXCLUDED.notes, onboarding_tasks.notes),
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
  ]);

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
