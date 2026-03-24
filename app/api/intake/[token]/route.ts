import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

// GET /api/intake/[token] — Public: validate token + return form state
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;

    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, token, deal_id, advisor_name, advisor_email, status,
             form_data, expires_at
      FROM intake_forms
      WHERE token = ${token}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired link' }, { status: 404 });
    }

    const form = rows[0];

    // Check expiry
    if (new Date(form.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This intake form link has expired' }, { status: 410 });
    }

    // Check if already completed
    if (form.status === 'completed') {
      return NextResponse.json({ valid: false, error: 'This intake form has already been submitted', status: 'completed' });
    }

    // If pending, transition to in_progress
    if (form.status === 'pending') {
      await prisma.$executeRaw`
        UPDATE intake_forms SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
        WHERE token = ${token}
      `;
    }

    // Strip SSN from returned form_data for security
    let formData = form.form_data || null;
    if (formData && formData.q4_ssn) {
      formData = { ...formData, q4_ssn: '' };
    }

    return NextResponse.json({
      valid: true,
      advisorName: form.advisor_name,
      advisorEmail: form.advisor_email,
      formData,
      status: form.status === 'pending' ? 'in_progress' : form.status,
    });
  } catch (error: any) {
    console.error('Intake validate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/intake/[token] — Public: submit completed form
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;
    const body = await req.json();
    const { formData } = body;

    if (!formData) {
      return NextResponse.json({ error: 'formData is required' }, { status: 400 });
    }

    // Validate token is active
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, deal_id, status, expires_at FROM intake_forms
      WHERE token = ${token} LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    const form = rows[0];

    if (form.status === 'completed') {
      return NextResponse.json({ error: 'Form already submitted' }, { status: 409 });
    }

    if (new Date(form.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Form link expired' }, { status: 410 });
    }

    // Encrypt SSN before storing
    const dataToStore = { ...formData };
    if (dataToStore.q4_ssn) {
      dataToStore.q4_ssn = encrypt(dataToStore.q4_ssn);
    }

    const jsonData = JSON.stringify(dataToStore);

    // Save form data and mark completed
    await prisma.$executeRaw`
      UPDATE intake_forms
      SET form_data = ${jsonData}::jsonb,
          status = 'completed',
          completed_at = NOW(),
          updated_at = NOW()
      WHERE token = ${token}
    `;

    // Auto-complete onboarding checklist task
    await prisma.$executeRawUnsafe(`
      INSERT INTO onboarding_tasks (deal_id, task_key, phase, completed, completed_by, completed_at)
      VALUES ($1, 'pre_28_u4_2b_upload', 'pre_launch', true, 'intake-form-auto', NOW())
      ON CONFLICT (deal_id, task_key) DO UPDATE SET completed = true, completed_by = 'intake-form-auto', completed_at = NOW()
    `, form.deal_id);

    return NextResponse.json({ success: true, status: 'completed' });
  } catch (error: any) {
    console.error('Intake submit error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/intake/[token] — Public: auto-save progress
export async function PATCH(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;
    const body = await req.json();
    const { formData } = body;

    if (!formData) {
      return NextResponse.json({ error: 'formData is required' }, { status: 400 });
    }

    // Validate token is active and not completed
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, status, expires_at FROM intake_forms
      WHERE token = ${token} LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    if (rows[0].status === 'completed') {
      return NextResponse.json({ error: 'Form already submitted' }, { status: 409 });
    }

    // Don't persist raw SSN in auto-save — strip it
    const dataToSave = { ...formData };
    if (dataToSave.q4_ssn) {
      delete dataToSave.q4_ssn;
    }

    const jsonData = JSON.stringify(dataToSave);

    await prisma.$executeRaw`
      UPDATE intake_forms
      SET form_data = ${jsonData}::jsonb,
          updated_at = NOW()
      WHERE token = ${token}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Intake auto-save error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
