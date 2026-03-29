import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { chatCompletion, MODELS } from '@/lib/aizolo';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://farther-billing-portal-production.up.railway.app';

// ── Branded HTML email template ─────────────────────────────────────────────
function buildBrandedEmail({
  bodyText,
  formLink,
  expiresDate,
  axmName,
  axmEmail,
  axmPhone,
  axmCalendar,
}: {
  bodyText: string;
  formLink: string;
  expiresDate: string;
  axmName: string;
  axmEmail: string;
  axmPhone: string | null;
  axmCalendar: string | null;
}) {
  // Convert AI body text newlines to HTML paragraphs
  const bodyHtml = bodyText
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#333333;">${line}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#2C3B4E;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#2C3B4E;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-radius:14px 14px 0 0;background:linear-gradient(135deg,#2C3B4E 0%,#344F5D 100%);border:1px solid rgba(248,244,240,0.08);border-bottom:none;">
              <p style="margin:0;font-size:14px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#3B5A69;">Farther</p>
              <h1 style="margin:12px 0 0;font-size:24px;font-weight:300;color:#F8F4F0;font-family:Georgia,'Times New Roman',serif;">U4 &amp; 2B Intake Form</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;background:#ffffff;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">

              ${bodyHtml}

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="${formLink}" target="_blank" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#3B5A69,#3B5A69);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;box-shadow:0 4px 16px rgba(29,118,130,0.3);">
                      Complete Your Form
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Checklist -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;padding:20px 24px;background:#f8fafb;border-radius:8px;border:1px solid #e5e7eb;">
                <tr>
                  <td>
                    <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#3B5A69;">Have These Ready</p>
                    <p style="margin:0 0 6px;font-size:13px;color:#555;">&#10003; CRD number</p>
                    <p style="margin:0 0 6px;font-size:13px;color:#555;">&#10003; Social Security Number</p>
                    <p style="margin:0 0 6px;font-size:13px;color:#555;">&#10003; Employment history (last 10 years)</p>
                    <p style="margin:0 0 6px;font-size:13px;color:#555;">&#10003; Residential addresses (last 5 years)</p>
                    <p style="margin:0;font-size:13px;color:#555;">&#10003; Professional designations &amp; licensing info</p>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#999;">This link is unique to you and expires on ${expiresDate}. The form takes approximately 15–20 minutes.</p>

              <!-- AXM signature -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 0;padding:20px 0 0;border-top:1px solid #e5e7eb;">
                <tr>
                  <td>
                    <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#333333;">${axmName}</p>
                    <p style="margin:0 0 8px;font-size:13px;color:#3B5A69;">Advisor Experience Manager</p>
                    ${axmEmail ? `<p style="margin:0 0 2px;font-size:13px;color:#555;">&#9993; <a href="mailto:${axmEmail}" style="color:#3B5A69;text-decoration:none;">${axmEmail}</a></p>` : ''}
                    ${axmPhone ? `<p style="margin:0 0 2px;font-size:13px;color:#555;">&#9743; ${axmPhone}</p>` : ''}
                    ${axmCalendar ? `<p style="margin:0;font-size:13px;"><a href="${axmCalendar}" style="color:#3B5A69;text-decoration:none;">Schedule a call &#8594;</a></p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;border-radius:0 0 14px 14px;background:linear-gradient(135deg,#2C3B4E 0%,#344F5D 100%);border:1px solid rgba(248,244,240,0.08);border-top:none;">
              <p style="margin:0 0 4px;font-size:12px;color:rgba(248,244,240,0.4);">Farther Finance Advisors LLC</p>
              <p style="margin:0;font-size:11px;color:rgba(248,244,240,0.25);">This is a secure, one-time-use form link. Do not forward this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { dealId, contactId, contactEmail, advisorName } = await req.json();

  if (!dealId || !contactEmail || !advisorName) {
    return NextResponse.json({ error: 'dealId, contactEmail, and advisorName are required' }, { status: 400 });
  }

  try {
    // ── Look up assigned AXM for this deal ──────────────────────────────────
    const axmResult = await pool.query(
      `SELECT t.name, t.email, t.phone, t.calendar_link
       FROM advisor_assignments a
       JOIN team_members t ON a.member_id = t.id
       WHERE a.deal_id = $1 AND a.role = 'AXM'
       LIMIT 1`,
      [dealId]
    );

    const axm = axmResult.rows[0] || null;
    const axmName = axm?.name || session.user?.name || 'Farther AX Team';
    const axmEmail = axm?.email || session.user?.email || '';
    const axmPhone = axm?.phone || null;
    const axmCalendar = axm?.calendar_link || null;
    const axmFirstName = axmName.split(' ')[0];
    const advisorFirstName = advisorName.split(' ')[0];

    // ── Create token row ────────────────────────────────────────────────────
    const tokenResult = await pool.query(
      `INSERT INTO u4_2b_tokens (deal_id, contact_id, contact_email, advisor_name, sent_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, token, expires_at`,
      [dealId, contactId || null, contactEmail, advisorName, axmEmail]
    );
    const { token, expires_at } = tokenResult.rows[0];
    const formLink = `${APP_URL}/forms/u4-2b/${token}`;
    const expiresDate = new Date(expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // ── Use AiZolo to write a personalized email body ──────────────────────
    let emailBodyText: string;

    try {
      emailBodyText = await chatCompletion(
        MODELS.MINI,
        [
          {
            role: 'system',
            content: `You are writing a short, friendly, professional email from ${axmName} (Advisor Experience Manager at Farther) to ${advisorName}, a financial advisor who is onboarding with Farther.

The email asks them to complete their U4 & 2B Intake Form — a regulatory compliance form needed for their registration filing.

Rules:
- Start with "Hi ${advisorFirstName}," (greeting is required)
- Keep it to 3-4 short paragraphs maximum
- Warm, supportive tone — this is an exciting milestone, not a bureaucratic chore
- Mention that this is one of the key steps in getting them officially registered
- Gently encourage completing it as soon as possible so there are no delays in their launch
- Do NOT include the form link (it will be added as a button below)
- Do NOT include a signature (it will be added separately)
- Do NOT include a checklist of what to have ready (it will be added separately)
- Do NOT use placeholder brackets like [Name] — use actual names
- Do NOT say "please find attached" or reference attachments
- End the last paragraph naturally — no "Best regards" or sign-off needed`,
          },
          {
            role: 'user',
            content: `Write the email body for ${advisorName} from ${axmName}. The advisor's first name is ${advisorFirstName} and the AXM's first name is ${axmFirstName}.`,
          },
        ],
        { max_tokens: 400, temperature: 0.6 },
      );
      emailBodyText = emailBodyText.trim();
    } catch (aiErr) {
      console.error('[u4-2b send] AiZolo email generation failed, using fallback:', aiErr);
      emailBodyText = '';
    }

    // Fallback if AI fails or returns empty
    if (!emailBodyText) {
      emailBodyText = `Hi ${advisorFirstName},

Exciting news — we're making great progress on your transition to Farther! One of the next key steps is completing your U4 & 2B Intake Form, which we need for your official registration filing.

The form covers the standard regulatory information (employment history, designations, personal details) and should take about 15–20 minutes to complete. The sooner we have this back, the faster we can keep things moving toward your launch.

If you have any questions while filling it out, don't hesitate to reach out — I'm here to make this as smooth as possible for you.`;
    }

    // ── Build branded HTML email ────────────────────────────────────────────
    const emailHtml = buildBrandedEmail({
      bodyText: emailBodyText,
      formLink,
      expiresDate,
      axmName,
      axmEmail,
      axmPhone,
      axmCalendar,
    });

    // Plain text version (for hs_email_text)
    const plainText = `${emailBodyText}\n\nComplete your form here: ${formLink}\n\nHave these ready:\n- CRD number\n- Social Security Number\n- Employment history (last 10 years)\n- Residential addresses (last 5 years)\n- Professional designations & licensing info\n\nThis link expires on ${expiresDate}.\n\n${axmName}\nAdvisor Experience Manager\n${axmEmail}${axmPhone ? `\n${axmPhone}` : ''}`;

    // ── Send via HubSpot engagement ─────────────────────────────────────────
    const emailRes = await fetch('https://api.hubapi.com/crm/v3/objects/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          hs_email_subject: `Your U4 & 2B Intake Form — Let's Keep the Momentum Going!`,
          hs_email_text: plainText,
          hs_email_html: emailHtml,
          hs_email_direction: 'EMAIL',
          hs_email_status: 'SEND',
          hs_timestamp: new Date().toISOString(),
          hs_email_sender_email: axmEmail,
          hs_email_sender_firstname: axmFirstName,
          hs_email_sender_lastname: axmName.split(' ').slice(1).join(' ') || '',
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
      token,
      formLink,
      emailId,
      sentFrom: axmName,
    });
  } catch (err) {
    console.error('[u4-2b send]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
