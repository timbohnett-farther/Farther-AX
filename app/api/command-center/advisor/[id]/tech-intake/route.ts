import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: dealId } = await params;

  try {
    const result = await pool.query(
      `SELECT t.id, t.token, t.status, t.sent_at, t.sent_by, t.completed_at, t.expires_at, t.contact_email, t.advisor_name,
              s.submitted_at, s.laptop_choice, s.ship_to
       FROM tech_intake_tokens t
       LEFT JOIN tech_intake_submissions s ON s.token_id = t.id
       WHERE t.deal_id = $1
       ORDER BY t.created_at DESC
       LIMIT 1`,
      [dealId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ status: 'not_sent' });
    }

    const row = result.rows[0];

    // Check if token expired
    if (row.status !== 'completed' && new Date(row.expires_at) < new Date()) {
      return NextResponse.json({
        status: 'expired',
        sentAt: row.sent_at,
        sentBy: row.sent_by,
        expiresAt: row.expires_at,
        token: row.token,
      });
    }

    return NextResponse.json({
      status: row.status,
      sentAt: row.sent_at,
      sentBy: row.sent_by,
      completedAt: row.completed_at,
      expiresAt: row.expires_at,
      token: row.token,
      submittedAt: row.submitted_at,
      laptopChoice: row.laptop_choice,
      shipTo: row.ship_to,
      contactEmail: row.contact_email,
    });
  } catch (err) {
    console.error('[tech-intake status]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
