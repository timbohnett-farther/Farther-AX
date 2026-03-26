import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { computeComplexityScore } from '@/lib/complexity-score';

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

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const TEAMS_OBJECT_TYPE = '2-43222882';

const DEAL_PROPS = [
  'dealname', 'dealstage', 'createdate', 'hs_lastmodifieddate',
  'transferable_aum', 'aum', 'client_households', 'transferable_households',
  'transition_type', 'transition_notes', 'prior_transitions', 'prior_transitions_notes',
  'firm_type', 'n401k_aum', 'insurance_annuity_revenue', 'broker_dealer_revenue',
  'crm_platform__cloned_', 'financial_planning_platform__cloned_',
  'performance_platform__cloned_', 'technology_platforms_being_used__cloned_',
  'people', 'description',
].join(',');

const TEAM_PROPS = [
  'transferable_aum', 'n401k_aum', 'transferable_401k_aum',
  'insurance_annuity_revenue', 'broker_dealer_revenue',
  'client_households', 'transferable_households',
  'people', 'support_staff', 'total_number_of_owners_or_partners',
  'crm_platform', 'financial_planning_platform', 'performance_platform',
  'technology_platforms_being_used', 'tamp', 'investment_products',
  'alternative_assets__', 'firm_type', 'transition_type',
  'obas__yes_no', 'outside_business_activities',
  'restrictive_covenants',
].join(',');

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

    if (dealIds.length > 0 && HUBSPOT_PAT) {
      try {
        // Batch fetch deal properties directly from HubSpot
        for (let i = 0; i < dealIds.length; i += 100) {
          const batch = dealIds.slice(i, i + 100);
          const batchRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals/batch/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${HUBSPOT_PAT}` },
            body: JSON.stringify({
              properties: DEAL_PROPS.split(','),
              inputs: batch.map(id => ({ id })),
            }),
          });

          if (!batchRes.ok) {
            console.error(`[workload] HubSpot batch read failed: ${batchRes.status}`);
            continue;
          }

          const batchData = await batchRes.json();
          for (const d of (batchData.results ?? [])) {
            dealScores[d.id] = {
              score: 0,
              tier: 'Low',
              deal_name: d.properties?.dealname || 'Unknown',
              dealstage: d.properties?.dealstage || '',
              _props: d.properties, // Keep raw props for scoring
            };
          }
        }

        // Fetch team data for advanced-stage deals (Step 5+)
        const advancedStages = ['2496935', '2496936', '100411705'];
        const advancedDealIds = Object.entries(dealScores)
          .filter(([, ds]) => advancedStages.includes(ds.dealstage))
          .map(([id]) => id);

        const teamData: Record<string, Record<string, string | null> | null> = {};
        for (let i = 0; i < advancedDealIds.length; i += 10) {
          const batch = advancedDealIds.slice(i, i + 10);
          const results = await Promise.allSettled(
            batch.map(async (dealId) => {
              const assocRes = await fetch(
                `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/${TEAMS_OBJECT_TYPE}`,
                { headers: { Authorization: `Bearer ${HUBSPOT_PAT}` } }
              );
              if (!assocRes.ok) return { dealId, team: null };
              const assocData = await assocRes.json();
              const assocResults = assocData.results ?? [];
              if (assocResults.length === 0) return { dealId, team: null };
              const teamId = assocResults[0].toObjectId;
              const teamRes = await fetch(
                `https://api.hubapi.com/crm/v3/objects/${TEAMS_OBJECT_TYPE}/${teamId}?properties=${TEAM_PROPS}`,
                { headers: { Authorization: `Bearer ${HUBSPOT_PAT}` } }
              );
              if (!teamRes.ok) return { dealId, team: null };
              const teamObj = await teamRes.json();
              return { dealId, team: teamObj.properties ?? null };
            })
          );
          for (const r of results) {
            if (r.status === 'fulfilled' && r.value) {
              teamData[r.value.dealId] = r.value.team;
            }
          }
        }

        // Compute complexity scores directly (no internal HTTP call)
        for (const [dealId, ds] of Object.entries(dealScores)) {
          const props = (ds as Record<string, unknown>)._props as Record<string, string | null> | undefined;
          if (!props) continue;
          const team = teamData[dealId] ?? null;
          const result = computeComplexityScore(props, team, []);
          ds.score = result.score;
          ds.tier = result.tier;
        }

        // Clean up internal _props field
        for (const ds of Object.values(dealScores)) {
          delete (ds as Record<string, unknown>)._props;
        }
      } catch (err) {
        console.error('[workload] Complexity scoring failed:', err);
        // Continue with zero scores — still show team members
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
