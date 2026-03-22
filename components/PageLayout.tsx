import Link from "next/link";

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
 * Migrated to Tailwind utilities (removed all inline styles)
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
  const stepStr = String(step).padStart(2, "0");
  const totalStr = String(totalSteps).padStart(2, "0");

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-10 py-4 border-b border-cream-border bg-cream">
        <div>
          <h1 className="text-2xl font-bold font-serif text-cream leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-0.5 text-slate">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold font-serif text-teal">
            {stepStr}
          </span>
          <span className="text-lg text-cream-border">/</span>
          <span className="text-lg font-medium text-slate">
            {totalStr}
          </span>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 px-10 py-8">{children}</div>

      {/* Bottom navigation */}
      <footer className="px-10 py-6 border-t border-cream-border bg-charcoal-700 flex items-center justify-between">
        <div>
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-smooth border border-cream-border text-slate bg-transparent hover:bg-white hover:border-teal"
            >
              ← {backLabel}
            </Link>
          ) : (
            <span />
          )}
        </div>

        {/* Step dots */}
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all h-1.5 bg-teal-light"
              style={{
                width: i + 1 === step ? "20px" : "6px",
                backgroundColor: i + 1 === step ? "#1d7682" : "#b6d0ed",
              }}
            />
          ))}
        </div>

        <div>
          {nextHref ? (
            <Link
              href={nextHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-smooth text-white bg-teal hover:bg-teal-dark"
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
