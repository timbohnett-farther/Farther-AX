import Link from "next/link";

const matrixData = [
  {
    document: "IAA",
    fullName: "Investment Advisory Agreement",
    breakaway: "✓",
    indRIA: "✓",
    ma: "✓",
    noLowAUM: "✓",
    masterMerge: "–",
    lpoa: "–",
    repaperACAT: "–",
  },
  {
    document: "U4",
    fullName: "Uniform Application for Securities Registration",
    breakaway: "✓",
    indRIA: "–",
    ma: "C",
    noLowAUM: "C",
    masterMerge: "–",
    lpoa: "–",
    repaperACAT: "–",
  },
  {
    document: "ADV-W",
    fullName: "Withdrawal of Investment Adviser Registration",
    breakaway: "–",
    indRIA: "✓",
    ma: "C",
    noLowAUM: "–",
    masterMerge: "–",
    lpoa: "–",
    repaperACAT: "–",
  },
  {
    document: "NCL",
    fullName: "Non-Compete / Non-Solicitation Letter",
    breakaway: "✓",
    indRIA: "C",
    ma: "✓",
    noLowAUM: "–",
    masterMerge: "–",
    lpoa: "–",
    repaperACAT: "–",
  },
  {
    document: "LPOA Document",
    fullName: "Limited Power of Attorney",
    breakaway: "–",
    indRIA: "–",
    ma: "–",
    noLowAUM: "–",
    masterMerge: "–",
    lpoa: "✓",
    repaperACAT: "–",
  },
  {
    document: "Holiday List",
    fullName: "Holiday List",
    breakaway: "✓",
    indRIA: "✓",
    ma: "✓",
    noLowAUM: "✓",
    masterMerge: "✓",
    lpoa: "✓",
    repaperACAT: "✓",
  },
  {
    document: "Transition Sheet",
    fullName: "Transition Spreadsheet",
    breakaway: "✓",
    indRIA: "✓",
    ma: "✓",
    noLowAUM: "C",
    masterMerge: "✓",
    lpoa: "✓",
    repaperACAT: "✓",
  },
  {
    document: "ACATs",
    fullName: "Automated Customer Account Transfers",
    breakaway: "–",
    indRIA: "–",
    ma: "–",
    noLowAUM: "–",
    masterMerge: "–",
    lpoa: "–",
    repaperACAT: "✓",
  },
  {
    document: "Exhibit B",
    fullName: "Exhibit B",
    breakaway: "✓",
    indRIA: "✓",
    ma: "✓",
    noLowAUM: "–",
    masterMerge: "–",
    lpoa: "–",
    repaperACAT: "–",
  },
];

const columns = [
  { key: "breakaway", label: "Breakaway" },
  { key: "indRIA", label: "Ind. RIA" },
  { key: "ma", label: "M&A" },
  { key: "noLowAUM", label: "No/Low AUM" },
  { key: "masterMerge", label: "Master Merge" },
  { key: "lpoa", label: "LPOA" },
  { key: "repaperACAT", label: "Repaper / ACAT" },
];

function CellValue({ value }: { value: string }) {
  if (value === "✓") {
    return (
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-sm shadow-[0_0_8px_rgba(16,185,129,0.25)]"
        aria-label="Required"
      >
        ✓
      </span>
    );
  }
  if (value === "–") {
    return (
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/15 text-red-400 font-medium text-sm shadow-[0_0_8px_rgba(239,68,68,0.2)]"
        aria-label="Not applicable"
      >
        –
      </span>
    );
  }
  if (value === "C") {
    return (
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/15 text-amber-400 font-semibold text-sm shadow-[0_0_8px_rgba(245,158,11,0.2)]"
        aria-label="Conditional"
      >
        C
      </span>
    );
  }
  return <span>{value}</span>;
}

const definitions = [
  {
    id: "iaa",
    code: "IAA",
    title: "Investment Advisory Agreement",
    body: "The foundational contract between the advisor and Farther. Establishes the legal relationship, fee schedule, investment discretion, and terms of service. Must be executed by the advisor before onboarding can proceed.",
    owner: "Legal / Compliance",
    timing: "Before kickoff meeting",
  },
  {
    id: "u4",
    code: "U4",
    title: "Uniform Application for Securities Registration",
    body: "FINRA's uniform registration form. Required for all advisors who hold securities licenses (Series 65, 66, 7, etc.). For Breakaway advisors, the U4 is held (not submitted) until after the advisor has formally resigned from their previous firm to avoid triggering a \"U4 event.\"",
    owner: "Compliance",
    timing: "Submitted after resignation (Breakaway) or at kickoff (others)",
  },
  {
    id: "adv-w",
    code: "ADV-W",
    title: "Withdrawal of Investment Adviser Registration",
    body: "Filed with the SEC or state regulators to formally withdraw an advisor's registration as an independent investment adviser. Required for Independent RIA advisors who are dissolving their own RIA to join Farther. Must be filed within 90 days of joining Farther.",
    owner: "Advisor (with Compliance support)",
    timing: "Within 90 days of Go Live",
  },
  {
    id: "ncl",
    code: "NCL",
    title: "Non-Compete / Non-Solicitation Letter",
    body: "A letter acknowledging the advisor's obligations under any non-compete or non-solicitation agreements with their prior firm. Breakaway advisors in particular must be careful about client communication before resignation. The NCL documents what the advisor has agreed to and protects Farther.",
    owner: "Legal",
    timing: "Before advisor resignation (Breakaway)",
  },
  {
    id: "lpoa",
    code: "LPOA Document",
    title: "Limited Power of Attorney",
    body: "Authorizes Farther to act on behalf of clients when transitioning assets. The advisor signs the LPOA (not the clients), which enables the custodian to move assets without requiring individual client signatures. Available at Schwab, Fidelity IWS, and Pershing PAS.",
    owner: "AXM / Transitions team",
    timing: "During LPOA transition method initiation",
  },
  {
    id: "holiday-list",
    code: "Holiday List",
    title: "Holiday List",
    body: "A calendar of market holidays and custodian processing blackout dates. Critical for scheduling ACAT submissions, account openings, and key transition milestones. Distributed to the advisor's team at the start of transitions.",
    owner: "AXA",
    timing: "Provided at kickoff",
  },
  {
    id: "transition-sheet",
    code: "Transition Spreadsheet",
    title: "Transition Spreadsheet",
    body: "The master tracking document for all client accounts being transitioned. Lists every account by client name, account number, custodian, account type, and transition status. Updated by the CTM/CTA as accounts transfer. The AXM reviews weekly.",
    owner: "CTM (primary), AXM (review)",
    timing: "Created at transition kickoff, maintained through Go Live",
  },
  {
    id: "acats",
    code: "ACATs",
    title: "Automated Customer Account Transfers",
    body: "The electronic system used by DTCC (and custodians) to transfer customer accounts between broker-dealers. ACATs are required for the Repaper/ACAT transition method. Each account transfer is initiated via ACAT request.",
    owner: "Transitions team (CTM / CTA)",
    timing: "After new accounts are opened and paperwork is signed",
  },
  {
    id: "exhibit-b",
    code: "Exhibit B",
    title: "Exhibit B",
    body: "An addendum to the IAA that specifies the advisor's compensation structure, payout rate, and any special arrangements. Confidential and specific to each advisor. Must be signed alongside the IAA.",
    owner: "Finance / Legal",
    timing: "Same as IAA",
  },
];

export default function KeyDocumentsPage() {
  return (
    <main className="min-h-screen text-cream font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page header */}
        <div className="mb-10">
          <p className="text-sm font-semibold text-gold-dark uppercase tracking-widest mb-2">
            Step 03 of 13
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-cream mb-3">
            Key Documents
          </h1>
          <p className="text-gold font-serif text-lg sm:text-xl">
            Document Applicability Matrix &amp; Definitions
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-cream-border mb-10" />

        {/* Section 1: Introduction */}
        <section className="mb-12">
          <p className="text-cream leading-relaxed text-base sm:text-lg max-w-4xl">
            Every advisor onboarding involves a set of core documents. Which documents apply depends on
            the advisor&apos;s pathway and the transition method selected. Use the matrix below to quickly
            identify which documents are required for any given scenario, then refer to the definitions
            section for detailed explanations of each document&apos;s purpose, timing, and owner.
          </p>
        </section>

        {/* Section 2: Document Applicability Matrix */}
        <section className="mb-14">
          <h2 className="font-serif text-2xl sm:text-3xl text-cream mb-6">
            Document Applicability Matrix
          </h2>

          {/* Responsive table wrapper */}
          <div className="overflow-x-auto rounded-lg border border-cream-border shadow-xs">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-charcoal-700">
                  <th className="text-left px-4 py-3 font-semibold text-cream text-sm border-b border-cream-border whitespace-nowrap">
                    Document
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="text-center px-4 py-3 font-semibold text-cream text-sm border-b border-cream-border whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData.map((row, idx) => (
                  <tr
                    key={row.document}
                    className={
                      idx % 2 === 0
                        ? "bg-charcoal-600/40 hover:bg-charcoal-700 transition-colors"
                        : "bg-charcoal-600/20 hover:bg-charcoal-700 transition-colors"
                    }
                  >
                    <td className="px-4 py-3 border-b border-cream-border font-medium text-cream whitespace-nowrap">
                      <span className="font-semibold">{row.document}</span>
                      <span className="block text-xs text-cream-muted font-normal mt-0.5 max-w-[160px] whitespace-normal leading-tight">
                        {row.fullName !== row.document ? row.fullName : ""}
                      </span>
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="text-center px-4 py-3 border-b border-cream-border"
                      >
                        <CellValue value={row[col.key as keyof typeof row] as string} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-cream-muted">
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-xs shadow-[0_0_6px_rgba(16,185,129,0.25)]">✓</span>
              Required
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/15 text-red-400 font-medium text-xs shadow-[0_0_6px_rgba(239,68,68,0.2)]">–</span>
              Not Applicable
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 font-semibold text-xs shadow-[0_0_6px_rgba(245,158,11,0.2)]">C</span>
              Conditional (see definitions)
            </span>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-cream-border mb-12" />

        {/* Section 3: Document Definitions */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl sm:text-3xl text-cream mb-8">
            Document Definitions
          </h2>

          <div className="space-y-4">
            {definitions.map((def, idx) => (
              <div
                key={def.id}
                className="glass-card rounded-lg p-6"
              >
                {/* Card header */}
                <div className="flex items-start gap-4 mb-3">
                  <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-charcoal-700 text-gold-dark text-xs font-bold font-sans">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-serif text-xl text-cream mb-0.5">
                      <span className="text-gold-dark">{def.code}</span>
                      {def.code !== def.title && (
                        <span className="text-cream"> — {def.title}</span>
                      )}
                    </h3>
                  </div>
                </div>

                {/* Body */}
                <p className="text-cream leading-relaxed mb-4 pl-12">
                  {def.body}
                </p>

                {/* Meta row */}
                <div className="pl-12 flex flex-wrap gap-6 text-sm">
                  <div>
                    <span className="font-semibold text-cream-muted uppercase tracking-wide text-xs">
                      Owner
                    </span>
                    <p className="text-cream mt-0.5">{def.owner}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-cream-muted uppercase tracking-wide text-xs">
                      Timing
                    </span>
                    <p className="text-cream mt-0.5">{def.timing}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom navigation */}
        <div className="border-t border-cream-border pt-8">
          <div className="flex items-center justify-between">
            <Link
              href="/onboarding-vs-transitions"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg glass-card text-cream hover:bg-charcoal-700 hover:border-teal transition-all duration-200 text-sm font-medium hover:shadow-[0_0_16px_rgba(29,118,130,0.2)]"
            >
              <span aria-hidden="true">←</span>
              Back
            </Link>

            <span className="text-xs font-semibold text-cream-muted tracking-widest uppercase">
              03 / 13
            </span>

            <Link
              href="/breakaway"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-white hover:bg-gold-dark transition-all duration-200 text-sm font-medium shadow-[0_0_12px_rgba(29,118,130,0.3)] hover:shadow-[0_0_24px_rgba(29,118,130,0.5)] hover:-translate-y-0.5"
            >
              Next
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
