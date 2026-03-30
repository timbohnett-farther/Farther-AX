"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { useTheme } from '@/lib/theme-provider';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const { THEME } = useTheme();

  const isAccessDenied = error === "AccessDenied";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: THEME.colors.bg }}
    >
      <div
        className="w-full max-w-xl rounded-2xl p-12 text-center"
        style={{
          backgroundColor: THEME.colors.surface,
          border: `1px solid ${THEME.colors.border}`,
          boxShadow: "0 4px 32px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/images/farther-iw-cream.png"
            alt="Farther"
            width={180}
            height={45}
            style={{ objectFit: "contain" }}
          />
        </div>

        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: 'rgba(220,38,38,0.1)' }}
        >
          <span style={{ fontSize: "1.75rem", color: '#fca5a5' }}>✕</span>
        </div>

        <h1
          className="mb-4 text-2xl font-light leading-relaxed"
          style={{ color: THEME.colors.text }}
        >
          {isAccessDenied ? "Access Denied" : "Sign-In Error"}
        </h1>

        <p
          className="mb-8 text-base leading-relaxed"
          style={{ color: THEME.colors.textSecondary }}
        >
          {isAccessDenied
            ? "This tool is restricted to @farther.com Google accounts. If you believe this is an error, contact your team administrator."
            : "An error occurred during sign-in. Please try again."}
        </p>

        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white text-sm font-medium transition-all duration-150"
          style={{ backgroundColor: THEME.colors.steel }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          ← Back to Sign In
        </Link>
      </div>

      <p
        className="mt-8 text-xs"
        style={{ color: THEME.colors.textSecondary }}
      >
        Farther Wealth Management · Internal Use Only
      </p>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
