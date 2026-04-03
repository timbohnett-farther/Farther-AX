import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  getValidToken,
  fetchEnvelopes,
  matchEnvelopesToAdvisors,
  DocuSignEnvelope,
} from '@/lib/docusign';

// ── Env vars ──────────────────────────────────────────────────────────────────
const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY ?? '';
const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? '';

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRedirectUri(): string {
  return `${NEXTAUTH_URL}/api/command-center/transitions/docusign/callback`;
}

function buildAuthUrl(): string {
  const redirectUri = buildRedirectUri();
  return (
    `https://account-d.docusign.com/oauth/auth` +
    `?response_type=code` +
    `&scope=signature` +
    `&client_id=${INTEGRATION_KEY}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`
  );
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST() {
  try {
    // 1. Get a valid access token (auto-refreshes if expired)
    const accessToken = await getValidToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'not_authenticated', authUrl: buildAuthUrl() },
        { status: 401 },
      );
    }

    // 2. Fetch envelopes from last 180 days
    let envelopes: DocuSignEnvelope[];
    try {
      envelopes = await fetchEnvelopes(accessToken, 180);
    } catch (err) {
      if (err instanceof Error && err.message === 'DOCUSIGN_AUTH_EXPIRED') {
        return NextResponse.json(
          { error: 'not_authenticated', authUrl: buildAuthUrl() },
          { status: 401 },
        );
      }
      throw err;
    }

    // 3. Query transition_clients to build advisor → email mappings
    const clientsResult = await prisma.$queryRaw<Array<{
      advisor_name: string;
      primary_email: string | null;
    }>>`
      SELECT DISTINCT advisor_name, primary_email
      FROM transition_clients
      WHERE advisor_name IS NOT NULL
    `;

    const advisorEmails = new Map<string, string[]>();
    for (const row of clientsResult) {
      const name = row.advisor_name;
      if (!advisorEmails.has(name)) advisorEmails.set(name, []);
      if (row.primary_email) {
        advisorEmails.get(name)!.push(row.primary_email.toLowerCase());
      }
    }

    // 4. Match envelopes to advisors
    const { matched, unmatched } = matchEnvelopesToAdvisors(envelopes, advisorEmails);

    // 5. Write-back to DB: update docusign status columns
    const matchedEntries = Array.from(matched.entries());
    for (const [advisorName, advisorEnvelopes] of matchedEntries) {
      for (const env of advisorEnvelopes) {
        const subjectLower = env.emailSubject.toLowerCase();
        const isIAA = subjectLower.includes('iaa');

        if (isIAA) {
          const signerEmails = env.signers.map(s => s.email.toLowerCase());
          await prisma.$executeRaw`
            UPDATE transition_clients
            SET docusign_iaa_status = ${env.status},
                docusign_iaa_envelope_id = ${env.envelopeId},
                docusign_last_checked = NOW()
            WHERE advisor_name = ${advisorName}
              AND EXISTS (
                SELECT 1 FROM unnest(ARRAY[${Prisma.join(signerEmails)}]::text[]) AS e
                WHERE LOWER(transition_clients.primary_email) = e
              )
          `;
        } else {
          const signerEmails = env.signers.map(s => s.email.toLowerCase());
          await prisma.$executeRaw`
            UPDATE transition_clients
            SET docusign_paperwork_status = ${env.status},
                docusign_paperwork_envelope_id = ${env.envelopeId},
                docusign_last_checked = NOW()
            WHERE advisor_name = ${advisorName}
              AND EXISTS (
                SELECT 1 FROM unnest(ARRAY[${Prisma.join(signerEmails)}]::text[]) AS e
                WHERE LOWER(transition_clients.primary_email) = e
              )
          `;
        }
      }
    }

    // 6. Build grouped response
    const advisorsObj: Record<string, DocuSignEnvelope[]> = {};
    for (const [name, envs] of matchedEntries) {
      advisorsObj[name] = envs;
    }

    let matchedCount = 0;
    for (const [, envs] of matchedEntries) matchedCount += envs.length;

    return NextResponse.json({
      connected: true,
      totalEnvelopes: envelopes.length,
      matchedCount,
      unmatchedCount: unmatched.length,
      advisors: advisorsObj,
      unmatched,
    });
  } catch (err) {
    console.error('[docusign POST]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
