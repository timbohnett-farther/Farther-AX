import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// ── Env vars ──────────────────────────────────────────────────────────────────
const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY ?? '';
const SECRET_KEY = process.env.DOCUSIGN_SECRET_KEY ?? '';
const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? '';

// ── GET handler ───────────────────────────────────────────────────────────────
// DocuSign redirects here with ?code=... after the user authorizes the app.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(
      `${NEXTAUTH_URL}/command-center/transitions?docusign=error&reason=missing_code`,
    );
  }

  try {
    // ── Exchange authorization code for tokens ───────────────────────────────
    const credentials = Buffer.from(`${INTEGRATION_KEY}:${SECRET_KEY}`).toString('base64');

    const tokenRes = await fetch('https://account-d.docusign.com/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[docusign/callback] Token exchange failed:', tokenRes.status, errText);
      return NextResponse.redirect(
        `${NEXTAUTH_URL}/command-center/transitions?docusign=error&reason=token_exchange_failed`,
      );
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
    };

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // ── Persist tokens to docusign_tokens table ──────────────────────────────
    await pool.query(
      `
      INSERT INTO docusign_tokens (access_token, refresh_token, expires_at, created_at)
      VALUES ($1, $2, $3, NOW())
      `,
      [tokenData.access_token, tokenData.refresh_token, expiresAt],
    );

    // ── Redirect back to the dashboard with a success signal ─────────────────
    return NextResponse.redirect(
      `${NEXTAUTH_URL}/command-center/transitions?docusign=connected`,
    );
  } catch (err) {
    console.error('[docusign/callback]', err);
    return NextResponse.redirect(
      `${NEXTAUTH_URL}/command-center/transitions?docusign=error&reason=server_error`,
    );
  }
}

export const dynamic = 'force-dynamic';
