import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const AXM_EMAIL = process.env.AXM_EMAIL || 'ax@farther.com';
const SENDER_EMAIL = process.env.AX_SENDER_EMAIL || 'ax@farther.com';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    // Validate token
    const tokenResult = await pool.query(
      `SELECT id, deal_id, contact_id, contact_email, advisor_name, status, expires_at
       FROM tech_intake_tokens
       WHERE token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const tokenRow = tokenResult.rows[0];

    if (tokenRow.status === 'completed') {
      return NextResponse.json({ error: 'This form has already been submitted' }, { status: 409 });
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This form link has expired' }, { status: 410 });
    }

    const body = await req.json();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';

    // Save submission
    await pool.query(
      `INSERT INTO tech_intake_submissions (
        token_id, deal_id,
        laptop_choice, has_monitors,
        ship_to, shipping_street, shipping_city, shipping_state, shipping_zip, phone,
        travel_dates,
        has_commercial_office, has_it_vendor,
        it_vendor_company, it_vendor_contact, it_vendor_phone, it_vendor_email,
        software_suite, has_domain, domain_names,
        launch_date,
        ip_address
      ) VALUES (
        $1, $2,
        $3, $4,
        $5, $6, $7, $8, $9, $10,
        $11,
        $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20,
        $21,
        $22
      )`,
      [
        tokenRow.id, tokenRow.deal_id,
        body.laptop_choice || null, body.has_monitors ?? null,
        body.ship_to || null, body.shipping_street || null, body.shipping_city || null,
        body.shipping_state || null, body.shipping_zip || null, body.phone || null,
        body.travel_dates || null,
        body.has_commercial_office ?? null, body.has_it_vendor ?? null,
        body.it_vendor_company || null, body.it_vendor_contact || null,
        body.it_vendor_phone || null, body.it_vendor_email || null,
        body.software_suite || null, body.has_domain ?? null, body.domain_names || null,
        body.launch_date || null,
        ip,
      ]
    );

    // Mark token as completed
    await pool.query(
      `UPDATE tech_intake_tokens SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [tokenRow.id]
    );

    // Send notification email to AXM team via HubSpot engagement (non-blocking)
    if (HUBSPOT_PAT) {
      const notifBody = buildNotificationEmail(tokenRow.advisor_name, body);
      fetch('https://api.hubapi.com/crm/v3/objects/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: {
            hs_email_subject: `[Tech Intake Completed] ${tokenRow.advisor_name}`,
            hs_email_text: notifBody,
            hs_email_html: notifBody.replace(/\n/g, '<br>'),
            hs_email_direction: 'EMAIL',
            hs_email_status: 'SEND',
            hs_timestamp: new Date().toISOString(),
            hs_email_sender_email: SENDER_EMAIL,
            hs_email_sender_firstname: 'AX',
            hs_email_sender_lastname: 'Command Center',
            hs_email_to_email: AXM_EMAIL,
          },
        }),
      }).catch(err => console.error('[tech-intake] AXM notification email failed:', err));
    }

    return NextResponse.json({ success: true, message: 'Form submitted successfully' });
  } catch (err) {
    console.error('[tech-intake submit]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildNotificationEmail(advisorName: string, data: Record<string, unknown>): string {
  const lines: string[] = [
    `Technology Intake Form — ${advisorName}`,
    `Submitted: ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`,
    '',
    '═══ EQUIPMENT ═══',
    `Laptop: ${data.laptop_choice || '—'}`,
    `Has Monitors: ${data.has_monitors === true ? 'Yes' : data.has_monitors === false ? 'No — shipping 2 monitors' : '—'}`,
    '',
    '═══ SHIPPING ═══',
    `Ship To: ${data.ship_to || '—'}`,
    `Address: ${data.shipping_street || '—'}`,
    `City/State/ZIP: ${[data.shipping_city, data.shipping_state, data.shipping_zip].filter(Boolean).join(', ') || '—'}`,
    `Phone: ${data.phone || '—'}`,
    '',
    '═══ AVAILABILITY ═══',
    `Travel Dates to Avoid: ${data.travel_dates || 'None provided'}`,
    '',
    '═══ OFFICE & IT ═══',
    `Commercial Office: ${data.has_commercial_office === true ? 'Yes' : data.has_commercial_office === false ? 'No' : '—'}`,
    `Third Party IT Vendor: ${data.has_it_vendor === true ? 'Yes' : data.has_it_vendor === false ? 'No' : '—'}`,
  ];

  if (data.has_it_vendor) {
    lines.push(
      `  Company: ${data.it_vendor_company || '—'}`,
      `  Contact: ${data.it_vendor_contact || '—'}`,
      `  Phone: ${data.it_vendor_phone || '—'}`,
      `  Email: ${data.it_vendor_email || '—'}`,
    );
  }

  lines.push(
    '',
    '═══ SOFTWARE & DOMAINS ═══',
    `Software Suite: ${data.software_suite || '—'}`,
    `Has Domain Names: ${data.has_domain === true ? 'Yes' : data.has_domain === false ? 'No' : '—'}`,
  );

  if (data.has_domain) {
    lines.push(`  Domains: ${data.domain_names || '—'}`);
  }

  lines.push(
    '',
    '═══ LAUNCH ═══',
    `Launch Date: ${data.launch_date || '—'}`,
    '',
    '— Sent automatically by AX Command Center',
  );

  return lines.join('\n');
}

export const dynamic = 'force-dynamic';
