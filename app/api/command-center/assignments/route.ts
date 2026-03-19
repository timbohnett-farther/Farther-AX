import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// ── GET: Get assignments for a deal (or all assignments) ────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const memberId = searchParams.get('memberId');

    let query = `
      SELECT a.*, t.name as member_name, t.email as member_email, t.phone as member_phone,
             t.calendar_link as member_calendar, t.role as member_role
      FROM advisor_assignments a
      JOIN team_members t ON a.member_id = t.id
    `;
    const conditions: string[] = [];
    const params: string[] = [];

    if (dealId) {
      conditions.push(`a.deal_id = $${conditions.length + 1}`);
      params.push(dealId);
    }
    if (memberId) {
      conditions.push(`a.member_id = $${conditions.length + 1}`);
      params.push(memberId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY a.role, a.assigned_at';

    const result = await pool.query(query, params);
    return NextResponse.json({ assignments: result.rows });
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
    const result = await pool.query(
      `INSERT INTO advisor_assignments (deal_id, role, member_id, assigned_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (deal_id, role)
       DO UPDATE SET member_id = $3, assigned_by = $4, assigned_at = NOW()
       RETURNING *`,
      [deal_id, role, member_id, assigned_by || null]
    );

    return NextResponse.json({ assignment: result.rows[0] }, { status: 201 });
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

    const result = await pool.query(
      `DELETE FROM advisor_assignments WHERE deal_id = $1 AND role = $2 RETURNING *`,
      [dealId, role]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ deleted: result.rows[0] });
  } catch (err) {
    console.error('[assignments DELETE]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
