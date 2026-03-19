"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const isAccessDenied = error === "AccessDenied";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#FAF7F2" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-10 text-center"
        style={{
          backgroundColor: "#FAF7F2",
          border: "1px solid #E8E0D5",
          boxShadow: "0 4px 32px rgba(51,51,51,0.08)",
        }}
      >
        <div className="flex justify-center mb-8">
          <Image
            src="/images/farther-wordmark-navy.png"
            alt="Farther"
            width={140}
            height={32}
            style={{ objectFit: "contain" }}
          />
        </div>

        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "rgba(220,38,38,0.1)" }}
        >
          <span style={{ fontSize: "1.5rem" }}>✕</span>
        </div>

        <h1
          className="mb-3"
          style={{
            fontFamily: "'ABC Arizona Text', Georgia, serif",
            fontSize: "1.5rem",
            fontWeight: 300,
            color: "#333333",
          }}
        >
          {isAccessDenied ? "Access Denied" : "Sign-In Error"}
        </h1>

        <p
          className="mb-8 text-sm leading-relaxed"
          style={{
            fontFamily: "'Fakt', system-ui, sans-serif",
            color: "#5b6a71",
          }}
        >
          {isAccessDenied
            ? "This tool is restricted to @farther.com Google accounts. If you believe this is an error, contact your team administrator."
            : "An error occurred during sign-in. Please try again."}
        </p>

        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white text-sm font-medium"
          style={{
            backgroundColor: "#1d7682",
            fontFamily: "'Fakt', system-ui, sans-serif",
          }}
        >
          ← Back to Sign In
        </Link>
      </div>
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
