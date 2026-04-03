/**
 * Task Initializer — Bulk-insert all onboarding tasks for a deal
 *
 * Called when a Stage 6+ deal's checklist is loaded. Ensures all ~107 tasks
 * exist in the DB with calculated due dates so that summary counts, countdown
 * clocks, and overdue alerts are accurate from the moment an advisor is signed.
 *
 * Idempotent: uses ON CONFLICT to skip already-existing rows and only fills
 * in null due dates (e.g. when launch_date was unknown and is now set).
 */

import { prisma } from '@/lib/prisma';
import { TASKS } from '@/lib/onboarding-tasks-v2';
import { calculateDueDate } from '@/lib/due-date-calculator';

/**
 * Initialize all onboarding tasks for a deal in one bulk INSERT.
 *
 * @returns number of rows inserted/updated, or -1 if skipped (already initialized)
 */
export async function initializeTasksForDeal(
  dealId: string,
  day0_date: string | null,
  launch_date: string | null
): Promise<number> {
  // Fast-path: if all tasks already exist, skip
  const countResult = await prisma.$queryRaw<Array<{ cnt: bigint }>>`
    SELECT COUNT(*) as cnt FROM onboarding_tasks
    WHERE deal_id = ${dealId} AND (is_legacy IS NULL OR is_legacy = FALSE)
  `;
  const existingCount = parseInt(countResult[0].cnt.toString(), 10);

  if (existingCount >= TASKS.length) {
    return -1; // Already fully initialized
  }

  // Build VALUES list for bulk insert
  const values: any[] = [];
  const placeholders: string[] = [];
  let paramIndex = 1;

  for (const task of TASKS) {
    const dueDateResult = calculateDueDate({
      timing: task.timing,
      day0_date,
      launch_date,
    });

    placeholders.push(
      `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, FALSE, FALSE, NOW())`
    );

    values.push(
      dealId,          // deal_id
      task.id,         // task_key
      task.phase,      // phase
      dueDateResult.due_date, // due_date (may be null)
    );

    paramIndex += 4;
  }

  const query = `
    INSERT INTO onboarding_tasks (deal_id, task_key, phase, due_date, completed, is_legacy, updated_at)
    VALUES ${placeholders.join(',\n           ')}
    ON CONFLICT (deal_id, task_key) DO UPDATE
      SET due_date    = COALESCE(onboarding_tasks.due_date, EXCLUDED.due_date),
          is_legacy   = FALSE,
          updated_at  = NOW()
  `;

  await prisma.$executeRawUnsafe(query, ...values);
  return TASKS.length; // Return number of tasks processed
}
