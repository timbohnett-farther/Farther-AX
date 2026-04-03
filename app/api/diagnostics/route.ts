import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Diagnostic endpoint to check server configuration
 * Returns status of critical environment variables and services
 *
 * Access: GET /api/diagnostics
 */
export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      envVars: {} as Record<string, boolean>,
      database: { connected: false, error: null as string | null },
      services: {} as Record<string, boolean>,
    },
    suggestions: [] as string[],
  };

  // Check critical environment variables (without exposing values)
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const optionalVars = [
    'HUBSPOT_ACCESS_TOKEN',
    'HUBSPOT_PAT',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GROK_API_KEY',
    'DOCUSIGN_INTEGRATION_KEY',
  ];

  // Check required vars
  for (const varName of requiredVars) {
    const isSet = !!process.env[varName];
    diagnostics.checks.envVars[varName] = isSet;
    if (!isSet) {
      diagnostics.suggestions.push(`❌ Missing required: ${varName}`);
    }
  }

  // Check optional vars
  for (const varName of optionalVars) {
    diagnostics.checks.envVars[varName] = !!process.env[varName];
  }

  // Check HubSpot token (either HUBSPOT_ACCESS_TOKEN or HUBSPOT_PAT)
  const hasHubSpotToken = !!(process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT);
  diagnostics.checks.services['HubSpot API'] = hasHubSpotToken;
  if (!hasHubSpotToken) {
    diagnostics.suggestions.push('⚠️  No HubSpot token found. Set HUBSPOT_ACCESS_TOKEN or HUBSPOT_PAT');
  }

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.checks.database.connected = true;
  } catch (err) {
    diagnostics.checks.database.connected = false;
    diagnostics.checks.database.error = err instanceof Error ? err.message : String(err);
    diagnostics.suggestions.push(`❌ Database connection failed: ${diagnostics.checks.database.error}`);
  }

  // Overall health
  const allRequired = requiredVars.every(v => diagnostics.checks.envVars[v]);
  const dbConnected = diagnostics.checks.database.connected;
  const isHealthy = allRequired && dbConnected;

  return NextResponse.json({
    healthy: isHealthy,
    ...diagnostics,
    summary: {
      status: isHealthy ? '✅ All critical checks passed' : '❌ Configuration issues detected',
      requiredVars: requiredVars.filter(v => diagnostics.checks.envVars[v]).length + '/' + requiredVars.length,
      database: dbConnected ? '✅ Connected' : '❌ Failed',
      hubspot: hasHubSpotToken ? '✅ Configured' : '⚠️  Not configured',
    },
  });
}
