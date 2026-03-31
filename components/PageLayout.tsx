"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme-provider";

interface PageLayoutProps {
  step: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  backHref?: string;
  nextHref?: string;
  backLabel?: string;
  nextLabel?: string;
  children: React.ReactNode;
}

/**
 * PageLayout - Multi-step form layout with progress indicator
 *
 * Migrated to inline styles via THEME
 */
export default function PageLayout({
  step,
  totalSteps = 13,
  title,
  subtitle,
  backHref,
  nextHref,
  backLabel = "Back",
  nextLabel = "Next",
  children,
}: PageLayoutProps) {
  const { THEME } = useTheme();
  const stepStr = String(step).padStart(2, "0");
  const totalStr = String(totalSteps).padStart(2, "0");

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: THEME.colors.bg }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-10 py-4 border-b backdrop-blur-md"
        style={{
          borderColor: THEME.colors.border,
          backgroundColor: `${THEME.colors.surface}CC`,
        }}
      >
        <div>
          <h1
            className="text-2xl font-bold leading-tight"
            style={{ fontFamily: THEME.typography.fontFamily.serif, color: THEME.colors.textHeading }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: THEME.colors.textSecondary }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: THEME.typography.fontFamily.serif, color: THEME.colors.textHeading }}
          >
            {stepStr}
          </span>
          <span className="text-lg" style={{ color: THEME.colors.textMuted }}>/</span>
          <span className="text-lg font-medium" style={{ color: THEME.colors.textSecondary }}>
            {totalStr}
          </span>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 px-10 py-8">{children}</div>

      {/* Bottom navigation */}
      <footer
        className="px-10 py-6 border-t flex items-center justify-between"
        style={{
          borderColor: THEME.colors.border,
          backgroundColor: THEME.colors.surface,
        }}
      >
        <div>
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{
                border: `1px solid ${THEME.colors.borderSubtle}`,
                color: THEME.colors.textSecondary,
                backgroundColor: "transparent",
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = THEME.colors.surfaceHover;
                e.currentTarget.style.borderColor = THEME.colors.steel;
                e.currentTarget.style.boxShadow = `0 0 16px ${THEME.colors.steel}4D`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = THEME.colors.borderSubtle;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              ← {backLabel}
            </Link>
          ) : (
            <span />
          )}
        </div>

        {/* Step dots */}
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const isActive = i + 1 === step;
            return (
              <div
                key={i}
                className="rounded-full h-1.5"
                style={{
                  width: isActive ? "20px" : "6px",
                  backgroundColor: isActive
                    ? THEME.colors.steel
                    : i + 1 < step
                    ? `${THEME.colors.steel}66`
                    : THEME.colors.borderSubtle,
                  boxShadow: isActive ? `0 0 8px ${THEME.colors.steel}99` : "none",
                  transition: "all 300ms ease",
                }}
              />
            );
          })}
        </div>

        <div>
          {nextHref ? (
            <Link
              href={nextHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{
                color: "#FFFFFF",
                backgroundColor: THEME.colors.steel,
                boxShadow: `0 0 12px ${THEME.colors.steel}4D`,
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = THEME.colors.steelBlue900;
                e.currentTarget.style.boxShadow = `0 0 24px ${THEME.colors.steel}80`;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = THEME.colors.steel;
                e.currentTarget.style.boxShadow = `0 0 12px ${THEME.colors.steel}4D`;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {nextLabel} →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </footer>
    </div>
  );
}
