import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/command-center/intake/[dealId] — Get intake status for a deal
export async function GET(_req: NextRequest, { params }: { params: { dealId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dealId } = params;

    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, token, deal_id, contact_id, advisor_name, advisor_email,
             status, form_data, sent_by, sent_at, started_at, completed_at,
             expires_at, pdf_url, hubspot_note_id, created_at, updated_at
      FROM intake_forms
      WHERE deal_id = ${dealId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ exists: false, status: null });
    }

    const form = rows[0];
    return NextResponse.json({
      exists: true,
      id: form.id,
      token: form.token,
      status: form.status,
      advisorName: form.advisor_name,
      advisorEmail: form.advisor_email,
      sentBy: form.sent_by,
      sentAt: form.sent_at,
      startedAt: form.started_at,
      completedAt: form.completed_at,
      expiresAt: form.expires_at,
      formData: form.status === 'completed' ? form.form_data : null,
      pdfUrl: form.pdf_url,
      hubspotNoteId: form.hubspot_note_id,
    });
  } catch (error: any) {
    console.error('Intake status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
