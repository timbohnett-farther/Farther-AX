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
    // Get the latest token for this deal
    const result = await pool.query(
      `SELECT t.id, t.token, t.status, t.sent_at, t.sent_by, t.completed_at, t.expires_at, t.contact_email, t.advisor_name,
              s.submitted_at, s.full_name, s.crd_number, s.personal_email
       FROM u4_2b_tokens t
       LEFT JOIN u4_2b_submissions s ON s.token_id = t.id
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
      crdNumber: row.crd_number,
      contactEmail: row.contact_email,
    });
  } catch (err) {
    console.error('[u4-2b status]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
