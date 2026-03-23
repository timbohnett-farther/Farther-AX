import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `SELECT id, deal_id, advisor_name, contact_email, status, expires_at, completed_at
       FROM u4_2b_tokens
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const row = result.rows[0];

    // Check if expired
    if (new Date(row.expires_at) < new Date()) {
      await pool.query(
        `UPDATE u4_2b_tokens SET status = 'expired' WHERE id = $1 AND status != 'completed'`,
        [row.id]
      );
      return NextResponse.json({ error: 'This form link has expired. Please contact your Farther team for a new link.', expired: true }, { status: 410 });
    }

    // Check if already completed
    if (row.status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        advisorName: row.advisor_name,
        completedAt: row.completed_at,
        message: 'This form has already been submitted. Thank you!',
      });
    }

    return NextResponse.json({
      status: row.status,
      advisorName: row.advisor_name,
      contactEmail: row.contact_email,
      expiresAt: row.expires_at,
    });
  } catch (err) {
    console.error('[u4-2b token validate]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
