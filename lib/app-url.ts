/**
 * Centralized Application URL Helper
 *
 * Provides consistent URL construction across the application with proper
 * fallback logic for local development, Railway deployments, and custom domains.
 *
 * Priority order:
 * 1. NEXTAUTH_URL (if set, highest priority for auth callbacks)
 * 2. NEXT_PUBLIC_APP_URL (if set, public-facing URL)
 * 3. Railway public domain (production deployment)
 * 4. Localhost:3000 (local development fallback)
 */

/**
 * Get the base application URL
 *
 * Returns the canonical URL for this application instance.
 * Guaranteed to return a valid URL string (never undefined/null).
 *
 * @returns Application base URL (e.g. "https://farther-ax-production.up.railway.app")
 *
 * @example
 * ```ts
 * const baseUrl = getAppUrl();
 * const formLink = `${baseUrl}/forms/tech-intake/${token}`;
 * ```
 */
export function getAppUrl(): string {
  // Priority 1: NEXTAUTH_URL (auth callback URL)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Priority 2: NEXT_PUBLIC_APP_URL (public-facing URL)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Priority 3: Railway public domain
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }

  // Priority 4: Local development fallback
  return 'http://localhost:3000';
}

/**
 * Build a full URL path from the application base
 *
 * @param path - Relative path (e.g. "/api/health" or "forms/tech-intake/abc123")
 * @returns Full URL (e.g. "https://farther-ax-production.up.railway.app/api/health")
 *
 * @example
 * ```ts
 * const healthUrl = buildAppUrl('/api/health');
 * const formUrl = buildAppUrl(`/forms/tech-intake/${token}`);
 * ```
 */
export function buildAppUrl(path: string): string {
  const base = getAppUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
