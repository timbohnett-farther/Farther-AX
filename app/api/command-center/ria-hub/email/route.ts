import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';

// Email templates for common advisor communications
const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  welcome: {
    subject: 'Welcome to Farther — Your Transition Team',
    body: `Hi {{firstName}},

Welcome to Farther! We're thrilled to have you join our community of independent advisors.

Your Advisor Experience team is here to ensure a smooth, seamless transition. Here's what you can expect over the coming weeks:

1. **Kickoff Call** — We'll schedule an introductory call to align on your timeline and priorities.
2. **Tech Setup** — Our team will get your technology stack configured and tested.
3. **Client Communication** — We'll work with you on a client communication strategy.
4. **Launch Day** — A coordinated, stress-free launch with your dedicated team by your side.

Your dedicated AXM will be reaching out shortly to schedule your kickoff call. In the meantime, please don't hesitate to reach out with any questions.

Best regards,
{{senderName}}
Farther Advisor Experience Team`,
  },
  checkin: {
    subject: 'Checking In — {{dealName}} Transition Update',
    body: `Hi {{firstName}},

I wanted to check in and see how everything is progressing on your end. Here's a quick summary of where we stand:

- **Stage**: {{stage}}
- **Target Launch**: {{launchDate}}

Please let me know if you have any questions, concerns, or if there's anything we can help move forward.

Looking forward to connecting soon.

Best,
{{senderName}}`,
  },
  launch_reminder: {
    subject: 'Launch Day Approaching — {{dealName}}',
    body: `Hi {{firstName}},

Your launch date is approaching! I wanted to confirm the details and ensure we're fully aligned:

- **Launch Date**: {{launchDate}}
- **Transition Type**: {{transitionType}}

Here's what to expect on launch day:
1. Your custodian migration sequence will begin
2. We'll have a Day 1 call to walk through tech setup
3. Your CX pod will be introduced for ongoing support

Please confirm that everything is on track from your side. If you have any last-minute questions, now is the time!

Best,
{{senderName}}`,
  },
  post_launch: {
    subject: 'Congratulations on Your Launch — Next Steps',
    body: `Hi {{firstName}},

Congratulations on officially launching with Farther! This is a huge milestone, and we're proud to be part of your journey.

Here's what happens next:
1. **Client Gift Boxes** — We'll be sending welcome packages to your clients
2. **CX Pod Introduction** — Your dedicated client experience team will be in touch
3. **Householding & Billing** — We'll get your BlackDiamond setup finalized
4. **Graduation** — Over the next 90 days, we'll work toward full independence

Your AXM remains your primary point of contact throughout this transition period.

Welcome to the Farther family!

Best,
{{senderName}}`,
  },
  document_request: {
    subject: 'Document Request — {{dealName}}',
    body: `Hi {{firstName}},

As we continue progressing with your transition, we need the following documents at your earliest convenience:

- [ ] Signed IAAs
- [ ] Updated client list
- [ ] Tech procurement form
- [ ] Any outstanding compliance documentation

Please upload these to your shared Google Drive folder or reply to this email with the documents attached.

Thank you for your prompt attention to this.

Best,
{{senderName}}`,
  },
  meeting_followup: {
    subject: 'Follow-Up — {{dealName}} Meeting Notes',
    body: `Hi {{firstName}},

Thank you for taking the time to meet today. Here's a recap of what we discussed:

**Key Takeaways:**
- [Meeting notes here]

**Action Items:**
- [ ] [Action item 1]
- [ ] [Action item 2]

**Next Steps:**
- [Next meeting / milestone]

Please let me know if I missed anything or if you have additional questions.

Best,
{{senderName}}`,
  },
};

function resolveTemplate(
  templateBody: string,
  templateSubject: string,
  vars: Record<string, string>
): { subject: string; body: string } {
  let subject = templateSubject;
  let body = templateBody;
  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    subject = subject.replace(pattern, value || '');
    body = body.replace(pattern, value || '');
  }
  return { subject, body };
}

// GET — return available templates
export async function GET() {
  const templates = Object.entries(EMAIL_TEMPLATES).map(([key, { subject }]) => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    subject,
  }));
  return NextResponse.json({ templates });
}

// POST — send email via HubSpot engagement
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    dealId,
    contactId,
    contactEmail,
    templateKey,
    customSubject,
    customBody,
    templateVars,
  } = await req.json();

  if (!contactEmail) {
    return NextResponse.json({ error: 'Contact email is required' }, { status: 400 });
  }

  let subject: string;
  let body: string;

  if (templateKey && EMAIL_TEMPLATES[templateKey]) {
    const template = EMAIL_TEMPLATES[templateKey];
    const resolved = resolveTemplate(template.body, template.subject, templateVars || {});
    subject = resolved.subject;
    body = resolved.body;
  } else if (customSubject && customBody) {
    subject = customSubject;
    body = customBody;
  } else {
    return NextResponse.json({ error: 'Either a template key or custom subject/body required' }, { status: 400 });
  }

  try {
    // Create email engagement in HubSpot so it's tracked
    const emailRes = await fetch('https://api.hubapi.com/crm/v3/objects/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          hs_email_subject: subject,
          hs_email_text: body,
          hs_email_html: body.replace(/\n/g, '<br>'),
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

    if (!emailRes.ok) {
      const errData = await emailRes.json();
      throw new Error(`HubSpot email creation failed: ${JSON.stringify(errData)}`);
    }

    const emailData = await emailRes.json();
    const emailId = emailData.id;

    // Associate email with deal
    if (dealId) {
      await fetch(
        `https://api.hubapi.com/crm/v4/objects/emails/${emailId}/associations/deals/${dealId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_PAT}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 186 }]),
        }
      );
    }

    // Associate email with contact
    if (contactId) {
      await fetch(
        `https://api.hubapi.com/crm/v4/objects/emails/${emailId}/associations/contacts/${contactId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_PAT}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 198 }]),
        }
      );
    }

    return NextResponse.json({ success: true, emailId, subject });
  } catch (err) {
    console.error('[ria-hub email]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
