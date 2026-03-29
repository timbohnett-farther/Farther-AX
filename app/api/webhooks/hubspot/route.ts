/**
 * HubSpot Webhook Listener — Near-real-time cache invalidation
 *
 * When HubSpot notifies us of a deal/contact change, we re-fetch the advisor
 * data using the EXISTING fetch logic and update the cache.
 *
 * Configure in HubSpot Developer Portal:
 *   Subscriptions: deal.propertyChange, deal.creation
 *   Target URL: https://your-domain.up.railway.app/api/webhooks/hubspot
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { writeThroughCache, invalidateCache } from '@/lib/cached-fetchers';
import { invalidatePattern } from '@/lib/redis-client';

const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET || '';

// ── Signature Verification ──────────────────────────────────────────────────

function verifySignature(
  requestBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return false;

  // HubSpot v3 signature: SHA-256 HMAC of request body
  const hash = crypto
    .createHmac('sha256', secret)
    .update(requestBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

// ── Webhook Handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.text();

  // Verify HubSpot signature if secret is configured
  if (HUBSPOT_CLIENT_SECRET) {
    const signature = request.headers.get('x-hubspot-signature-v3')
      || request.headers.get('x-hubspot-signature');

    if (!verifySignature(body, signature, HUBSPOT_CLIENT_SECRET)) {
      console.warn('[webhook] Invalid HubSpot signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let events: Array<{
    subscriptionType: string;
    objectId: number;
    propertyName?: string;
    propertyValue?: string;
  }>;

  try {
    events = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!Array.isArray(events)) {
    events = [events];
  }

  console.log(`[webhook] Received ${events.length} HubSpot events`);

  const processedDeals = new Set<string>();

  for (const event of events) {
    const dealId = event.objectId?.toString();
    if (!dealId || processedDeals.has(dealId)) continue;
    processedDeals.add(dealId);

    const eventType = event.subscriptionType;

    if (
      eventType === 'deal.propertyChange' ||
      eventType === 'deal.creation'
    ) {
      try {
        // Invalidate the advisor cache for this deal
        await invalidateCache('advisor', dealId);

        // Re-fetch via the existing API route (triggers DB-first + HubSpot logic)
        const baseUrl = process.env.NEXTAUTH_URL || process.env.RAILWAY_PUBLIC_DOMAIN
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
          : 'http://localhost:3000';

        const res = await fetch(`${baseUrl}/api/command-center/advisor/${dealId}`, {
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (res.ok) {
          const advisorData = await res.json();
          // Write through to Redis + S3
          await writeThroughCache('advisor', dealId, advisorData);
          console.log(`[webhook] Updated advisor ${dealId} (event: ${eventType})`);
        }
      } catch (err) {
        console.error(`[webhook] Failed to update advisor ${dealId}:`, err);
      }
    }

    if (eventType === 'deal.deletion') {
      await invalidateCache('advisor', dealId);
      console.log(`[webhook] Invalidated deleted deal ${dealId}`);
    }
  }

  // Invalidate aggregate caches if any deals changed
  if (processedDeals.size > 0) {
    await Promise.all([
      invalidateCache('pipeline', 'all'),
      invalidateCache('metrics', 'all'),
      invalidatePattern('transitions:*'),
    ]).catch(() => {});
  }

  return NextResponse.json({
    received: true,
    processed: processedDeals.size,
  });
}
