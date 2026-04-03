import { NextResponse } from 'next/server';

/**
 * Simple health check endpoint for Railway deployment verification.
 * Returns 200 OK with basic status information.
 * Does not depend on external services (HubSpot, Google, etc.)
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: {
      node_version: process.version,
      node_env: process.env.NODE_ENV || 'development',
      database: !!process.env.DATABASE_URL,
      nextauth: !!process.env.NEXTAUTH_URL && !!process.env.NEXTAUTH_SECRET,
    },
  });
}
