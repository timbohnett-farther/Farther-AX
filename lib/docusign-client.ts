/**
 * DocuSign API Client — Production-ready integration with webhooks + retry logic
 *
 * Features:
 * - Automatic retry on 429/502/503 with exponential backoff
 * - Pagination for envelope fetching (handles >100 envelopes)
 * - HMAC webhook verification for Connect events
 * - Token management with auto-refresh
 * - Incremental sync (only fetch recent envelopes)
 * - Type-safe interfaces
 *
 * Usage:
 * ```ts
 * import { fetchAllEnvelopes, verifyWebhookHMAC } from '@/lib/docusign-client';
 *
 * // Fetch envelopes with pagination
 * const envelopes = await fetchAllEnvelopes(accessToken, sinceDate);
 *
 * // Verify webhook payload
 * const isValid = verifyWebhookHMAC(payload, signature);
 * ```
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

// ── Environment Variables ─────────────────────────────────────────────────────
const BASE_URI = process.env.DOCUSIGN_BASE_URI ?? 'https://demo.docusign.net';
const API_ACCOUNT_ID = process.env.DOCUSIGN_API_ACCOUNT_ID ?? '';
const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY ?? '';
const SECRET_KEY = process.env.DOCUSIGN_SECRET_KEY ?? '';
const AUTH_SERVER = process.env.DOCUSIGN_AUTH_SERVER ?? 'https://account.docusign.com';

/**
 * Get HMAC secret at runtime for testability
 */
function getHmacSecret(): string {
  return process.env.DOCUSIGN_HMAC_SECRET ?? '';
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

// ── Type Definitions ──────────────────────────────────────────────────────────

export interface DocuSignSigner {
  name: string;
  email: string;
  status: string;
  signedDateTime?: string;
  deliveredDateTime?: string;
  sentDateTime?: string;
}

export interface DocuSignEnvelope {
  envelopeId: string;
  status: string;
  emailSubject: string;
  sentDateTime?: string;
  completedDateTime?: string;
  statusChangedDateTime?: string;
  signers: DocuSignSigner[];
}

export interface DocuSignWebhookPayload {
  event: string;
  apiVersion: string;
  uri: string;
  retryCount: number;
  configurationId: string;
  generatedDateTime: string;
  data: {
    accountId: string;
    userId: string;
    envelopeId: string;
    status: string;
    emailSubject: string;
    recipients?: {
      signers?: Array<{
        name: string;
        email: string;
        status: string;
        signedDateTime?: string;
        deliveredDateTime?: string;
        sentDateTime?: string;
      }>;
    };
  };
}

// ── Token Management (Auto-Refresh) ───────────────────────────────────────────

export async function getStoredToken(): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: Date;
} | null> {
  try {
    const result = await prisma.$queryRaw<Array<{
      access_token: string;
      refresh_token: string;
      expires_at: Date;
    }>>`
      SELECT access_token, refresh_token, expires_at
      FROM docusign_tokens
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return result[0] ?? null;
  } catch (err) {
    console.warn('[docusign] Could not read docusign_tokens:', err);
    return null;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const stored = await getStoredToken();
  if (!stored?.refresh_token) return null;

  const credentials = Buffer.from(`${INTEGRATION_KEY}:${SECRET_KEY}`).toString('base64');

  try {
    const res = await fetch(`${AUTH_SERVER}/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: stored.refresh_token,
      }).toString(),
    });

    if (!res.ok) {
      console.error('[docusign] Token refresh failed:', res.status, await res.text());
      return null;
    }

    const data = await res.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await prisma.$executeRaw`
      INSERT INTO docusign_tokens (access_token, refresh_token, expires_at, created_at)
      VALUES (${data.access_token}, ${data.refresh_token}, ${expiresAt}, NOW())
    `;

    console.log('[docusign] Token refreshed successfully');
    return data.access_token;
  } catch (err) {
    console.error('[docusign] Token refresh error:', err);
    return null;
  }
}

export async function getValidToken(): Promise<string | null> {
  const stored = await getStoredToken();
  if (!stored) return null;

  const now = new Date();
  const expiresAt = new Date(stored.expires_at);

  // If token is valid (with 60s buffer), return it
  if (expiresAt.getTime() - now.getTime() > 60_000) {
    return stored.access_token;
  }

  // Token expired or about to expire — try refresh
  console.log('[docusign] Token expired, attempting refresh...');
  return refreshAccessToken();
}

// ── Core Fetch Wrapper with Retry Logic ──────────────────────────────────────

/**
 * Smart fetch wrapper with automatic retry on transient failures
 *
 * Retries on:
 * - 429 (Rate Limited) — exponential backoff
 * - 502 (Bad Gateway) — DocuSign server issue
 * - 503 (Service Unavailable) — DocuSign maintenance/overload
 */
export async function docusignFetch<T = any>(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE_URI}${path}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Success
      if (res.ok) {
        return await res.json() as T;
      }

      // Rate limited or server error — retry with backoff
      if (res.status === 429 || res.status === 502 || res.status === 503) {
        const isLastAttempt = attempt === MAX_RETRIES - 1;

        if (isLastAttempt) {
          const errorBody = await res.text();
          throw new Error(
            `DocuSign ${res.status} after ${MAX_RETRIES} attempts: ${errorBody}`
          );
        }

        // Exponential backoff: 1s → 2s → 4s
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.warn(
          `DocuSign ${res.status} on attempt ${attempt + 1}/${MAX_RETRIES}. ` +
          `Retrying in ${backoffMs}ms...`
        );
        await sleep(backoffMs);
        continue;
      }

      // Auth error — throw immediately
      if (res.status === 401) {
        throw new Error('DOCUSIGN_AUTH_EXPIRED');
      }

      // Client error — don't retry
      const errorBody = await res.text();
      throw new Error(`DocuSign ${res.status}: ${errorBody}`);

    } catch (error) {
      if (error instanceof Error &&
          (error.message.startsWith('DocuSign') || error.message === 'DOCUSIGN_AUTH_EXPIRED')) {
        throw error;
      }

      const isLastAttempt = attempt === MAX_RETRIES - 1;
      if (isLastAttempt) {
        throw new Error(`DocuSign request failed after ${MAX_RETRIES} attempts: ${error}`);
      }

      // Retry on network errors
      const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      console.warn(`Network error on attempt ${attempt + 1}/${MAX_RETRIES}. Retrying in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }

  throw new Error('Unreachable: exceeded max retries');
}

// ── Paginated Envelope Fetching ───────────────────────────────────────────────

/**
 * Fetch all envelopes with pagination (handles >100 envelopes)
 *
 * @param accessToken - DocuSign access token
 * @param sinceDate - Fetch envelopes modified since this date (default: 180 days ago)
 * @param maxPages - Safety limit on pages to fetch (default: 10)
 */
export async function fetchAllEnvelopes(
  accessToken: string,
  sinceDate?: Date,
  maxPages: number = 10
): Promise<DocuSignEnvelope[]> {
  const fromDate = sinceDate ?? new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const allEnvelopes: DocuSignEnvelope[] = [];
  let startPosition = 0;
  const count = 100; // Max per page
  let pagesFetched = 0;

  do {
    const params = new URLSearchParams({
      from_date: fromDate.toISOString(),
      status: 'any',
      include: 'recipients',
      count: count.toString(),
      start_position: startPosition.toString(),
    });

    const path = `/restapi/v2.1/accounts/${API_ACCOUNT_ID}/envelopes?${params}`;

    const data = await docusignFetch<{
      envelopes: any[];
      nextUri?: string;
      resultSetSize?: number;
      totalSetSize?: number;
    }>(path, accessToken);

    const envelopes = data.envelopes ?? [];

    // Process each envelope
    for (const env of envelopes) {
      const signers: DocuSignSigner[] = (env.recipients?.signers ?? []).map(
        (s: any) => ({
          name: s.name ?? '',
          email: (s.email ?? '').toLowerCase(),
          status: s.status ?? '',
          signedDateTime: s.signedDateTime,
          deliveredDateTime: s.deliveredDateTime,
          sentDateTime: s.sentDateTime,
        }),
      );

      allEnvelopes.push({
        envelopeId: env.envelopeId,
        status: env.status,
        emailSubject: env.emailSubject ?? '',
        sentDateTime: env.sentDateTime,
        completedDateTime: env.completedDateTime,
        statusChangedDateTime: env.statusChangedDateTime,
        signers,
      });
    }

    pagesFetched++;

    // Check if more pages exist
    if (data.nextUri && pagesFetched < maxPages) {
      startPosition += count;
      console.log(
        `[docusign] Fetched page ${pagesFetched} (${allEnvelopes.length} envelopes so far)...`
      );
    } else {
      if (data.nextUri && pagesFetched >= maxPages) {
        console.warn(`[docusign] Reached max pages limit (${maxPages}). Some envelopes may be missing.`);
      }
      break;
    }
  } while (true);

  console.log(`[docusign] Fetched ${allEnvelopes.length} envelopes across ${pagesFetched} pages`);
  return allEnvelopes;
}

// ── Webhook HMAC Verification ─────────────────────────────────────────────────

/**
 * Verify HMAC signature on DocuSign Connect webhook
 *
 * DocuSign uses HMAC-SHA256 with base64 encoding.
 * Always use constant-time comparison to prevent timing attacks.
 *
 * @param payload - Raw webhook payload (string or Buffer)
 * @param signature - Value from X-DocuSign-Signature-1 header
 * @returns true if signature is valid
 */
export function verifyWebhookHMAC(
  payload: string | Buffer,
  signature: string
): boolean {
  const hmacSecret = getHmacSecret();

  if (!hmacSecret) {
    console.error('[docusign] HMAC_SECRET not configured');
    return false;
  }

  if (!signature) {
    console.error('[docusign] No signature header provided');
    return false;
  }

  try {
    const payloadStr = typeof payload === 'string' ? payload : payload.toString('utf8');

    const computed = crypto
      .createHmac('sha256', hmacSecret)
      .update(payloadStr)
      .digest('base64');

    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('[docusign] HMAC verification error:', error);
    return false;
  }
}

/**
 * Parse DocuSign webhook payload into structured format
 */
export function parseWebhookPayload(payload: string): DocuSignWebhookPayload | null {
  try {
    return JSON.parse(payload) as DocuSignWebhookPayload;
  } catch (error) {
    console.error('[docusign] Failed to parse webhook payload:', error);
    return null;
  }
}

// ── Incremental Sync State Management ─────────────────────────────────────────

/**
 * Get last DocuSign sync timestamp from database
 */
export async function getLastSyncTimestamp(): Promise<Date | null> {
  try {
    const result = await prisma.$queryRaw<Array<{ last_synced_at: Date }>>`
      SELECT last_synced_at FROM docusign_sync_state ORDER BY id DESC LIMIT 1
    `;
    return result[0]?.last_synced_at ?? null;
  } catch (err) {
    console.warn('[docusign] Could not read sync state:', err);
    return null;
  }
}

/**
 * Update last DocuSign sync timestamp in database
 */
export async function updateLastSyncTimestamp(timestamp: Date = new Date()): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO docusign_sync_state (last_synced_at, created_at)
      VALUES (${timestamp}, NOW())
    `;
  } catch (err) {
    console.error('[docusign] Could not update sync state:', err);
  }
}

// ── Envelope Matching Helpers ─────────────────────────────────────────────────

/**
 * Match envelopes to advisors based on signer emails + subject line
 */
export function matchEnvelopesToAdvisors(
  envelopes: DocuSignEnvelope[],
  advisorEmails: Map<string, string[]>, // advisor_name → [email1, email2, ...]
): { matched: Map<string, DocuSignEnvelope[]>; unmatched: DocuSignEnvelope[] } {
  const matched = new Map<string, DocuSignEnvelope[]>();
  const unmatched: DocuSignEnvelope[] = [];

  const advisorEntries = Array.from(advisorEmails.entries());

  for (const env of envelopes) {
    let assignedAdvisor: string | null = null;

    // Strategy 1: Email match (most reliable)
    const signerEmails = env.signers.map(s => s.email.toLowerCase());
    for (const [advisorName, emails] of advisorEntries) {
      const emailSet = new Set(emails.map(e => e.toLowerCase()));
      if (signerEmails.some(se => emailSet.has(se))) {
        assignedAdvisor = advisorName;
        break;
      }
    }

    // Strategy 2: Subject match fallback
    if (!assignedAdvisor) {
      const subjectLower = env.emailSubject.toLowerCase();
      for (const [advisorName] of advisorEntries) {
        if (subjectLower.includes(advisorName.toLowerCase())) {
          assignedAdvisor = advisorName;
          break;
        }
        // Try last name only
        const parts = advisorName.split(' ');
        if (parts.length > 1) {
          const lastName = parts[parts.length - 1].toLowerCase();
          if (lastName.length > 2 && subjectLower.includes(lastName)) {
            assignedAdvisor = advisorName;
            break;
          }
        }
      }
    }

    if (assignedAdvisor) {
      if (!matched.has(assignedAdvisor)) matched.set(assignedAdvisor, []);
      matched.get(assignedAdvisor)!.push(env);
    } else {
      unmatched.push(env);
    }
  }

  return { matched, unmatched };
}

// ── Utility Functions ──────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if DocuSign is configured
 */
export function isDocuSignConfigured(): boolean {
  return Boolean(
    API_ACCOUNT_ID &&
    INTEGRATION_KEY &&
    SECRET_KEY &&
    BASE_URI
  );
}

/**
 * Check if webhook HMAC secret is configured
 */
export function isWebhookConfigured(): boolean {
  const hmacSecret = getHmacSecret();
  return Boolean(hmacSecret && hmacSecret.length > 0);
}
