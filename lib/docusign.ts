import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const BASE_URI = process.env.DOCUSIGN_BASE_URI ?? 'https://demo.docusign.net';
const API_ACCOUNT_ID = process.env.DOCUSIGN_API_ACCOUNT_ID ?? '';
const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY ?? '';
const SECRET_KEY = process.env.DOCUSIGN_SECRET_KEY ?? '';

// ── Token store helpers ───────────────────────────────────────────────────────
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

// ── Token refresh ─────────────────────────────────────────────────────────────
export async function refreshAccessToken(): Promise<string | null> {
  const stored = await getStoredToken();
  if (!stored?.refresh_token) return null;

  const credentials = Buffer.from(`${INTEGRATION_KEY}:${SECRET_KEY}`).toString('base64');

  try {
    const res = await fetch('https://account-d.docusign.com/oauth/token', {
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

    // Upsert new tokens
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

// ── Single entry point: get a valid access token ──────────────────────────────
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

// ── Envelope types ──────────────────────────────────────────────────────────
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

// ── Fetch envelopes from DocuSign API ───────────────────────────────────────
export async function fetchEnvelopes(
  accessToken: string,
  fromDays: number = 180,
): Promise<DocuSignEnvelope[]> {
  const fromDate = new Date(Date.now() - fromDays * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    from_date: fromDate,
    status: 'any',
    include: 'recipients',
  });

  const url = `${BASE_URI}/restapi/v2.1/accounts/${API_ACCOUNT_ID}/envelopes?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[docusign] fetchEnvelopes error:', res.status, errText);
    if (res.status === 401) throw new Error('DOCUSIGN_AUTH_EXPIRED');
    throw new Error(`DocuSign API error ${res.status}`);
  }

  const data = await res.json();
  const envelopes: DocuSignEnvelope[] = [];

  for (const env of data.envelopes ?? []) {
    const signers: DocuSignSigner[] = (env.recipients?.signers ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => ({
        name: s.name ?? '',
        email: (s.email ?? '').toLowerCase(),
        status: s.status ?? '',
        signedDateTime: s.signedDateTime,
        deliveredDateTime: s.deliveredDateTime,
        sentDateTime: s.sentDateTime,
      }),
    );

    envelopes.push({
      envelopeId: env.envelopeId,
      status: env.status,
      emailSubject: env.emailSubject ?? '',
      sentDateTime: env.sentDateTime,
      completedDateTime: env.completedDateTime,
      statusChangedDateTime: env.statusChangedDateTime,
      signers,
    });
  }

  return envelopes;
}

// ── Match envelopes to advisors ─────────────────────────────────────────────
export function matchEnvelopesToAdvisors(
  envelopes: DocuSignEnvelope[],
  advisorEmails: Map<string, string[]>, // advisor_name → [email1, email2, ...]
): { matched: Map<string, DocuSignEnvelope[]>; unmatched: DocuSignEnvelope[] } {
  const matched = new Map<string, DocuSignEnvelope[]>();
  const unmatched: DocuSignEnvelope[] = [];

  const advisorEntries = Array.from(advisorEmails.entries());

  for (const env of envelopes) {
    let assignedAdvisor: string | null = null;

    // Strategy 1: Email match — if any signer email matches an advisor's client emails
    const signerEmails = env.signers.map(s => s.email.toLowerCase());
    for (const [advisorName, emails] of advisorEntries) {
      const emailSet = new Set(emails.map(e => e.toLowerCase()));
      if (signerEmails.some(se => emailSet.has(se))) {
        assignedAdvisor = advisorName;
        break;
      }
    }

    // Strategy 2: Subject match fallback — if advisor name appears in subject
    if (!assignedAdvisor) {
      const subjectLower = env.emailSubject.toLowerCase();
      for (const [advisorName] of advisorEntries) {
        // Match full name or last name in subject
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
