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
import { prisma } from '@/lib/prisma';
import {
  verifyWebhookHMAC,
  parseWebhookPayload,
  type DocuSignWebhookPayload,
} from '@/lib/docusign-client';
import { getRedis } from '@/lib/redis-client';

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

    // 4. Check idempotency (prevent duplicate processing on retry)
    const idempotencyKey = `docusign-wh-${data.data.envelopeId}-${data.event}`;
    const redis = getRedis();
    if (redis) {
      try {
        const existing = await redis.get(idempotencyKey);
        if (existing) {
          console.log(`[docusign/webhook] Deduplicated webhook: ${idempotencyKey}`);
          return NextResponse.json({ received: true, deduplicated: true });
        }
      } catch (err) {
        console.warn('[docusign/webhook] Failed to check idempotency in Redis:', err);
        // Graceful degradation: continue without dedup
      }
    }

    // 5. Extract envelope data
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

    // 6. Determine if this is an IAA or paperwork envelope
    const subjectLower = (emailSubject ?? '').toLowerCase();
    const isIAA = subjectLower.includes('iaa');

    // 7. Update database (upsert by signer email match) using Prisma
    if (signerEmails.length > 0) {
      if (isIAA) {
        // Update all transition clients matching any of the signer emails (IAA envelope)
        await prisma.transitionClient.updateMany({
          where: {
            primary_email: {
              in: signerEmails,
              mode: 'insensitive', // Case-insensitive match
            },
          },
          data: {
            docusign_iaa_status: status,
            docusign_iaa_envelope_id: envelopeId,
          },
        });
      } else {
        // Update all transition clients matching any of the signer emails (Paperwork envelope)
        await prisma.transitionClient.updateMany({
          where: {
            primary_email: {
              in: signerEmails,
              mode: 'insensitive',
            },
          },
          data: {
            docusign_paperwork_status: status,
            docusign_paperwork_envelope_id: envelopeId,
          },
        });
      }
    }

    // 8. Log number of clients updated
    console.log(`[docusign/webhook] Updated transition clients with ${isIAA ? 'IAA' : 'Paperwork'} status for emails: ${signerEmails.join(', ')}`);

    // 9. Mark webhook as processed in Redis (24h TTL)
    if (redis) {
      try {
        await redis.set(idempotencyKey, '1', 'EX', 86400); // 24 hours
      } catch (err) {
        console.warn('[docusign/webhook] Failed to set idempotency key in Redis:', err);
      }
    }

    // 10. Return success (MUST return 200 or DocuSign will retry)
    return NextResponse.json({
      received: true,
      envelopeId,
      status,
      event: data.event,
      signerEmails,
      type: isIAA ? 'IAA' : 'Paperwork',
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

export const dynamic = 'force-dynamic';
