import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Redis from 'ioredis';

// ── Env vars ──────────────────────────────────────────────────────────────────
const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY ?? '';
const SECRET_KEY = process.env.DOCUSIGN_SECRET_KEY ?? '';
const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? '';
const AUTH_SERVER = process.env.DOCUSIGN_AUTH_SERVER ?? 'https://account.docusign.com';
const REDIS_URL = process.env.REDIS_URL;

// ── Redis Client ──────────────────────────────────────────────────────────────

async function getRedisClient(): Promise<Redis | null> {
  if (!REDIS_URL) return null;
  try {
    const client = new Redis(REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
    return client;
  } catch {
    return null;
  }
}

// ── GET handler ───────────────────────────────────────────────────────────────
// DocuSign redirects here with ?code=... after the user authorizes the app.

export async function GET(req: NextRequest) {
  // Validate required environment variables
  if (!INTEGRATION_KEY || !SECRET_KEY) {
    console.error('[docusign/callback] Missing DOCUSIGN_INTEGRATION_KEY or DOCUSIGN_SECRET_KEY');
    return NextResponse.json(
      { error: 'DocuSign configuration missing. Please contact support.' },
      { status: 500 }
    );
  }

  if (!NEXTAUTH_URL) {
    console.error('[docusign/callback] Missing NEXTAUTH_URL');
    return NextResponse.json(
      { error: 'Application configuration error. Please contact support.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const state = searchParams.get('state');

  // Handle OAuth errors from DocuSign
  if (error) {
    console.error('[docusign/callback] OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${NEXTAUTH_URL}/command-center/transitions?docusign=error&reason=${encodeURIComponent(error)}`,
    );
  }

  if (!code) {
    console.warn('[docusign/callback] Missing authorization code');
    return NextResponse.redirect(
      `${NEXTAUTH_URL}/command-center/transitions?docusign=error&reason=missing_code`,
    );
  }

  // Validate CSRF state token if Redis is available
  if (state) {
    const redis = await getRedisClient();
    if (redis) {
      try {
        const key = `docusign-oauth-state-${state}`;
        const value = await redis.get(key);
        await redis.del(key); // Delete after validation
        await redis.quit();

        if (!value) {
          console.error('[docusign/callback] Invalid or expired OAuth state');
          return NextResponse.redirect(
            `${NEXTAUTH_URL}/command-center/transitions?docusign=error&reason=invalid_state`,
          );
        }
      } catch (err) {
        console.warn('[docusign/callback] Failed to validate state in Redis:', err);
        // Graceful degradation: continue without state validation
      }
    }
  }

  try {
    // ── Exchange authorization code for tokens ───────────────────────────────
    const credentials = Buffer.from(`${INTEGRATION_KEY}:${SECRET_KEY}`).toString('base64');

    const tokenRes = await fetch(`${AUTH_SERVER}/oauth/token`, {
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
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
    };

    // Validate token response structure
    if (!tokenData.access_token || !tokenData.refresh_token || !tokenData.expires_in) {
      console.error('[docusign/callback] Invalid token response:', tokenData);
      return NextResponse.redirect(
        `${NEXTAUTH_URL}/command-center/transitions?docusign=error&reason=invalid_token_response`,
      );
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // ── Persist tokens to docusign_tokens table ──────────────────────────────
    try {
      await prisma.$executeRaw`
        INSERT INTO docusign_tokens (access_token, refresh_token, expires_at, created_at)
        VALUES (${tokenData.access_token}, ${tokenData.refresh_token}, ${expiresAt}, NOW())
      `;
      console.log('[docusign/callback] Tokens successfully stored');
    } catch (dbErr) {
      console.error('[docusign/callback] Database error storing tokens:', dbErr);
      return NextResponse.redirect(
        `${NEXTAUTH_URL}/command-center/transitions?docusign=error&reason=db_error`,
      );
    }

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
