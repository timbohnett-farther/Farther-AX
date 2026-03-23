import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// ══════════════════════════════════════════════════════════════════════════════
// STAFFING RECOMMENDATION ENGINE
// ══════════════════════════════════════════════════════════════════════════════
// When an advisor hits Step 6, this endpoint generates a recommended team:
//   - AXM (primary manager)
//   - AXA (associate support)
//   - CTM/CTA (transition lead)
// Based on current workload, capacity, and deal complexity.
// ══════════════════════════════════════════════════════════════════════════════

const MAX_CAPACITY = 250;
const RED_THRESHOLD = 220;

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  calendar_link: string | null;
}

interface Recommendation {
  role: string;
  recommended: TeamMember | null;
  alternatives: TeamMember[];
  reason: string;
  current_load: number;
  projected_load: number;
  capacity_status: 'green' | 'amber' | 'red';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');

    if (!dealId) {
      return NextResponse.json({ error: 'dealId is required' }, { status: 400 });
    }

    // 1. Get the deal's complexity score
    let dealComplexity = 30; // default to moderate if we can't get it
    try {
      const origin = request.headers.get('host') ? `http://${request.headers.get('host')}` : 'http://localhost:3000';
      const cxRes = await fetch(`${origin}/api/command-center/complexity?dealId=${dealId}`);
      const cxData = await cxRes.json();
      if (cxData.score) dealComplexity = cxData.score;
    } catch {
      // Use default
    }

    // 2. Get all active team members for relevant roles
    const membersResult = await pool.query(
      `SELECT * FROM team_members WHERE active = TRUE AND role IN ('AXM', 'AXA', 'CTM', 'CTA') ORDER BY role, name`
    );
    const members: TeamMember[] = membersResult.rows;

    // 3. Get all current assignments with their deal complexity
    const assignmentsResult = await pool.query(
      `SELECT a.member_id, a.deal_id FROM advisor_assignments a
       JOIN team_members t ON a.member_id = t.id
       WHERE t.active = TRUE`
    );

    // 4. Get complexity scores for all currently assigned deals
    const allDealIds = Array.from(new Set(assignmentsResult.rows.map((a: { deal_id: string }) => a.deal_id)));
    const dealScores: Record<string, number> = {};

    if (allDealIds.length > 0) {
      try {
        const origin = request.headers.get('host') ? `http://${request.headers.get('host')}` : 'http://localhost:3000';
        const batchRes = await fetch(`${origin}/api/command-center/complexity/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dealIds: allDealIds }),
        });
        const batchData = await batchRes.json();
        if (batchData.scores) {
          for (const [id, data] of Object.entries(batchData.scores)) {
            dealScores[id] = (data as { score: number }).score;
          }
        }
      } catch {
        // All zeros
      }
    }

    // 5. Compute current load per member
    const memberLoads: Record<string, { totalComplexity: number; dealCount: number }> = {};
    for (const m of members) {
      memberLoads[m.id] = { totalComplexity: 0, dealCount: 0 };
    }
    for (const a of assignmentsResult.rows) {
      if (memberLoads[a.member_id]) {
        memberLoads[a.member_id].totalComplexity += dealScores[a.deal_id] || 0;
        memberLoads[a.member_id].dealCount++;
      }
    }

    // 6. Rank members by available capacity for each role
    const rankByCapacity = (role: string): { member: TeamMember; load: number; projected: number; status: 'green' | 'amber' | 'red' }[] => {
      return members
        .filter(m => m.role === role)
        .map(m => {
          const load = memberLoads[m.id]?.totalComplexity || 0;
          const projected = load + dealComplexity;
          let status: 'green' | 'amber' | 'red' = 'green';
          if (projected >= RED_THRESHOLD) status = 'red';
          else if (projected >= 150) status = 'amber';
          return { member: m, load, projected, status };
        })
        .sort((a, b) => a.load - b.load); // Lowest load first
    }

    // 7. Build recommendations
    const rolesToRecommend = ['AXM', 'AXA', 'CTM', 'CTA'];
    const recommendations: Recommendation[] = [];

    for (const role of rolesToRecommend) {
      const ranked = rankByCapacity(role);

      if (ranked.length === 0) {
        recommendations.push({
          role,
          recommended: null,
          alternatives: [],
          reason: `No active ${role}s available`,
          current_load: 0,
          projected_load: 0,
          capacity_status: 'red',
        });
        continue;
      }

      const best = ranked[0];
      const alternatives = ranked.slice(1).map(r => r.member);

      let reason: string;
      if (best.status === 'green') {
        reason = `${best.member.name} has the most available capacity (${best.load}/${MAX_CAPACITY} pts, ${memberLoads[best.member.id]?.dealCount || 0} active advisors)`;
      } else if (best.status === 'amber') {
        reason = `${best.member.name} is the least loaded ${role} but approaching capacity (${best.load}/${MAX_CAPACITY} pts). Consider if additional support is needed.`;
      } else {
        reason = `All ${role}s are at or near capacity. ${best.member.name} is the least loaded but would be overloaded at ${best.projected}/${MAX_CAPACITY} pts.`;
      }

      recommendations.push({
        role,
        recommended: best.member,
        alternatives,
        reason,
        current_load: best.load,
        projected_load: best.projected,
        capacity_status: best.status,
      });
    }

    // 8. Check if any existing assignments for this deal
    const existingResult = await pool.query(
      `SELECT a.*, t.name as member_name, t.role as member_role
       FROM advisor_assignments a
       JOIN team_members t ON a.member_id = t.id
       WHERE a.deal_id = $1`,
      [dealId]
    );

    return NextResponse.json({
      dealId,
      dealComplexity,
      recommendations,
      existingAssignments: existingResult.rows,
      allTeamAtCapacity: recommendations.filter(r => r.capacity_status === 'red').length === recommendations.length,
    });
  } catch (err) {
    console.error('[staff-recommendation GET]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
