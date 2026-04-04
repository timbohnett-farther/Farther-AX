import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type AssignmentRow = {
  id: number;
  deal_id: string;
  role: string;
  member_id: number;
  assigned_by: string | null;
  assigned_at: Date;
  member_name: string;
  member_email: string;
  member_phone: string | null;
  member_calendar: string | null;
  member_role: string;
};

// ── GET: Get assignments for a deal (or all assignments) ────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const memberId = searchParams.get('memberId');

    const baseQuery = `
      SELECT a.*, t.name as member_name, t.email as member_email, t.phone as member_phone,
             t.calendar_link as member_calendar, t.role as member_role
      FROM advisor_assignments a
      JOIN team_members t ON a.member_id = t.id
    `;

    let result: AssignmentRow[];

    if (dealId && memberId) {
      result = await prisma.$queryRawUnsafe<AssignmentRow[]>(
        `${baseQuery} WHERE a.deal_id = $1 AND a.member_id = $2 ORDER BY a.role, a.assigned_at`,
        dealId, Number(memberId)
      );
    } else if (dealId) {
      result = await prisma.$queryRawUnsafe<AssignmentRow[]>(
        `${baseQuery} WHERE a.deal_id = $1 ORDER BY a.role, a.assigned_at`,
        dealId
      );
    } else if (memberId) {
      result = await prisma.$queryRawUnsafe<AssignmentRow[]>(
        `${baseQuery} WHERE a.member_id = $1 ORDER BY a.role, a.assigned_at`,
        Number(memberId)
      );
    } else {
      result = await prisma.$queryRawUnsafe<AssignmentRow[]>(
        `${baseQuery} ORDER BY a.role, a.assigned_at`
      );
    }

    return NextResponse.json({ assignments: result });
  } catch (err) {
    console.error('[assignments GET]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST: Assign a team member to a deal role (upsert) ─────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deal_id, role, member_id, assigned_by } = body;

    if (!deal_id || !role || !member_id) {
      return NextResponse.json({ error: 'deal_id, role, and member_id are required' }, { status: 400 });
    }

    // Upsert: if this deal+role combo exists, update the member
    const result = await prisma.$queryRaw<Array<{
      id: number;
      deal_id: string;
      role: string;
      member_id: number;
      assigned_by: string | null;
      assigned_at: Date;
    }>>`
      INSERT INTO advisor_assignments (deal_id, role, member_id, assigned_by)
      VALUES (${deal_id}, ${role}, ${member_id}, ${assigned_by || null})
      ON CONFLICT (deal_id, role)
      DO UPDATE SET member_id = ${member_id}, assigned_by = ${assigned_by || null}, assigned_at = NOW()
      RETURNING *
    `;

    return NextResponse.json({ assignment: result[0] }, { status: 201 });
  } catch (err) {
    console.error('[assignments POST]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── DELETE: Remove an assignment ────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const role = searchParams.get('role');

    if (!dealId || !role) {
      return NextResponse.json({ error: 'dealId and role query params are required' }, { status: 400 });
    }

    const result = await prisma.$queryRaw<Array<{
      id: number;
      deal_id: string;
      role: string;
      member_id: number;
      assigned_by: string | null;
      assigned_at: Date;
    }>>`
      DELETE FROM advisor_assignments
      WHERE deal_id = ${dealId} AND role = ${role}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ deleted: result[0] });
  } catch (err) {
    console.error('[assignments DELETE]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
