import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
  'Recruiter',      // Advisor Business Development
] as const;

// ── GET: List all team members (optionally filter by role or active status) ──
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const active = searchParams.get('active');

    let whereClauses: string[] = [];

    if (role) {
      whereClauses.push(`role = '${role}'`);
    }
    if (active !== null) {
      whereClauses.push(`active = ${active !== 'false'}`);
    }

    const whereClause = whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : '';

    const query = `SELECT * FROM team_members${whereClause} ORDER BY role, name`;
    const result = await prisma.$queryRawUnsafe<Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      phone: string | null;
      calendar_link: string | null;
      active: boolean;
      created_at: Date;
      updated_at: Date;
    }>>(query);

    return NextResponse.json({ members: result });
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

    const result = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      phone: string | null;
      calendar_link: string | null;
      active: boolean;
      created_at: Date;
      updated_at: Date;
    }>>`
      INSERT INTO team_members (name, email, role, phone, calendar_link)
      VALUES (${name}, ${email.toLowerCase().trim()}, ${role}, ${phone || null}, ${calendar_link || null})
      RETURNING *
    `;

    return NextResponse.json({ member: result[0] }, { status: 201 });
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
    const values: Record<string, any> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'email', 'role', 'phone', 'calendar_link', 'active'].includes(key)) {
        fields.push(`${key} = ${Prisma.sql`${key === 'email' ? (value as string).toLowerCase().trim() : value}`}`);
        values[key] = key === 'email' ? (value as string).toLowerCase().trim() : value;
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    fields.push(`updated_at = NOW()`);

    // Build dynamic SET clause
    const setClause = Object.entries(values)
      .map(([k, v]) => `${k} = ${typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v}`)
      .join(', ');

    const updateQuery = `UPDATE team_members SET ${setClause}, updated_at = NOW() WHERE id = ${id} RETURNING *`;
    const result = await prisma.$queryRawUnsafe<Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      phone: string | null;
      calendar_link: string | null;
      active: boolean;
      created_at: Date;
      updated_at: Date;
    }>>(updateQuery);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json({ member: result[0] });
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

    const result = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      phone: string | null;
      calendar_link: string | null;
      active: boolean;
      created_at: Date;
      updated_at: Date;
    }>>`
      UPDATE team_members SET active = FALSE, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json({ member: result[0] });
  } catch (err) {
    console.error('[team DELETE]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
