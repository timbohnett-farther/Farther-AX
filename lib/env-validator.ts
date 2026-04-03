/**
 * Environment variable validation for production deployments.
 * Validates that all required environment variables are present
 * and provides clear error messages if any are missing.
 */

export function validateEnv() {
  // Only validate in production (Railway handles env vars)
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const required = {
    'DATABASE_URL': 'PostgreSQL connection string (auto-provided by Railway service)',
    'NEXTAUTH_URL': 'App base URL (e.g., https://farther-ax.railway.app)',
    'NEXTAUTH_SECRET': 'Secret for JWT signing (generate with: openssl rand -base64 32)',
    'GOOGLE_CLIENT_ID': 'Google OAuth client ID from console.cloud.google.com',
    'GOOGLE_CLIENT_SECRET': 'Google OAuth client secret',
    'HUBSPOT_ACCESS_TOKEN': 'HubSpot private app token (or HUBSPOT_PAT as fallback)',
  };

  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const [key, desc] of Object.entries(required)) {
    if (!process.env[key]) {
      // Special handling for HubSpot (has fallback)
      if (key === 'HUBSPOT_ACCESS_TOKEN' && process.env.HUBSPOT_PAT) {
        warnings.push(`  ⚠️  HUBSPOT_ACCESS_TOKEN not set (using HUBSPOT_PAT fallback)`);
        continue;
      }
      missing.push(`  ❌ ${key}: ${desc}`);
    }
  }

  // Print warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:\n');
    console.warn(warnings.join('\n'));
    console.warn('');
  }

  // Fail if critical vars missing
  if (missing.length > 0) {
    console.error('\n❌ FATAL: Missing required environment variables:\n');
    console.error(missing.join('\n'));
    console.error('\nSee .env.example for configuration details.\n');
    throw new Error(`Missing ${missing.length} required environment variable(s)`);
  }

  console.log('✅ Environment validation passed');
}

/**
 * Validate environment variables on module load (production only).
 * This ensures env vars are checked before the app starts accepting requests.
 */
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}
