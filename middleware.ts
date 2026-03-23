export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /auth/** (sign-in, error pages)
     * - /api/auth/** (NextAuth endpoints)
     * - /forms/** (public advisor forms — U4 & 2B, etc.)
     * - /api/u4-2b/** (public form API — token validation + submission)
     * - /_next/static, /_next/image (Next.js internals)
     * - /fonts/**, /images/** (static assets)
     * - favicon.ico
     */
    "/((?!auth|api/auth|forms|api/u4-2b|_next/static|_next/image|fonts|images|favicon\\.ico).*)",
  ],
};
