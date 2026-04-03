import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const COMPLIANCE_EMAIL = process.env.COMPLIANCE_EMAIL || 'compliance@farther.com';
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
    const tokenResult = await prisma.$queryRaw<Array<{
      id: number;
      deal_id: string;
      contact_id: string | null;
      contact_email: string;
      advisor_name: string;
      status: string;
      expires_at: Date;
    }>>`
      SELECT id, deal_id, contact_id, contact_email, advisor_name, status, expires_at
      FROM u4_2b_tokens
      WHERE token = ${token}
    `;

    if (tokenResult.length === 0) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const tokenRow = tokenResult[0];

    if (tokenRow.status === 'completed') {
      return NextResponse.json({ error: 'This form has already been submitted' }, { status: 409 });
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This form link has expired' }, { status: 410 });
    }

    const body = await req.json();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';

    // Save submission
    await prisma.$executeRaw`
      INSERT INTO u4_2b_submissions (
        token_id, deal_id,
        full_name, business_address, other_jurisdictions, texas_clients,
        start_date, position_title, independent_contractor,
        personal_email, date_of_birth, state_of_birth, height_ft, height_in,
        weight, sex, hair_color, eye_color, ssn, crd_number, series_65_registered,
        iar_qualifications, series_65_exam_date, other_designations,
        designations_confirmed, designations_comments,
        insurance_licensed, insurance_date, insurance_type, agency_name, agency_address,
        insurance_hours_month, insurance_trading_hours,
        is_cpa, cpa_year, cpa_confirmed, education,
        other_business_activities, employment_history, residential_history,
        disclosures, income_new_client, compensation_asset_based,
        ip_address
      ) VALUES (
        ${tokenRow.id}, ${tokenRow.deal_id},
        ${body.full_name || null}, ${body.business_address || null}, ${body.other_jurisdictions || null}, ${body.texas_clients ?? null},
        ${body.start_date || null}, ${body.position_title || null}, ${body.independent_contractor ?? null},
        ${body.personal_email || null}, ${body.date_of_birth || null}, ${body.state_of_birth || null},
        ${body.height_ft ?? null}, ${body.height_in ?? null},
        ${body.weight ?? null}, ${body.sex || null}, ${body.hair_color || null}, ${body.eye_color || null},
        ${body.ssn || null}, ${body.crd_number || null}, ${body.series_65_registered ?? null},
        ${body.iar_qualifications ? JSON.stringify(body.iar_qualifications) : null},
        ${body.series_65_exam_date || null}, ${body.other_designations || null},
        ${body.designations_confirmed ?? null}, ${body.designations_comments || null},
        ${body.insurance_licensed ?? null}, ${body.insurance_date || null}, ${body.insurance_type || null},
        ${body.agency_name || null}, ${body.agency_address || null},
        ${body.insurance_hours_month || null}, ${body.insurance_trading_hours || null},
        ${body.is_cpa ?? null}, ${body.cpa_year || null}, ${body.cpa_confirmed ?? null},
        ${body.education ? JSON.stringify(body.education) : null},
        ${body.other_business_activities ? JSON.stringify(body.other_business_activities) : null},
        ${body.employment_history ? JSON.stringify(body.employment_history) : null},
        ${body.residential_history ? JSON.stringify(body.residential_history) : null},
        ${body.disclosures ? JSON.stringify(body.disclosures) : null},
        ${body.income_new_client ?? null}, ${body.compensation_asset_based ?? null},
        ${ip}
      )
    `;

    // Mark token as completed
    await prisma.$executeRaw`
      UPDATE u4_2b_tokens SET status = 'completed', completed_at = NOW() WHERE id = ${tokenRow.id}
    `;

    // Update HubSpot contact with key fields (non-blocking)
    if (tokenRow.contact_id && HUBSPOT_PAT) {
      const hubspotProps: Record<string, string> = {};
      if (body.crd_number) hubspotProps.crd_number = body.crd_number;
      if (body.business_address) hubspotProps.address = body.business_address;
      if (body.personal_email) hubspotProps.hs_additional_emails = body.personal_email;
      if (body.date_of_birth) hubspotProps.date_of_birth = body.date_of_birth;

      if (Object.keys(hubspotProps).length > 0) {
        fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${tokenRow.contact_id}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ properties: hubspotProps }),
        }).catch(err => console.error('[u4-2b] HubSpot contact update failed:', err));
      }
    }

    // Send compliance email via HubSpot engagement (non-blocking)
    if (HUBSPOT_PAT) {
      const complianceBody = buildComplianceEmail(tokenRow.advisor_name, body);
      fetch('https://api.hubapi.com/crm/v3/objects/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: {
            hs_email_subject: `[U4 & 2B Completed] ${tokenRow.advisor_name}`,
            hs_email_text: complianceBody,
            hs_email_html: complianceBody.replace(/\n/g, '<br>'),
            hs_email_direction: 'EMAIL',
            hs_email_status: 'SEND',
            hs_timestamp: new Date().toISOString(),
            hs_email_sender_email: SENDER_EMAIL,
            hs_email_sender_firstname: 'AX',
            hs_email_sender_lastname: 'Command Center',
            hs_email_to_email: COMPLIANCE_EMAIL,
          },
        }),
      }).catch(err => console.error('[u4-2b] Compliance email failed:', err));
    }

    return NextResponse.json({ success: true, message: 'Form submitted successfully' });
  } catch (err) {
    console.error('[u4-2b submit]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildComplianceEmail(advisorName: string, data: Record<string, unknown>): string {
  const lines: string[] = [
    `U4 & 2B Intake Form — ${advisorName}`,
    `Submitted: ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`,
    '',
    '═══ SECTION 1: GENERAL INFORMATION ═══',
    `Full Name: ${data.full_name || '—'}`,
    `Business Address: ${data.business_address || '—'}`,
    `Other Jurisdictions: ${data.other_jurisdictions || '—'}`,
    `Texas Clients: ${data.texas_clients ? 'Yes' : 'No'}`,
    `Start Date: ${data.start_date || '—'}`,
    `Position/Title: ${data.position_title || '—'}`,
    `Independent Contractor: ${data.independent_contractor ? 'Yes' : 'No'}`,
    '',
    '═══ SECTION 2: PERSONAL INFORMATION ═══',
    `Personal Email: ${data.personal_email || '—'}`,
    `Date of Birth: ${data.date_of_birth || '—'}`,
    `State of Birth: ${data.state_of_birth || '—'}`,
    `Height: ${data.height_ft || '—'}\'${data.height_in || '0'}"`,
    `Weight: ${data.weight || '—'}`,
    `Sex: ${data.sex || '—'}`,
    `Hair Color: ${data.hair_color || '—'}`,
    `Eye Color: ${data.eye_color || '—'}`,
    `SSN: [Stored securely — access via AX Command Center]`,
    `CRD Number: ${data.crd_number || '—'}`,
    `Series 65 Registered: ${data.series_65_registered ? 'Yes' : 'No'}`,
    '',
    '═══ SECTION 3: QUALIFICATIONS & LICENSING ═══',
    `IAR Qualifications: ${JSON.stringify(data.iar_qualifications) || '—'}`,
    `Series 65 Exam Date: ${data.series_65_exam_date || '—'}`,
    `Other Designations: ${data.other_designations || '—'}`,
    `Designations Confirmed: ${data.designations_confirmed ? 'Yes' : 'No'}`,
    `Insurance Licensed: ${data.insurance_licensed ? 'Yes' : 'No'}`,
    `Is CPA: ${data.is_cpa ? 'Yes' : 'No'}`,
    '',
    '═══ SECTION 4: EMPLOYMENT & DISCLOSURES ═══',
    `Employment History: ${JSON.stringify(data.employment_history) || '—'}`,
    `Residential History: ${JSON.stringify(data.residential_history) || '—'}`,
    `OBA Activities: ${JSON.stringify(data.other_business_activities) || '—'}`,
    `Disclosures: ${JSON.stringify(data.disclosures) || '—'}`,
    `Income from New Clients: ${data.income_new_client ? 'Yes' : 'No'}`,
    `Compensation Asset-Based: ${data.compensation_asset_based ? 'Yes' : 'No'}`,
    '',
    '— Sent automatically by AX Command Center',
  ];
  return lines.join('\n');
}

export const dynamic = 'force-dynamic';
