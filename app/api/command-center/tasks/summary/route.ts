import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        deal_id,
        COUNT(*) FILTER (WHERE NOT completed) as open_tasks,
        COUNT(*) FILTER (WHERE completed) as completed_tasks,
        COUNT(*) as total_tasks,
        MIN(phase) FILTER (WHERE NOT completed) as current_phase
      FROM onboarding_tasks
      WHERE (is_legacy IS NULL OR is_legacy = FALSE)
      GROUP BY deal_id
    `);

    const summary: Record<string, {
      open_tasks: number;
      completed_tasks: number;
      total_tasks: number;
      current_phase: string | null;
    }> = {};

    for (const row of result.rows) {
      summary[row.deal_id] = {
        open_tasks: parseInt(row.open_tasks),
        completed_tasks: parseInt(row.completed_tasks),
        total_tasks: parseInt(row.total_tasks),
        current_phase: row.current_phase,
      };
    }

    return NextResponse.json({ summary });
  } catch (err) {
    console.error('[tasks/summary]', err);
    return NextResponse.json({ summary: {} });
  }
}

export const dynamic = 'force-dynamic';
