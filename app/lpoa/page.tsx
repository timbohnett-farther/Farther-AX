import PageLayout from "@/components/PageLayout";

const statCards = [
  { label: "Timeline", value: "6–8 Weeks" },
  { label: "Who Signs", value: "Advisor (not clients)" },
  { label: "Available At", value: "Schwab, Fidelity IWS, Pershing PAS" },
];

const processSteps = [
  "Advisor and AXM confirm LPOA eligibility at the advisor's current custodian(s)",
  "Transitions team (CTM) prepares the LPOA document package",
  "Advisor signs the LPOA document",
  "CTM submits LPOA authorization to custodian",
  "Custodian reviews and approves the LPOA (typically 5–10 business days)",
  "Asset transfers begin systematically, batch by batch",
  "Accounts are monitored daily; discrepancies flagged and resolved",
  "All accounts confirmed transferred — transitions closes out",
];

const custodians = [
  {
    name: "Schwab",
    icon: "S",
    body: "Full LPOA support. Most common for Breakaway advisors with Schwab accounts.",
  },
  {
    name: "Fidelity IWS",
    icon: "F",
    body: "Fidelity Institutional Wealth Services supports LPOA. Requires specific form submission through Fidelity's advisor portal.",
  },
  {
    name: "Pershing PAS",
    icon: "P",
    body: "Pershing Portfolio Advisory Service supports LPOA through NetX360.",
  },
];

const considerations = [
  "LPOA does NOT require client notification of the transfer (although best practice is to notify)",
  "Some account types cannot transfer via LPOA (e.g., 401k, certain annuities) — these may require Repaper",
  "ACATs may still be needed for non-LPOA-eligible accounts within an otherwise LPOA transition",
  "The LPOA document must be stored in the client file and Transition Tracker",
];

export default function LPOAPage() {
  return (
    <PageLayout
      step={9}
      title="LPOA"
      subtitle="Transition Method — Limited Power of Attorney (6–8 Weeks)"
      backHref="/master-merge"
      nextHref="/repaper-acat"
      backLabel="Master Merge"
      nextLabel="Repaper / ACAT"
    >
      <div className="max-w-4xl mx-auto">

        {/* Intro */}
        <p className="text-cream-muted leading-relaxed text-base mb-12 max-w-3xl">
          The LPOA (Limited Power of Attorney) transition method allows Farther to transfer client
          assets without requiring individual client signatures on new paperwork. Instead, the advisor
          signs a single LPOA document granting Farther authority to act on behalf of clients. This is
          a mid-range timeline method — faster than Repaper/ACAT but slower than Master Merge.
        </p>

        {/* Section: At a Glance */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#1d7682" }} />
            <h2
              className="font-serif text-2xl"
              style={{ color: "#FAF7F2", fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              At a Glance
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {statCards.map((card, idx) => (
              <div
                key={idx}
                className="rounded-xl border text-center px-6 py-7 transition-all duration-200 hover:shadow-[0_0_16px_rgba(29,118,130,0.2)]"
                style={{ backgroundColor: "#222222", borderColor: "rgba(250,247,242,0.08)" }}
              >
                <p
                  className="text-xs uppercase tracking-widest font-medium mb-3"
                  style={{ color: "rgba(250,247,242,0.5)" }}
                >
                  {card.label}
                </p>
                <p
                  className="font-serif text-xl leading-snug"
                  style={{ color: "#1d7682", fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section: How LPOA Works */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#1d7682" }} />
            <h2
              className="font-serif text-2xl"
              style={{ color: "#FAF7F2", fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              How LPOA Works
            </h2>
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "rgba(250,247,242,0.08)" }}
          >
            {processSteps.map((step, idx) => {
              const isLast = idx === processSteps.length - 1;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-5 px-6 py-5 border-b last:border-b-0 relative"
                  style={{
                    backgroundColor: idx % 2 === 0 ? "transparent" : "#222222",
                    borderColor: "rgba(250,247,242,0.08)",
                  }}
                >
                  {/* Step number */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-sans shrink-0"
                      style={{
                        backgroundColor: isLast ? "#1d7682" : "#FAF7F2",
                        color: isLast ? "#1a1a1a" : "#1a1a1a",
                        boxShadow: "0 0 12px rgba(29, 118, 130, 0.4)",
                      }}
                    >
                      {idx + 1}
                    </div>
                    {!isLast && (
                      <div
                        className="w-px mt-1"
                        style={{
                          height: "20px",
                          backgroundColor: "rgba(250,247,242,0.08)",
                        }}
                      />
                    )}
                  </div>
                  <p
                    className="text-sm leading-relaxed pt-1.5"
                    style={{ color: "#FAF7F2" }}
                  >
                    {step}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Custodian Availability */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#1d7682" }} />
            <h2
              className="font-serif text-2xl"
              style={{ color: "#FAF7F2", fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              Custodian Availability
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {custodians.map((c, idx) => (
              <div
                key={idx}
                className="rounded-xl border p-6 transition-all duration-200 hover:shadow-[0_0_20px_rgba(29,118,130,0.2)]"
                style={{ backgroundColor: "#222222", borderColor: "rgba(250,247,242,0.08)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-serif font-bold text-lg shrink-0"
                    style={{ backgroundColor: "#FAF7F2", color: "#1a1a1a" }}
                  >
                    {c.icon}
                  </div>
                  <h3
                    className="font-serif text-lg"
                    style={{ color: "#FAF7F2", fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    {c.name}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(250,247,242,0.5)" }}>
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Key Considerations */}
        <section className="mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#1d7682" }} />
            <h2
              className="font-serif text-2xl"
              style={{ color: "#FAF7F2", fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              Key Considerations
            </h2>
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: "transparent", borderColor: "rgba(250,247,242,0.08)" }}
          >
            {/* Dark header bar */}
            <div
              className="px-6 py-3 border-b"
              style={{ backgroundColor: "#FAF7F2", borderColor: "rgba(250,247,242,0.08)" }}
            >
              <span
                className="text-xs uppercase tracking-widest font-medium"
                style={{ color: "#1a1a1a" }}
              >
                Important Notes
              </span>
            </div>

            <ul className="divide-y" style={{ borderColor: "#dde8f0" }}>
              {considerations.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-4 px-6 py-4"
                  style={{ borderColor: "rgba(250,247,242,0.08)" }}
                >
                  <span
                    className="shrink-0 mt-0.5 text-base"
                    style={{ color: "#1a1a1a" }}
                  >
                    ▸
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: "#FAF7F2" }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

      </div>
    </PageLayout>
  );
}
