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
      <header className="sticky top-0 z-30 flex items-center justify-between px-10 py-4 border-b border-cream-border bg-charcoal/80 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold font-serif text-cream leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-0.5 text-white/70">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold font-serif text-cream">
            {stepStr}
          </span>
          <span className="text-lg text-white/40">/</span>
          <span className="text-lg font-medium text-white/70">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-white/20 text-white/80 bg-transparent hover:bg-white/5 hover:border-teal hover:shadow-[0_0_16px_rgba(59,90,105,0.3)]"
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
                className={`rounded-full transition-all duration-300 h-1.5 ${
                  isActive
                    ? 'bg-teal shadow-[0_0_8px_rgba(59,90,105,0.6)]'
                    : i + 1 < step
                    ? 'bg-teal/40'
                    : 'bg-white/20'
                }`}
                style={{ width: isActive ? "20px" : "6px" }}
              />
            );
          })}
        </div>

        <div>
          {nextHref ? (
            <Link
              href={nextHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-white bg-teal hover:bg-teal-dark shadow-[0_0_12px_rgba(59,90,105,0.3)] hover:shadow-[0_0_24px_rgba(59,90,105,0.5)] hover:-translate-y-0.5"
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
