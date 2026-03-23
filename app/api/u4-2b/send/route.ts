import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://farther-billing-portal-production.up.railway.app';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { dealId, contactId, contactEmail, advisorName } = await req.json();

  if (!dealId || !contactEmail || !advisorName) {
    return NextResponse.json({ error: 'dealId, contactEmail, and advisorName are required' }, { status: 400 });
  }

  try {
    // Create token row
    const tokenResult = await pool.query(
      `INSERT INTO u4_2b_tokens (deal_id, contact_id, contact_email, advisor_name, sent_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, token, expires_at`,
      [dealId, contactId || null, contactEmail, advisorName, session.user?.email || '']
    );
    const { id: tokenId, token, expires_at } = tokenResult.rows[0];
    const formLink = `${APP_URL}/forms/u4-2b/${token}`;

    // Send email via HubSpot engagement
    const emailBody = `Hi ${advisorName.split(' ')[0]},

As part of your onboarding with Farther, we need you to complete the U4 & 2B Intake Form. This form collects the information we need for your registration and compliance filings.

Please click the link below to access the form:

${formLink}

This link is unique to you and will expire on ${new Date(expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.

The form has 4 sections and typically takes 15-20 minutes to complete. Please have the following ready:
- Your CRD number
- Employment history (last 10 years)
- Residential history (last 5 years)
- Social Security Number
- Professional designations and licensing information

If you have any questions, please don't hesitate to reach out.

Best regards,
${session.user?.name || 'Farther Advisor Experience Team'}
Farther Advisor Experience Team`;

    const emailRes = await fetch('https://api.hubapi.com/crm/v3/objects/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          hs_email_subject: `U4 & 2B Intake Form — ${advisorName}`,
          hs_email_text: emailBody,
          hs_email_html: emailBody.replace(/\n/g, '<br>').replace(formLink, `<a href="${formLink}" style="color:#1d7682;font-weight:600;">${formLink}</a>`),
          hs_email_direction: 'EMAIL',
          hs_email_status: 'SEND',
          hs_timestamp: new Date().toISOString(),
          hs_email_sender_email: session.user?.email || '',
          hs_email_sender_firstname: session.user?.name?.split(' ')[0] || '',
          hs_email_sender_lastname: session.user?.name?.split(' ').slice(1).join(' ') || '',
          hs_email_to_email: contactEmail,
        },
      }),
    });

    let emailId: string | null = null;

    if (emailRes.ok) {
      const emailData = await emailRes.json();
      emailId = emailData.id;

      // Associate email with deal
      if (dealId && emailId) {
        await fetch(
          `https://api.hubapi.com/crm/v4/objects/emails/${emailId}/associations/deals/${dealId}`,
          {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
            body: JSON.stringify([{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 186 }]),
          }
        );
      }

      // Associate email with contact
      if (contactId && emailId) {
        await fetch(
          `https://api.hubapi.com/crm/v4/objects/emails/${emailId}/associations/contacts/${contactId}`,
          {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
            body: JSON.stringify([{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 198 }]),
          }
        );
      }
    } else {
      console.error('[u4-2b send] HubSpot email failed:', await emailRes.text());
    }

    return NextResponse.json({
      success: true,
      tokenId,
      token,
      formLink,
      emailId,
    });
  } catch (err) {
    console.error('[u4-2b send]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
