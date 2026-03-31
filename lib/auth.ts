import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";

/**
 * Email alias map — maps alternate email addresses to canonical identity.
 * When a user signs in with an alias email, their session is normalized
 * to use the canonical email and display name.
 */
const EMAIL_ALIASES: Record<string, { canonicalEmail: string; displayName: string }> = {
  "laren@farther.com": { canonicalEmail: "lauren.moone@farther.com", displayName: "Lauren Moone" },
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/spreadsheets.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Restrict to @farther.com emails only
      if (!user.email?.endsWith("@farther.com")) {
        return false;
      }
      return true;
    },
    async jwt({ token, account }) {
      // Persist access_token and refresh_token to the JWT on first sign-in
      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        token.expires_at = account.expires_at;
      }

      // Normalize aliased emails to canonical identity
      const email = (token.email ?? "").toLowerCase();
      const alias = EMAIL_ALIASES[email];
      if (alias) {
        token.email = alias.canonicalEmail;
        token.name = alias.displayName;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      // Apply normalized email/name from token to session
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      if (session.user && token.name) {
        session.user.name = token.name as string;
      }
      // Expose tokens on the session so API routes can use them
      (session as unknown as Record<string, unknown>).access_token = token.access_token;
      (session as unknown as Record<string, unknown>).refresh_token = token.refresh_token;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
};

/**
 * Get the currently authenticated user from the server session
 * Returns null if no user is authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/**
 * Resolve an email to its canonical form.
 * If the email has an alias entry, returns the canonical email.
 * Otherwise returns the input lowercased.
 */
export function resolveEmail(email: string): string {
  const lower = email.toLowerCase().trim();
  return EMAIL_ALIASES[lower]?.canonicalEmail ?? lower;
}
