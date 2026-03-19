export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /auth/** (sign-in, error pages)
     * - /api/auth/** (NextAuth endpoints)
     * - /_next/static, /_next/image (Next.js internals)
     * - /fonts/**, /images/** (static assets)
     * - favicon.ico
     */
    "/((?!auth|api/auth|_next/static|_next/image|fonts|images|favicon\\.ico).*)",
  ],
};
