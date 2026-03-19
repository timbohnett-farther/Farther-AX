import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// ── Valid roles ──────────────────────────────────────────────────────────────
const TEAM_ROLES = [
  'AXM',            // Advisor Experience Manager
  'AXA',            // Advisor Experience Associate
  'CTM',            // Customer Transition Manager
  'CTA',            // Customer Transition Associate
  'CX Manager',     // Customer Experience Manager
  'Compliance',     // Compliance Officer
  'RIA Leadership', // RIA Manager/Leader
  'Director',       // AX Director
] as const;

// ── GET: List all team members (optionally filter by role or active status) ──
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const active = searchParams.get('active');

    let query = 'SELECT * FROM team_members';
    const conditions: string[] = [];
    const params: (string | boolean)[] = [];

    if (role) {
      conditions.push(`role = $${conditions.length + 1}`);
      params.push(role);
    }
    if (active !== null) {
      conditions.push(`active = $${conditions.length + 1}`);
      params.push(active !== 'false');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY role, name';

    const result = await pool.query(query, params);
    return NextResponse.json({ members: result.rows });
  } catch (err) {
    console.error('[team GET]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST: Create a new team member ──────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, phone, calendar_link } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'name, email, and role are required' }, { status: 400 });
    }

    if (!TEAM_ROLES.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${TEAM_ROLES.join(', ')}` }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO team_members (name, email, role, phone, calendar_link)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email.toLowerCase().trim(), role, phone || null, calendar_link || null]
    );

    return NextResponse.json({ member: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[team POST]', err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('unique constraint') || message.includes('duplicate key')) {
      return NextResponse.json({ error: 'A team member with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PATCH: Update a team member ─────────────────────────────────────────────
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (updates.role && !TEAM_ROLES.includes(updates.role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${TEAM_ROLES.join(', ')}` }, { status: 400 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'email', 'role', 'phone', 'calendar_link', 'active'].includes(key)) {
        fields.push(`${key} = $${idx}`);
        values.push(key === 'email' ? (value as string).toLowerCase().trim() : value);
        idx++;
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE team_members SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json({ member: result.rows[0] });
  } catch (err) {
    console.error('[team PATCH]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── DELETE: Remove a team member (soft delete — sets active = false) ────────
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE team_members SET active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json({ member: result.rows[0] });
  } catch (err) {
    console.error('[team DELETE]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
