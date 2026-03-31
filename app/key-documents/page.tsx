'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme-provider';

export default function KeyDocumentsPage() {
  const { THEME } = useTheme();

  const documents = [
    { code: 'IAA', name: 'Investment Advisory Agreement', breakaway: '✓', indRIA: '✓', ma: '✓', noLowAUM: '✓', masterMerge: '–', lpoa: '–', repaperACAT: '–' },
    { code: 'U4', name: 'Uniform Application for Securities Registration', breakaway: '✓', indRIA: '–', ma: 'C', noLowAUM: 'C', masterMerge: '–', lpoa: '–', repaperACAT: '–' },
    { code: 'ADV-W', name: 'Withdrawal of Investment Adviser Registration', breakaway: '–', indRIA: '✓', ma: 'C', noLowAUM: '–', masterMerge: '–', lpoa: '–', repaperACAT: '–' },
    { code: 'NCL', name: 'Non-Compete / Non-Solicitation Letter', breakaway: '✓', indRIA: 'C', ma: '✓', noLowAUM: '–', masterMerge: '–', lpoa: '–', repaperACAT: '–' },
    { code: 'LPOA Document', name: 'Limited Power of Attorney', breakaway: '–', indRIA: '–', ma: '–', noLowAUM: '–', masterMerge: '–', lpoa: '✓', repaperACAT: '–' },
    { code: 'Holiday List', name: 'Holiday List', breakaway: '✓', indRIA: '✓', ma: '✓', noLowAUM: '✓', masterMerge: '✓', lpoa: '✓', repaperACAT: '✓' },
    { code: 'Transition Sheet', name: 'Transition Spreadsheet', breakaway: '✓', indRIA: '✓', ma: '✓', noLowAUM: 'C', masterMerge: '✓', lpoa: '✓', repaperACAT: '✓' },
    { code: 'ACATs', name: 'Automated Customer Account Transfers', breakaway: '–', indRIA: '–', ma: '–', noLowAUM: '–', masterMerge: '–', lpoa: '–', repaperACAT: '✓' },
    { code: 'Exhibit B', name: 'Exhibit B', breakaway: '✓', indRIA: '✓', ma: '✓', noLowAUM: '–', masterMerge: '–', lpoa: '–', repaperACAT: '–' },
  ];

  const definitions = [
    {
      code: 'IAA',
      title: 'Investment Advisory Agreement',
      body: 'The foundational contract between the advisor and Farther. Establishes the legal relationship, fee schedule, investment discretion, and terms of service. Must be executed by the advisor before onboarding can proceed.',
      owner: 'Legal / Compliance',
      timing: 'Before kickoff meeting',
    },
    {
      code: 'U4',
      title: 'Uniform Application for Securities Registration',
      body: "FINRA's uniform registration form. Required for all advisors who hold securities licenses (Series 65, 66, 7, etc.). For Breakaway advisors, the U4 is held (not submitted) until after the advisor has formally resigned from their previous firm to avoid triggering a \"U4 event.\"",
      owner: 'Compliance',
      timing: 'Submitted after resignation (Breakaway) or at kickoff (others)',
    },
    {
      code: 'ADV-W',
      title: 'Withdrawal of Investment Adviser Registration',
      body: "Filed with the SEC or state regulators to formally withdraw an advisor's registration as an independent investment adviser. Required for Independent RIA advisors who are dissolving their own RIA to join Farther. Must be filed within 90 days of joining Farther.",
      owner: 'Advisor (with Compliance support)',
      timing: 'Within 90 days of Go Live',
    },
    {
      code: 'NCL',
      title: 'Non-Compete / Non-Solicitation Letter',
      body: "A letter acknowledging the advisor's obligations under any non-compete or non-solicitation agreements with their prior firm. Breakaway advisors in particular must be careful about client communication before resignation. The NCL documents what the advisor has agreed to and protects Farther.",
      owner: 'Legal',
      timing: 'Before advisor resignation (Breakaway)',
    },
    {
      code: 'LPOA Document',
      title: 'Limited Power of Attorney',
      body: 'Authorizes Farther to act on behalf of clients when transitioning assets. The advisor signs the LPOA (not the clients), which enables the custodian to move assets without requiring individual client signatures. Available at Schwab, Fidelity IWS, and Pershing PAS.',
      owner: 'AXM / Transitions team',
      timing: 'During LPOA transition method initiation',
    },
    {
      code: 'Holiday List',
      title: 'Holiday List',
      body: "A calendar of market holidays and custodian processing blackout dates. Critical for scheduling ACAT submissions, account openings, and key transition milestones. Distributed to the advisor's team at the start of transitions.",
      owner: 'AXA',
      timing: 'Provided at kickoff',
    },
    {
      code: 'Transition Spreadsheet',
      title: 'Transition Spreadsheet',
      body: 'The master tracking document for all client accounts being transitioned. Lists every account by client name, account number, custodian, account type, and transition status. Updated by the CTM/CTA as accounts transfer. The AXM reviews weekly.',
      owner: 'CTM (primary), AXM (review)',
      timing: 'Created at transition kickoff, maintained through Go Live',
    },
    {
      code: 'ACATs',
      title: 'Automated Customer Account Transfers',
      body: 'The electronic system used by DTCC (and custodians) to transfer customer accounts between broker-dealers. ACATs are required for the Repaper/ACAT transition method. Each account transfer is initiated via ACAT request.',
      owner: 'Transitions team (CTM / CTA)',
      timing: 'After new accounts are opened and paperwork is signed',
    },
    {
      code: 'Exhibit B',
      title: 'Exhibit B',
      body: "An addendum to the IAA that specifies the advisor's compensation structure, payout rate, and any special arrangements. Confidential and specific to each advisor. Must be signed alongside the IAA.",
      owner: 'Finance / Legal',
      timing: 'Same as IAA',
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME.colors.bg }}>
      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-4">
            <span
              className="text-xs uppercase tracking-widest font-semibold"
              style={{ color: THEME.colors.gold }}
            >
              Step 03 / 13
            </span>
          </div>
          <h1
            className="text-5xl font-bold mb-4"
            style={{ color: THEME.colors.text }}
          >
            Key <span style={{ color: THEME.colors.gold }}>Documents</span>
          </h1>
          <p className="text-lg" style={{ color: THEME.colors.textSecondary }}>
            Document Applicability Matrix & Definitions
          </p>
        </div>

        {/* Introduction */}
        <p className="text-base leading-relaxed mb-12" style={{ color: THEME.colors.text }}>
          Every advisor onboarding involves a set of core documents. Which documents apply depends on the
          advisor's pathway and the transition method selected. Use the matrix below to quickly identify
          which documents are required for any given scenario, then refer to the definitions section for
          detailed explanations of each document's purpose, timing, and owner.
        </p>

        {/* Matrix Table */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8" style={{ color: THEME.colors.text }}>
            Document Applicability <span style={{ color: THEME.colors.gold }}>Matrix</span>
          </h2>

          <div
            className="rounded-xl overflow-x-auto"
            style={{ border: `1px solid ${THEME.colors.border}` }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: THEME.colors.surface }}>
                  <th
                    className="text-left px-6 py-4 font-semibold"
                    style={{
                      color: THEME.colors.text,
                      borderBottom: `1px solid ${THEME.colors.border}`,
                    }}
                  >
                    Document
                  </th>
                  {['Breakaway', 'Ind. RIA', 'M&A', 'No/Low AUM', 'Master Merge', 'LPOA', 'Repaper/ACAT'].map((col) => (
                    <th
                      key={col}
                      className="text-center px-4 py-4 font-semibold"
                      style={{
                        color: THEME.colors.text,
                        borderBottom: `1px solid ${THEME.colors.border}`,
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, idx) => (
                  <tr
                    key={doc.code}
                    style={{
                      backgroundColor: idx % 2 === 0 ? THEME.colors.surface : THEME.colors.bg,
                    }}
                  >
                    <td
                      className="px-6 py-4 font-medium"
                      style={{
                        color: THEME.colors.text,
                        borderBottom: `1px solid ${THEME.colors.border}`,
                      }}
                    >
                      <span className="font-semibold">{doc.code}</span>
                      {doc.name !== doc.code && (
                        <span
                          className="block text-xs mt-1"
                          style={{ color: THEME.colors.textSecondary }}
                        >
                          {doc.name}
                        </span>
                      )}
                    </td>
                    {[doc.breakaway, doc.indRIA, doc.ma, doc.noLowAUM, doc.masterMerge, doc.lpoa, doc.repaperACAT].map((val, i) => (
                      <td
                        key={i}
                        className="text-center px-4 py-4"
                        style={{ borderBottom: `1px solid ${THEME.colors.border}` }}
                      >
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
                          style={{
                            backgroundColor: val === '✓' ? THEME.colors.teal : val === 'C' ? THEME.colors.gold : THEME.colors.border,
                            color: val === '✓' || val === 'C' ? '#FFFFFF' : THEME.colors.textSecondary,
                          }}
                        >
                          {val}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-6 flex gap-8 text-sm" style={{ color: THEME.colors.textSecondary }}>
            <span className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: THEME.colors.teal, color: '#FFFFFF' }}
              >
                ✓
              </span>
              Required
            </span>
            <span className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: THEME.colors.border, color: THEME.colors.textSecondary }}
              >
                –
              </span>
              Not Applicable
            </span>
            <span className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: THEME.colors.gold, color: '#FFFFFF' }}
              >
                C
              </span>
              Conditional
            </span>
          </div>
        </div>

        {/* Definitions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8" style={{ color: THEME.colors.text }}>
            Document <span style={{ color: THEME.colors.gold }}>Definitions</span>
          </h2>

          <div className="space-y-6">
            {definitions.map((def, idx) => (
              <div
                key={def.code}
                className="rounded-xl p-8"
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `1px solid ${THEME.colors.border}`,
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ backgroundColor: THEME.colors.gold, color: '#FFFFFF' }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-2xl font-bold" style={{ color: THEME.colors.text }}>
                      <span style={{ color: THEME.colors.gold }}>{def.code}</span>
                      {def.code !== def.title && <span> — {def.title}</span>}
                    </h3>
                  </div>
                </div>

                <p className="text-base leading-relaxed mb-6 pl-14" style={{ color: THEME.colors.text }}>
                  {def.body}
                </p>

                <div className="pl-14 flex gap-8 text-sm">
                  <div>
                    <span
                      className="font-semibold uppercase tracking-wide text-xs block mb-1"
                      style={{ color: THEME.colors.textSecondary }}
                    >
                      Owner
                    </span>
                    <p className="font-medium" style={{ color: THEME.colors.text }}>
                      {def.owner}
                    </p>
                  </div>
                  <div>
                    <span
                      className="font-semibold uppercase tracking-wide text-xs block mb-1"
                      style={{ color: THEME.colors.textSecondary }}
                    >
                      Timing
                    </span>
                    <p className="font-medium" style={{ color: THEME.colors.text }}>
                      {def.timing}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/onboarding-vs-transitions"
            className="px-6 py-3 rounded-lg text-sm font-semibold"
            style={{
              border: `1px solid ${THEME.colors.border}`,
              color: THEME.colors.text,
            }}
          >
            ← Back
          </Link>
          <Link
            href="/breakaway"
            className="px-8 py-4 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: THEME.colors.gold,
              color: '#FFFFFF',
            }}
          >
            Next: Breakaway →
          </Link>
        </div>
      </div>
    </div>
  );
}
