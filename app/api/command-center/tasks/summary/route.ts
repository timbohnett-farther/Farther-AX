import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const result = await prisma.$queryRaw<Array<{
      deal_id: string;
      open_tasks: bigint;
      completed_tasks: bigint;
      total_tasks: bigint;
      current_phase: string | null;
    }>>`
      SELECT
        deal_id,
        COUNT(*) FILTER (WHERE NOT completed) as open_tasks,
        COUNT(*) FILTER (WHERE completed) as completed_tasks,
        COUNT(*) as total_tasks,
        MIN(phase) FILTER (WHERE NOT completed) as current_phase
      FROM onboarding_tasks
      WHERE (is_legacy IS NULL OR is_legacy = FALSE)
      GROUP BY deal_id
    `;

    const summary: Record<string, {
      open_tasks: number;
      completed_tasks: number;
      total_tasks: number;
      current_phase: string | null;
    }> = {};

    for (const row of result) {
      summary[row.deal_id] = {
        open_tasks: parseInt(row.open_tasks.toString()),
        completed_tasks: parseInt(row.completed_tasks.toString()),
        total_tasks: parseInt(row.total_tasks.toString()),
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
