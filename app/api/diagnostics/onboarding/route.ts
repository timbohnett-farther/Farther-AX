/**
 * GET /api/diagnostics/onboarding
 *
 * No-auth diagnostic that tests every endpoint the onboarding page depends on.
 * Deploy, hit the URL, see exactly what's broken. Remove when done.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Test team_members table
  try {
    const members = await prisma.$queryRaw<Array<{ id: number; name: string; role: string }>>`
      SELECT id, name, role FROM team_members WHERE active = TRUE ORDER BY role, name LIMIT 10
    `;
    results.team_members = { ok: true, count: members.length, sample: members.slice(0, 3) };
  } catch (err) {
    results.team_members = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // 2. Test advisor_assignments table
  try {
    const assignments = await prisma.$queryRaw<Array<{ deal_id: string; member_id: number; role: string }>>`
      SELECT deal_id, member_id, role FROM advisor_assignments LIMIT 10
    `;
    results.advisor_assignments = { ok: true, count: assignments.length };
  } catch (err) {
    results.advisor_assignments = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // 3. Test onboarding_tasks table
  try {
    const tasks = await prisma.$queryRaw<Array<{ deal_id: string; task_key: string }>>`
      SELECT deal_id, task_key FROM onboarding_tasks LIMIT 10
    `;
    results.onboarding_tasks = { ok: true, count: tasks.length };
  } catch (err) {
    results.onboarding_tasks = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // 4. Test workload API logic (the actual code path)
  try {
    const role = 'AXM';
    const members = await prisma.$queryRaw<Array<{ id: number; name: string; role: string }>>`
      SELECT * FROM team_members WHERE active = TRUE AND role = ${role} ORDER BY name
    `;

    if (members.length === 0) {
      results.workload_flow = { ok: true, message: 'No active AXM team members found (empty workload is valid)', members: 0 };
    } else {
      const memberIds = members.map(m => m.id);
      const assignments = await prisma.$queryRaw<Array<{ deal_id: string; member_id: number; role: string }>>`
        SELECT a.deal_id, a.member_id, a.role
        FROM advisor_assignments a
        WHERE a.member_id = ANY(ARRAY[${Prisma.join(memberIds)}]::int[])
      `;

      // This is where the old code crashed (.rows.map)
      const dealIds = Array.from(new Set(assignments.map(a => a.deal_id)));

      results.workload_flow = {
        ok: true,
        members: members.length,
        assignments: assignments.length,
        uniqueDeals: dealIds.length,
        memberNames: members.map(m => m.name),
      };
    }
  } catch (err) {
    results.workload_flow = { ok: false, error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack?.split('\n').slice(0, 5) : undefined };
  }

  // 5. Test pipeline endpoint (what the page fetches first)
  try {
    const hubspotToken = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT;
    results.hubspot_config = { ok: !!hubspotToken, tokenLength: hubspotToken?.length ?? 0 };
  } catch (err) {
    results.hubspot_config = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // 6. Test TASKS import
  try {
    const { TASKS } = await import('@/lib/onboarding-tasks-v2');
    results.tasks_v2_import = { ok: true, count: TASKS?.length ?? 0, isArray: Array.isArray(TASKS) };
  } catch (err) {
    results.tasks_v2_import = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // 7. Test Prisma schema recognition of new models
  try {
    // Check if Prisma client has the new models
    const hasTransitionClient = typeof prisma.transitionClient !== 'undefined';
    const hasAdvisorGraduations = typeof prisma.advisor_graduations !== 'undefined';
    results.prisma_models = {
      ok: true,
      transitionClient: hasTransitionClient,
      advisor_graduations: hasAdvisorGraduations,
    };
  } catch (err) {
    results.prisma_models = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const allOk = Object.values(results).every((r: any) => r.ok === true);

  return NextResponse.json({
    status: allOk ? 'all_green' : 'issues_found',
    timestamp: new Date().toISOString(),
    results,
  });
}

export const dynamic = 'force-dynamic';
