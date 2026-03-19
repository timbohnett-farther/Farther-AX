import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// ══════════════════════════════════════════════════════════════════════════════
// WORKLOAD & CAPACITY API
// ══════════════════════════════════════════════════════════════════════════════
// AXMs can handle 3–6 advisors depending on complexity.
// Max capacity score: 250 points across all active deals.
//   Low (0–25)       → ~25 pts capacity consumed
//   Moderate (26–50) → ~50 pts capacity consumed
//   High (51–75)     → ~75 pts capacity consumed
//   Critical (76+)   → ~90 pts capacity consumed
//
// Capacity thresholds:
//   Green:  < 150 pts total (comfortable workload)
//   Amber:  150–220 pts (approaching limit)
//   Red:    > 220 pts (overloaded, should not receive new advisors)
// ══════════════════════════════════════════════════════════════════════════════

const MAX_CAPACITY = 250;
const AMBER_THRESHOLD = 150;
const RED_THRESHOLD = 220;

export interface WorkloadEntry {
  member_id: number;
  member_name: string;
  member_email: string;
  role: string;
  active_deals: number;
  total_complexity: number;
  capacity_used_pct: number;
  capacity_status: 'green' | 'amber' | 'red';
  deals: Array<{
    deal_id: string;
    deal_name: string;
    dealstage: string;
    complexity_score: number;
    complexity_tier: string;
  }>;
}

// ── GET: Workload for all AXMs (or filter by role, or single member) ────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'AXM';
    const memberId = searchParams.get('memberId');

    // 1. Get active team members for the requested role
    let memberQuery = 'SELECT * FROM team_members WHERE active = TRUE';
    const memberParams: (string | number)[] = [];

    if (memberId) {
      memberQuery += ` AND id = $${memberParams.length + 1}`;
      memberParams.push(parseInt(memberId));
    } else {
      memberQuery += ` AND role = $${memberParams.length + 1}`;
      memberParams.push(role);
    }
    memberQuery += ' ORDER BY name';

    const membersResult = await pool.query(memberQuery, memberParams);
    const members = membersResult.rows;

    if (members.length === 0) {
      return NextResponse.json({ workload: [], maxCapacity: MAX_CAPACITY });
    }

    // 2. Get all assignments for these members
    const memberIds = members.map((m: { id: number }) => m.id);
    const assignmentsResult = await pool.query(
      `SELECT a.deal_id, a.member_id, a.role
       FROM advisor_assignments a
       WHERE a.member_id = ANY($1)`,
      [memberIds]
    );

    // 3. Get complexity scores for all assigned deals
    const dealIds = Array.from(new Set(assignmentsResult.rows.map((a: { deal_id: string }) => a.deal_id)));

    const dealScores: Record<string, { score: number; tier: string; deal_name: string; dealstage: string }> = {};

    if (dealIds.length > 0) {
      // Fetch deal info from HubSpot batch
      const hubspotToken = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT;
      if (hubspotToken) {
        try {
          const batchRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals/batch/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${hubspotToken}` },
            body: JSON.stringify({
              properties: ['dealname', 'dealstage'],
              inputs: dealIds.map(id => ({ id })),
            }),
          });
          const batchData = await batchRes.json();
          if (batchData.results) {
            for (const d of batchData.results) {
              dealScores[d.id] = {
                score: 0,
                tier: 'Low',
                deal_name: d.properties.dealname || 'Unknown',
                dealstage: d.properties.dealstage || '',
              };
            }
          }
        } catch {
          // Continue without HubSpot data
        }
      }

      // Fetch complexity scores from our batch endpoint
      try {
        const origin = request.headers.get('host') ? `http://${request.headers.get('host')}` : 'http://localhost:3000';
        const complexityRes = await fetch(`${origin}/api/command-center/complexity/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dealIds }),
        });
        const complexityData = await complexityRes.json();
        if (complexityData.scores) {
          for (const [dealId, scoreData] of Object.entries(complexityData.scores)) {
            const sd = scoreData as { score: number; tier: string };
            if (dealScores[dealId]) {
              dealScores[dealId].score = sd.score;
              dealScores[dealId].tier = sd.tier;
            } else {
              dealScores[dealId] = {
                score: sd.score,
                tier: sd.tier,
                deal_name: 'Unknown',
                dealstage: '',
              };
            }
          }
        }
      } catch {
        // Continue with zero scores
      }
    }

    // 4. Build workload entries
    const workload: WorkloadEntry[] = members.map((m: { id: number; name: string; email: string; role: string }) => {
      const memberAssignments = assignmentsResult.rows.filter(
        (a: { member_id: number }) => a.member_id === m.id
      );
      const deals = memberAssignments.map((a: { deal_id: string }) => {
        const ds = dealScores[a.deal_id] || { score: 0, tier: 'Low', deal_name: 'Unknown', dealstage: '' };
        return {
          deal_id: a.deal_id,
          deal_name: ds.deal_name,
          dealstage: ds.dealstage,
          complexity_score: ds.score,
          complexity_tier: ds.tier,
        };
      });

      const totalComplexity = deals.reduce((sum: number, d: { complexity_score: number }) => sum + d.complexity_score, 0);
      const capacityPct = Math.round((totalComplexity / MAX_CAPACITY) * 100);

      let status: 'green' | 'amber' | 'red' = 'green';
      if (totalComplexity >= RED_THRESHOLD) status = 'red';
      else if (totalComplexity >= AMBER_THRESHOLD) status = 'amber';

      return {
        member_id: m.id,
        member_name: m.name,
        member_email: m.email,
        role: m.role,
        active_deals: deals.length,
        total_complexity: totalComplexity,
        capacity_used_pct: capacityPct,
        capacity_status: status,
        deals,
      };
    });

    return NextResponse.json({
      workload,
      maxCapacity: MAX_CAPACITY,
      thresholds: { amber: AMBER_THRESHOLD, red: RED_THRESHOLD },
    });
  } catch (err) {
    console.error('[workload GET]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST: Simulate adding a deal to a member — returns capacity warning ─────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { member_id, deal_complexity_score } = body;

    if (!member_id || deal_complexity_score === undefined) {
      return NextResponse.json({ error: 'member_id and deal_complexity_score are required' }, { status: 400 });
    }

    // Get current workload for this member
    const origin = request.headers.get('host') ? `http://${request.headers.get('host')}` : 'http://localhost:3000';
    const workloadRes = await fetch(`${origin}/api/command-center/workload?memberId=${member_id}`);
    const workloadData = await workloadRes.json();
    const member = workloadData.workload?.[0];

    if (!member) {
      return NextResponse.json({ error: 'Member not found or inactive' }, { status: 404 });
    }

    const currentComplexity = member.total_complexity;
    const projectedComplexity = currentComplexity + deal_complexity_score;
    const projectedPct = Math.round((projectedComplexity / MAX_CAPACITY) * 100);

    let projectedStatus: 'green' | 'amber' | 'red' = 'green';
    if (projectedComplexity >= RED_THRESHOLD) projectedStatus = 'red';
    else if (projectedComplexity >= AMBER_THRESHOLD) projectedStatus = 'amber';

    const overCapacity = projectedComplexity > MAX_CAPACITY;
    const wouldExceedRed = projectedComplexity >= RED_THRESHOLD && currentComplexity < RED_THRESHOLD;

    return NextResponse.json({
      member_id,
      member_name: member.member_name,
      current: {
        deals: member.active_deals,
        complexity: currentComplexity,
        status: member.capacity_status,
      },
      projected: {
        deals: member.active_deals + 1,
        complexity: projectedComplexity,
        capacity_pct: projectedPct,
        status: projectedStatus,
        over_capacity: overCapacity,
        would_exceed_red: wouldExceedRed,
      },
      warning: overCapacity
        ? `${member.member_name} would be at ${projectedPct}% capacity (${projectedComplexity}/${MAX_CAPACITY} pts). Consider reassigning to a team member with lower workload.`
        : wouldExceedRed
          ? `${member.member_name} would move into red zone (${projectedComplexity}/${MAX_CAPACITY} pts). This is approaching overload.`
          : null,
    });
  } catch (err) {
    console.error('[workload POST]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
