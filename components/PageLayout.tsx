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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0EB" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-10 py-4 border-b"
        style={{
          backgroundColor: "#F5F0EB",
          borderColor: "#D8CFC4",
        }}
      >
        <div>
          <h1
            className="text-2xl font-bold leading-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "#2D2D2D",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: "#6B6B6B" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-2xl font-bold"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "#B8977E",
            }}
          >
            {stepStr}
          </span>
          <span className="text-lg" style={{ color: "#D8CFC4" }}>/</span>
          <span className="text-lg font-medium" style={{ color: "#9A9A9A" }}>
            {totalStr}
          </span>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 px-10 py-8">{children}</div>

      {/* Bottom navigation */}
      <footer
        className="px-10 py-6 border-t flex items-center justify-between"
        style={{ borderColor: "#D8CFC4", backgroundColor: "#EDE7DF" }}
      >
        <div>
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-150 border"
              style={{
                borderColor: "#D8CFC4",
                color: "#4A4A4A",
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
                backgroundColor: i + 1 === step ? "#B8977E" : "#D8CFC4",
              }}
            />
          ))}
        </div>

        <div>
          {nextHref ? (
            <Link
              href={nextHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-150 text-white"
              style={{ backgroundColor: "#B8977E" }}
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
