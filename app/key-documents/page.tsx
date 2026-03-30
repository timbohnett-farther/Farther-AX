'use client';

import Link from "next/link";
import QuizSection from "@/components/QuizSection";
import { useTheme } from '@/lib/theme-provider';

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

function CellValue({ value, THEME }: { value: string; THEME: any }) {
  if (value === "✓") {
    return (
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm"
        style={{
          backgroundColor: `${THEME.colors.teal}26`,
          color: THEME.colors.teal,
          boxShadow: `0 0 8px ${THEME.colors.teal}40`
        }}
        aria-label="Required"
      >
        ✓
      </span>
    );
  }
  if (value === "–") {
    return (
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full font-medium text-sm"
        style={{
          backgroundColor: `${THEME.colors.gold}26`,
          color: THEME.colors.gold,
          boxShadow: `0 0 8px ${THEME.colors.gold}33`
        }}
        aria-label="Not applicable"
      >
        –
      </span>
    );
  }
  if (value === "C") {
    return (
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full font-semibold text-sm"
        style={{
          backgroundColor: `${THEME.colors.gold}26`,
          color: THEME.colors.gold,
          boxShadow: `0 0 8px ${THEME.colors.gold}33`
        }}
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
  const { THEME } = useTheme();

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME.colors.bg, color: THEME.colors.text }}>
      {/* Step Indicator */}
      <div className="fixed top-6 right-8 z-50">
        <span
          className="font-sans text-xs tracking-[0.2em] uppercase px-4 py-2 rounded-full"
          style={{
            backgroundColor: THEME.colors.surface,
            border: `1px solid ${THEME.colors.border}`,
            color: THEME.colors.textSecondary
          }}
        >
          03 / 13
        </span>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-20 lg:py-28">

        {/* Page Header */}
        <header className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1" style={{ backgroundColor: THEME.colors.gold, opacity: 0.3 }} />
            <span className="font-sans text-xs tracking-[0.25em] uppercase" style={{ color: THEME.colors.gold }}>
              Step 03 — Playbook
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: THEME.colors.gold, opacity: 0.3 }} />
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl leading-tight mb-5 tracking-tight text-center" style={{ color: THEME.colors.text }}>
            Key <span style={{ color: THEME.colors.gold }}>Documents</span>
          </h1>
          <p className="font-sans text-base tracking-wide text-center" style={{ color: THEME.colors.textSecondary }}>
            Document Applicability Matrix &amp; Definitions
          </p>
        </header>

        {/* Section 1: Introduction */}
        <section className="mb-16">
          <p className="font-sans text-base leading-8" style={{ color: THEME.colors.text }}>
            Every advisor onboarding involves a set of core documents. Which documents apply depends on
            the advisor&apos;s pathway and the transition method selected. Use the matrix below to quickly
            identify which documents are required for any given scenario, then refer to the definitions
            section for detailed explanations of each document&apos;s purpose, timing, and owner.
          </p>
        </section>

        {/* Section 2: Document Applicability Matrix */}
        <section className="mb-20">
          <h2 className="font-serif text-3xl mb-8" style={{ color: THEME.colors.text }}>
            Document Applicability <span style={{ color: THEME.colors.gold }}>Matrix</span>
          </h2>

          {/* Table wrapper */}
          <div
            className="overflow-x-auto rounded-xl"
            style={{
              border: `1px solid ${THEME.colors.border}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr style={{ backgroundColor: THEME.colors.surfaceHover }}>
                  <th
                    className="text-left px-6 py-4 font-semibold text-sm whitespace-nowrap"
                    style={{
                      color: THEME.colors.text,
                      borderBottom: `1px solid ${THEME.colors.border}`
                    }}
                  >
                    Document
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="text-center px-4 py-4 font-semibold text-sm whitespace-nowrap"
                      style={{
                        color: THEME.colors.text,
                        borderBottom: `1px solid ${THEME.colors.border}`
                      }}
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
                    className="transition-colors"
                    style={{
                      backgroundColor: idx % 2 === 0 ? THEME.colors.surface : THEME.colors.bg
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = THEME.colors.surfaceHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? THEME.colors.surface : THEME.colors.bg}
                  >
                    <td
                      className="px-6 py-4 font-medium whitespace-nowrap"
                      style={{
                        color: THEME.colors.text,
                        borderBottom: `1px solid ${THEME.colors.border}`
                      }}
                    >
                      <span className="font-semibold">{row.document}</span>
                      {row.fullName !== row.document && (
                        <span
                          className="block text-xs font-normal mt-1 leading-tight"
                          style={{
                            color: THEME.colors.textSecondary,
                            maxWidth: '180px'
                          }}
                        >
                          {row.fullName}
                        </span>
                      )}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="text-center px-4 py-4"
                        style={{ borderBottom: `1px solid ${THEME.colors.border}` }}
                      >
                        <CellValue value={row[col.key as keyof typeof row] as string} THEME={THEME} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-8 text-sm" style={{ color: THEME.colors.textSecondary }}>
            <span className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs"
                style={{
                  backgroundColor: `${THEME.colors.teal}26`,
                  color: THEME.colors.teal,
                  boxShadow: `0 0 6px ${THEME.colors.teal}40`
                }}
              >
                ✓
              </span>
              Required
            </span>
            <span className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full font-medium text-xs"
                style={{
                  backgroundColor: `${THEME.colors.gold}26`,
                  color: THEME.colors.gold,
                  boxShadow: `0 0 6px ${THEME.colors.gold}33`
                }}
              >
                –
              </span>
              Not Applicable
            </span>
            <span className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full font-semibold text-xs"
                style={{
                  backgroundColor: `${THEME.colors.gold}26`,
                  color: THEME.colors.gold,
                  boxShadow: `0 0 6px ${THEME.colors.gold}33`
                }}
              >
                C
              </span>
              Conditional (see definitions)
            </span>
          </div>
        </section>

        {/* Section 3: Document Definitions */}
        <section className="mb-24">
          <h2 className="font-serif text-3xl mb-10" style={{ color: THEME.colors.text }}>
            Document <span style={{ color: THEME.colors.gold }}>Definitions</span>
          </h2>

          <div className="space-y-6">
            {definitions.map((def, idx) => (
              <div
                key={def.id}
                className="rounded-xl p-8"
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `1px solid ${THEME.colors.border}`
                }}
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <span
                    className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm"
                    style={{
                      backgroundColor: THEME.colors.gold,
                      color: '#FFFFFF'
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-serif text-2xl" style={{ color: THEME.colors.text }}>
                      <span style={{ color: THEME.colors.gold }}>{def.code}</span>
                      {def.code !== def.title && (
                        <span> — {def.title}</span>
                      )}
                    </h3>
                  </div>
                </div>

                {/* Body */}
                <p className="font-sans text-base leading-7 mb-6 pl-14" style={{ color: THEME.colors.text }}>
                  {def.body}
                </p>

                {/* Meta row */}
                <div className="pl-14 flex flex-wrap gap-8 text-sm">
                  <div>
                    <span
                      className="font-semibold uppercase tracking-wide text-xs mb-1 block"
                      style={{ color: THEME.colors.textSecondary }}
                    >
                      Owner
                    </span>
                    <p className="font-medium" style={{ color: THEME.colors.text }}>{def.owner}</p>
                  </div>
                  <div>
                    <span
                      className="font-semibold uppercase tracking-wide text-xs mb-1 block"
                      style={{ color: THEME.colors.textSecondary }}
                    >
                      Timing
                    </span>
                    <p className="font-medium" style={{ color: THEME.colors.text }}>{def.timing}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Navigation */}
        <footer className="flex items-center justify-between border-t pt-10" style={{ borderColor: THEME.colors.border }}>
          <Link
            href="/onboarding-vs-transitions"
            className="group inline-flex items-center gap-3 font-sans text-sm tracking-wide px-6 py-3 rounded-full transition-all duration-200"
            style={{ color: THEME.colors.textSecondary }}
            onMouseEnter={(e) => { e.currentTarget.style.color = THEME.colors.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = THEME.colors.textSecondary; }}
          >
            <span>&larr;</span>
            <span>Back</span>
          </Link>

          <span className="font-sans text-xs tracking-[0.2em] uppercase" style={{ color: THEME.colors.textSecondary }}>
            03 / 13
          </span>

          <Link
            href="/breakaway"
            className="group inline-flex items-center gap-3 font-sans text-sm tracking-wide px-8 py-4 rounded-full transition-all duration-200"
            style={{
              backgroundColor: THEME.colors.gold,
              color: '#FFFFFF',
              boxShadow: '0 0 16px rgba(29,118,130,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 28px rgba(29,118,130,0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 16px rgba(29,118,130,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Next</span>
            <span>&rarr;</span>
          </Link>
        </footer>

        <QuizSection topicSlug="key-documents" topicTitle="Key Documents" />

      </div>
    </div>
  );
}
