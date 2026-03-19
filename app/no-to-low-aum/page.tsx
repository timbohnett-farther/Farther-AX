import PageLayout from "@/components/PageLayout";

const keyCharacteristics = [
  {
    icon: "◈",
    title: "Focus Team Check Required",
    body: "Before onboarding begins, the Focus Team reviews the advisor's profile to confirm Farther is the right fit and that the advisor has a credible path to growth.",
  },
  {
    icon: "◎",
    title: "Training-First Approach",
    body: "Rather than leading with transitions, this pathway prioritizes getting the advisor proficient on the Farther platform first. Full transitions may be deferred until the advisor demonstrates platform mastery.",
  },
  {
    icon: "⇌",
    title: "Simplified Transition Process",
    body: "Given lower AUM, transitions are typically simpler. Repaper/ACAT is most common. LPOA may be used if custodian supports it.",
  },
  {
    icon: "▸",
    title: "Growth Plan Required",
    body: "The AXM works with the advisor to establish a 90-day and 180-day growth plan with clear milestones for AUM growth, client acquisition, and platform utilization.",
  },
];

const trainingItems = [
  "Farther portal navigation and account management",
  "Model portfolio selection and implementation",
  "Client reporting and communication tools",
  "Compliance workflows and document submission",
  "Billing and fee management",
];

const focusTeamItems = [
  "Current AUM and trajectory",
  "Client demographics and retention history",
  "The advisor's prior firm performance record",
  "Strategic alignment with Farther's growth goals",
];

export default function NoToLowAUMPage() {
  return (
    <PageLayout
      step={7}
      title="No to Low AUM"
      subtitle="Advisor Pathway — Below $15–20M AUM"
      backHref="/ma"
      nextHref="/master-merge"
      backLabel="M&A"
      nextLabel="Master Merge"
    >
      <div className="max-w-4xl mx-auto">

        {/* Intro */}
        <p className="text-charcoal-muted leading-relaxed text-base mb-12 max-w-3xl">
          The No to Low AUM pathway applies to advisors bringing fewer than $15–20 million in assets
          under management to Farther. While Farther welcomes advisors at all stages, advisors below
          this threshold follow a modified, training-first onboarding approach before proceeding to
          full transitions.
        </p>

        {/* Section: When This Pathway Applies */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#1d7682" }} />
            <h2
              className="font-serif text-2xl"
              style={{ color: "#333333", fontFamily: "'ABC Arizona Text', Georgia, serif" }}
            >
              When This Pathway Applies
            </h2>
          </div>

          {/* Informational callout */}
          <div
            className="rounded-xl px-7 py-6 border-l-4"
            style={{
              backgroundColor: "#EBF3FB",
              borderLeftColor: "#5B9BD5",
              border: "1px solid #BDD7EE",
              borderLeft: "4px solid #5B9BD5",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-0.5"
                style={{ backgroundColor: "#5B9BD5", color: "#FAF7F2" }}
              >
                i
              </div>
              <p className="leading-relaxed text-sm" style={{ color: "#1E3A5F" }}>
                This pathway is triggered when an advisor&apos;s projected AUM at launch is below $15–20M.
                The exact threshold is assessed case-by-case with input from the Focus Team, which
                evaluates the advisor&apos;s growth trajectory, client quality, and strategic fit.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Key Characteristics */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#1d7682" }} />
            <h2
              className="font-serif text-2xl"
              style={{ color: "#333333", fontFamily: "'ABC Arizona Text', Georgia, serif" }}
            >
              Key Characteristics
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {keyCharacteristics.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl p-6 border"
                style={{ backgroundColor: "#f0f5f9", borderColor: "#dde8f0" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: "#1d7682", color: "#FAF7F2" }}
                  >
                    {item.icon}
                  </div>
                  <h3
                    className="font-serif text-lg leading-tight"
                    style={{ color: "#333333", fontFamily: "'ABC Arizona Text', Georgia, serif" }}
                  >
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#5b6a71" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section: The Focus Team Review */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#1d7682" }} />
            <h2
              className="font-serif text-2xl"
              style={{ color: "#333333", fontFamily: "'ABC Arizona Text', Georgia, serif" }}
            >
              The Focus Team Review
            </h2>
          </div>

          <div
            className="rounded-xl overflow-hidden border"
            style={{ borderColor: "#dde8f0" }}
          >
            <div
              className="px-7 py-5 border-b"
              style={{ backgroundColor: "#f0f5f9", borderColor: "#dde8f0" }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "#333333" }}>
                The Focus Team is an internal Farther committee that reviews borderline advisor
                candidates. Their assessment covers the following areas. The AXM must present the
                advisor&apos;s profile to the Focus Team before initiating any onboarding steps.
              </p>
            </div>
            <div className="px-7 py-6" style={{ backgroundColor: "#FAF7F2" }}>
              <ul className="space-y-3">
                {focusTeamItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5" style={{ color: "#1d7682" }}>◆</span>
                    <span className="text-sm leading-relaxed" style={{ color: "#333333" }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Section: Training Curriculum Priority */}
        <section className="mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#1d7682" }} />
            <h2
              className="font-serif text-2xl"
              style={{ color: "#333333", fontFamily: "'ABC Arizona Text', Georgia, serif" }}
            >
              Training Curriculum Priority
            </h2>
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "#dde8f0" }}
          >
            <div
              className="px-2 py-1 border-b"
              style={{ backgroundColor: "#333333", borderColor: "#dde8f0" }}
            >
              <span
                className="text-xs uppercase tracking-widest font-medium px-5 py-3 inline-block"
                style={{ color: "#1d7682" }}
              >
                Required Training Modules — In Order
              </span>
            </div>
            <div style={{ backgroundColor: "#FAF7F2" }}>
              {trainingItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-5 px-6 py-4 border-b last:border-b-0"
                  style={{ borderColor: "#dde8f0" }}
                >
                  <span
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-sans"
                    style={{ backgroundColor: "#f0f5f9", color: "#1d7682", border: "1px solid #dde8f0" }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: "#333333" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </PageLayout>
  );
}
