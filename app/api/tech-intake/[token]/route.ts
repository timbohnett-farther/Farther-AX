import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const result = await prisma.$queryRaw<Array<{
      id: number;
      deal_id: string;
      contact_id: string | null;
      advisor_name: string;
      contact_email: string;
      status: string;
      expires_at: Date;
      completed_at: Date | null;
    }>>`
      SELECT id, deal_id, contact_id, advisor_name, contact_email, status, expires_at, completed_at
      FROM tech_intake_tokens
      WHERE token = ${token}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const row = result[0];

    // Check if expired
    if (new Date(row.expires_at) < new Date()) {
      await prisma.$executeRaw`
        UPDATE tech_intake_tokens SET status = 'expired' WHERE id = ${row.id} AND status != 'completed'
      `;
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

    // Fetch HubSpot prefill data
    const prefill: Record<string, string | null> = {
      phone: null,
      city: null,
      state: null,
      zip: null,
      launchDate: null,
      softwareSuite: null,
    };

    if (HUBSPOT_PAT) {
      // Fetch contact data (phone, city, state, zip)
      if (row.contact_id) {
        try {
          const contactRes = await fetch(
            `https://api.hubapi.com/crm/v3/objects/contacts/${row.contact_id}?properties=phone,mobilephone,city,state,zip`,
            { headers: { Authorization: `Bearer ${HUBSPOT_PAT}` } }
          );
          if (contactRes.ok) {
            const contactData = await contactRes.json();
            const p = contactData.properties || {};
            prefill.phone = p.phone || p.mobilephone || null;
            prefill.city = p.city || null;
            prefill.state = p.state || null;
            prefill.zip = p.zip || null;
          }
        } catch (err) {
          console.error('[tech-intake] HubSpot contact fetch failed:', err);
        }
      }

      // Fetch deal data (launch date, software suite)
      if (row.deal_id) {
        try {
          const dealRes = await fetch(
            `https://api.hubapi.com/crm/v3/objects/deals/${row.deal_id}?properties=desired_start_date,crm_platform__cloned_,technology_platforms_being_used__cloned_`,
            { headers: { Authorization: `Bearer ${HUBSPOT_PAT}` } }
          );
          if (dealRes.ok) {
            const dealData = await dealRes.json();
            const dp = dealData.properties || {};
            prefill.launchDate = dp.desired_start_date || null;
            prefill.softwareSuite = dp.crm_platform__cloned_ || dp.technology_platforms_being_used__cloned_ || null;
          }
        } catch (err) {
          console.error('[tech-intake] HubSpot deal fetch failed:', err);
        }
      }
    }

    return NextResponse.json({
      status: row.status,
      advisorName: row.advisor_name,
      contactEmail: row.contact_email,
      expiresAt: row.expires_at,
      prefill,
    });
  } catch (err) {
    console.error('[tech-intake token validate]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
