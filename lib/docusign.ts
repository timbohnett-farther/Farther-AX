import pool from '@/lib/db';

const BASE_URI = process.env.DOCUSIGN_BASE_URI ?? 'https://demo.docusign.net';
const API_ACCOUNT_ID = process.env.DOCUSIGN_API_ACCOUNT_ID ?? '';

// ── Token store helpers ───────────────────────────────────────────────────────
export async function getStoredToken(): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: Date;
} | null> {
  try {
    const result = await pool.query<{
      access_token: string;
      refresh_token: string;
      expires_at: Date;
    }>(`
      SELECT access_token, refresh_token, expires_at
      FROM docusign_tokens
      ORDER BY created_at DESC
      LIMIT 1
    `);
    return result.rows[0] ?? null;
  } catch (err) {
    console.warn('[docusign] Could not read docusign_tokens:', err);
    return null;
  }
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
  fromDays: number = 90,
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
