import PageLayout from "@/components/PageLayout";

export default function MAPage() {
  return (
    <PageLayout
      step={6}
      title="M&A"
      subtitle="Advisor Pathway — Mergers & Acquisitions"
      backHref="/independent-ria"
      nextHref="/no-to-low-aum"
    >
      <div className="max-w-3xl">
        {/* Coming Soon Banner */}
        <div
          className="rounded-xl p-8 border mb-8 text-center"
          style={{
            backgroundColor: "#f0f5f9",
            borderColor: "#dde8f0",
          }}
        >
          <div
            className="text-5xl mb-4"
            style={{ color: "#1d7682" }}
          >
            ◆
          </div>
          <h2
            className="text-2xl font-bold mb-3"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "#333333",
            }}
          >
            Content Coming Soon
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "#5b6a71" }}>
            The M&A pathway section is currently being developed. This section will
            cover the complete advisor onboarding process for practices joining Farther
            through an acquisition or merger transaction.
          </p>
        </div>

        {/* Preview of what's coming */}
        <div
          className="rounded-lg p-6 border"
          style={{ borderColor: "#dde8f0", backgroundColor: "rgba(255,255,255,0.5)" }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "#333333",
            }}
          >
            What This Section Will Cover
          </h3>
          <ul className="space-y-3">
            {[
              "M&A transaction structure and advisor integration timeline",
              "Legal and compliance considerations specific to acquisitions",
              "Handling existing client agreements and re-papering requirements",
              "Staff and team integration protocols",
              "Communication strategy for acquired advisor's client base",
              "Custodian transition coordination for M&A scenarios",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span style={{ color: "#1d7682", marginTop: "2px" }}>▸</span>
                <span className="text-sm" style={{ color: "#444444" }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageLayout>
  );
}
