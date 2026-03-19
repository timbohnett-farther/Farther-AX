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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#ffffff" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-10 py-4 border-b"
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#dde8f0",
        }}
      >
        <div>
          <h1
            className="text-2xl font-bold leading-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "#333333",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: "#5b6a71" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-2xl font-bold"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "#1d7682",
            }}
          >
            {stepStr}
          </span>
          <span className="text-lg" style={{ color: "#dde8f0" }}>/</span>
          <span className="text-lg font-medium" style={{ color: "#5b6a71" }}>
            {totalStr}
          </span>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 px-10 py-8">{children}</div>

      {/* Bottom navigation */}
      <footer
        className="px-10 py-6 border-t flex items-center justify-between"
        style={{ borderColor: "#dde8f0", backgroundColor: "#f0f5f9" }}
      >
        <div>
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-150 border"
              style={{
                borderColor: "#dde8f0",
                color: "#5b6a71",
                backgroundColor: "transparent",
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
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i + 1 === step ? "20px" : "6px",
                height: "6px",
                backgroundColor: i + 1 === step ? "#1d7682" : "#b6d0ed",
              }}
            />
          ))}
        </div>

        <div>
          {nextHref ? (
            <Link
              href={nextHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-150 text-white"
              style={{ backgroundColor: "#1d7682" }}
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
