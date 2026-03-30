/**
 * DocuSign Connect Webhook Endpoint
 *
 * Receives real-time envelope status updates from DocuSign Connect.
 * Verifies HMAC signature and updates envelope status in database.
 *
 * Setup:
 * 1. Configure Connect in DocuSign Admin (Settings → Connect → Add Configuration)
 * 2. Set webhook URL: https://your-domain.com/api/webhooks/docusign
 * 3. Add HMAC key (1-50 chars) and store in DOCUSIGN_HMAC_SECRET env var
 * 4. Subscribe to events: envelope-sent, envelope-delivered, envelope-completed, envelope-declined, envelope-voided
 * 5. Enable "Include HMAC Signature" in Connect config
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  verifyWebhookHMAC,
  parseWebhookPayload,
  type DocuSignWebhookPayload,
} from '@/lib/docusign-client';

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Get raw payload (needed for HMAC verification)
    const payload = await req.text();
    const signature = req.headers.get('X-DocuSign-Signature-1') || '';

    // 2. Verify HMAC signature
    if (!verifyWebhookHMAC(payload, signature)) {
      console.error('[docusign/webhook] Invalid HMAC signature');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid signature' },
        { status: 401 }
      );
    }

    // 3. Parse payload
    const data = parseWebhookPayload(payload);
    if (!data) {
      console.error('[docusign/webhook] Failed to parse payload');
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      );
    }

    // 4. Extract envelope data
    const {
      envelopeId,
      status,
      emailSubject,
      recipients,
    } = data.data;

    const signers = recipients?.signers ?? [];
    const signerEmails = signers.map(s => s.email.toLowerCase());

    console.log(
      `[docusign/webhook] Received ${data.event} for envelope ${envelopeId} (status: ${status})`
    );

    // 5. Determine if this is an IAA or paperwork envelope
    const subjectLower = (emailSubject ?? '').toLowerCase();
    const isIAA = subjectLower.includes('iaa');

    // 6. Update database (upsert by signer email match)
    if (signerEmails.length > 0) {
      if (isIAA) {
        await pool.query(
          `UPDATE transition_clients
           SET docusign_iaa_status = $1,
               docusign_iaa_envelope_id = $2,
               docusign_last_checked = NOW()
           WHERE EXISTS (
             SELECT 1 FROM unnest($3::text[]) AS e
             WHERE LOWER(transition_clients.primary_email) = e
           )`,
          [status, envelopeId, signerEmails]
        );
      } else {
        await pool.query(
          `UPDATE transition_clients
           SET docusign_paperwork_status = $1,
               docusign_paperwork_envelope_id = $2,
               docusign_last_checked = NOW()
           WHERE EXISTS (
             SELECT 1 FROM unnest($3::text[]) AS e
             WHERE LOWER(transition_clients.primary_email) = e
           )`,
          [status, envelopeId, signerEmails]
        );
      }
    }

    // 7. Log webhook event (optional - for debugging/audit trail)
    await logWebhookEvent(data);

    // 8. Return success (MUST return 200 or DocuSign will retry)
    return NextResponse.json({
      received: true,
      envelopeId,
      status,
      event: data.event,
    });

  } catch (error) {
    console.error('[docusign/webhook] Error processing webhook:', error);

    // Return 200 even on error to prevent DocuSign retries
    // (log the error but acknowledge receipt)
    return NextResponse.json({
      received: true,
      error: 'Internal processing error (logged)',
    });
  }
}

// ── Webhook Event Logging (Optional) ──────────────────────────────────────────

async function logWebhookEvent(data: DocuSignWebhookPayload): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO docusign_webhook_events (
        event_type,
        envelope_id,
        status,
        email_subject,
        received_at,
        payload
      ) VALUES ($1, $2, $3, $4, NOW(), $5)
      ON CONFLICT (envelope_id, event_type, received_at) DO NOTHING`,
      [
        data.event,
        data.data.envelopeId,
        data.data.status,
        data.data.emailSubject ?? '',
        JSON.stringify(data),
      ]
    );
  } catch (err) {
    // Non-critical - just log and continue
    console.warn('[docusign/webhook] Could not log event:', err);
  }
}

export const dynamic = 'force-dynamic';
