import { NextRequest, NextResponse } from 'next/server';
import { getStoredToken } from '@/lib/docusign';

// ── Env vars ──────────────────────────────────────────────────────────────────
const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY ?? '';
const BASE_URI = process.env.DOCUSIGN_BASE_URI ?? 'https://demo.docusign.net';
const API_ACCOUNT_ID = process.env.DOCUSIGN_API_ACCOUNT_ID ?? '';
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { search_text } = body as { search_text?: string };

    // ── Check for a stored, non-expired token ────────────────────────────────
    const stored = await getStoredToken();

    if (!stored) {
      return NextResponse.json(
        { error: 'not_authenticated', authUrl: buildAuthUrl() },
        { status: 401 },
      );
    }

    // Treat token as expired if within 60 seconds of expiry
    const now = new Date();
    const expiresAt = new Date(stored.expires_at);
    if (expiresAt.getTime() - now.getTime() < 60_000) {
      return NextResponse.json(
        { error: 'not_authenticated', authUrl: buildAuthUrl() },
        { status: 401 },
      );
    }

    // ── Query DocuSign eSignature REST API ───────────────────────────────────
    const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const params = new URLSearchParams({
      from_date: fromDate,
      status: 'any',
    });
    if (search_text?.trim()) {
      params.set('search_text', search_text.trim());
    }

    const envelopesUrl =
      `${BASE_URI}/restapi/v2.1/accounts/${API_ACCOUNT_ID}/envelopes?${params.toString()}`;

    const dsRes = await fetch(envelopesUrl, {
      headers: { Authorization: `Bearer ${stored.access_token}` },
    });

    if (!dsRes.ok) {
      const errText = await dsRes.text();
      console.error('[docusign] Envelopes API error:', dsRes.status, errText);
      // 401 from DocuSign means our token is invalid/expired — re-auth needed
      if (dsRes.status === 401) {
        return NextResponse.json(
          { error: 'not_authenticated', authUrl: buildAuthUrl() },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { error: `DocuSign API error ${dsRes.status}: ${errText}` },
        { status: 502 },
      );
    }

    const envelopeData = await dsRes.json();

    return NextResponse.json(envelopeData);
  } catch (err) {
    console.error('[docusign POST]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
