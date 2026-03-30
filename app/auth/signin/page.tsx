"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { useTheme } from "@/lib/theme-provider";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/introduction";
  const error = searchParams.get("error");
  const { THEME } = useTheme();

  const errorMessages: Record<string, string> = {
    AccessDenied: "Access denied. Only @farther.com email addresses are permitted.",
    OAuthSignin: "Could not initiate Google sign-in. Please try again.",
    OAuthCallback: "An error occurred during sign-in. Please try again.",
    Default: "An unexpected error occurred. Please try again.",
  };

  const errorMessage = error ? (errorMessages[error] ?? errorMessages.Default) : null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: THEME.colors.bg }}
    >
      {/* Card */}
      <div
        className="w-full max-w-xl rounded-2xl p-12"
        style={{
          backgroundColor: THEME.colors.surface,
          border: `1px solid ${THEME.colors.border}`,
          boxShadow: "0 4px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/images/farther-iw-cream.png"
            alt="Farther"
            width={180}
            height={45}
            priority
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* Heading */}
        <h1
          className="text-center mb-3 text-2xl font-light leading-relaxed"
          style={{ color: THEME.colors.text }}
        >
          Advisor Experience &amp; Transition Command Center
        </h1>
        <p
          className="text-center mb-8 text-base leading-relaxed"
          style={{ color: THEME.colors.textSecondary }}
        >
          Sign in with your Farther Google account to continue.
        </p>

        {/* Error message */}
        {errorMessage && (
          <div
            className="mb-6 px-4 py-3 rounded-lg text-sm border"
            style={{
              color: '#fca5a5',
              backgroundColor: 'rgba(220,38,38,0.15)',
              borderColor: 'rgba(220,38,38,0.4)'
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium text-base transition-all duration-150"
          style={{
            backgroundColor: THEME.colors.teal,
            color: '#FFFFFF'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = THEME.colors.tealDark}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = THEME.colors.teal}
        >
          {/* Google G icon */}
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="white" fillOpacity="0.9"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="white" fillOpacity="0.9"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="white" fillOpacity="0.9"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="white" fillOpacity="0.9"/>
          </svg>
          Sign in with Google
        </button>

        {/* Restriction note */}
        <p
          className="mt-6 text-center text-sm"
          style={{ color: THEME.colors.textSecondary }}
        >
          Access restricted to{" "}
          <span className="font-medium" style={{ color: THEME.colors.aqua }}>@farther.com</span>{" "}
          accounts only.
        </p>
      </div>

      {/* Footer */}
      <p
        className="mt-8 text-xs"
        style={{ color: THEME.colors.textSecondary }}
      >
        Farther Wealth Management · Internal Use Only
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
