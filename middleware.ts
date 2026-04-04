export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /auth/** (sign-in, error pages)
     * - /api/auth/** (NextAuth endpoints)
     * - /api/sync/** (cron job endpoints with Bearer token auth)
     * - /api/webhooks/** (webhook endpoints with HMAC/Bearer auth)
     * - /forms/** (public advisor forms — U4 & 2B, etc.)
     * - /api/u4-2b/** (public form API — token validation + submission)
     * - /_next/static, /_next/image (Next.js internals)
     * - /fonts/**, /images/** (static assets)
     * - favicon.ico
     */
    "/((?!auth|api/auth|api/health|api/diagnostics|api/sync|api/webhooks|api/test-prisma|forms|api/u4-2b|api/tech-intake|_next/static|_next/image|fonts|images|favicon\\.ico).*)",
  ],
};
