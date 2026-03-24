import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// POST /api/command-center/intake — Create intake form + send email
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { dealId, contactId, advisorName, advisorEmail } = body;

    if (!dealId || !advisorEmail) {
      return NextResponse.json({ error: 'dealId and advisorEmail are required' }, { status: 400 });
    }

    // Check for existing active intake (idempotent)
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id, token, status FROM intake_forms
      WHERE deal_id = ${dealId} AND status IN ('pending', 'in_progress')
      ORDER BY created_at DESC LIMIT 1
    `;

    if (existing.length > 0) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      return NextResponse.json({
        token: existing[0].token,
        intakeUrl: `${baseUrl}/intake/${existing[0].token}`,
        status: existing[0].status,
        message: 'Active intake form already exists for this deal',
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Expires in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Insert record
    await prisma.$executeRaw`
      INSERT INTO intake_forms (token, deal_id, contact_id, advisor_name, advisor_email, status, sent_by, sent_at, expires_at)
      VALUES (${token}, ${dealId}, ${contactId || null}, ${advisorName || null}, ${advisorEmail}, 'pending', ${user.email}, NOW(), ${expiresAt})
    `;

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const intakeUrl = `${baseUrl}/intake/${token}`;

    // Send email via HubSpot engagement API
    const hubspotToken = process.env.HUBSPOT_ACCESS_TOKEN;
    if (hubspotToken && contactId) {
      try {
        await fetch('https://api.hubapi.com/crm/v3/objects/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hubspotToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              hs_timestamp: new Date().toISOString(),
              hs_email_direction: 'EMAIL',
              hs_email_subject: 'Farther — U4 & 2B Intake Form',
              hs_email_text: `Hi ${advisorName || 'there'},\n\nPlease complete your U4 & 2B Intake Form using the link below. This form collects the regulatory information needed for your FINRA registration.\n\n${intakeUrl}\n\nThis link will expire in 30 days. Your progress is saved automatically.\n\nBest,\nFarther Advisory Experience Team`,
              hs_email_status: 'SENT',
            },
            associations: [
              {
                to: { id: contactId },
                types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 198 }],
              },
            ],
          }),
        });
      } catch (emailErr) {
        console.error('HubSpot email send failed (non-blocking):', emailErr);
      }
    }

    return NextResponse.json({
      token,
      intakeUrl,
      status: 'pending',
    });
  } catch (error: any) {
    console.error('Intake create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
