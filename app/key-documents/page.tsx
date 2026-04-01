'use client';

import PageLayout from '@/components/PageLayout';

export default function KeyDocumentsPage() {

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

  const getCellStyle = (val: string) => {
    if (val === '✓') return 'bg-[#3B5A69] text-white';
    if (val === 'C') return 'bg-[#B68A4C] text-white';
    return 'bg-[var(--color-border)] text-[var(--color-text-secondary)]';
  };

  return (
    <PageLayout
      step={3}
      title="Key Documents"
      subtitle="Document Applicability Matrix & Definitions"
      backHref="/onboarding-vs-transitions"
      nextHref="/breakaway"
      nextLabel="Next: Breakaway"
    >
      <div className="max-w-6xl mx-auto">
        {/* Introduction */}
        <p className="text-base leading-relaxed mb-12 text-[var(--color-text)]">
          Every advisor onboarding involves a set of core documents. Which documents apply depends on the
          advisor's pathway and the transition method selected. Use the matrix below to quickly identify
          which documents are required for any given scenario, then refer to the definitions section for
          detailed explanations of each document's purpose, timing, and owner.
        </p>

        {/* Matrix Table */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 font-serif text-[var(--color-text)]">
            Document Applicability <span className="text-[#B68A4C]">Matrix</span>
          </h2>

          <div className="rounded-xl overflow-x-auto border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface)]">
                  <th className="text-left px-6 py-4 font-semibold text-[var(--color-text)] border-b border-[var(--color-border)]">
                    Document
                  </th>
                  {['Breakaway', 'Ind RIA', 'M&A', 'No/Low AUM', 'Master Merge', 'LPOA', 'Repaper/ACAT'].map((h) => (
                    <th
                      key={h}
                      className="text-center px-4 py-4 font-semibold text-[var(--color-text)] border-b border-[var(--color-border)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, idx) => (
                  <tr
                    key={doc.code}
                    className={idx % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-bg)]'}
                  >
                    <td className="px-6 py-4 text-[var(--color-text)] border-b border-[var(--color-border)]">
                      <div>
                        <div className="font-semibold text-[#B68A4C]">{doc.code}</div>
                        <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{doc.name}</div>
                      </div>
                    </td>
                    {[doc.breakaway, doc.indRIA, doc.ma, doc.noLowAUM, doc.masterMerge, doc.lpoa, doc.repaperACAT].map((val, i) => (
                      <td
                        key={i}
                        className="text-center px-4 py-4 border-b border-[var(--color-border)]"
                      >
                        <span className={`inline-block w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getCellStyle(val)}`}>
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
          <div className="flex items-center gap-6 mt-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-6 rounded-full bg-[#3B5A69] text-white flex items-center justify-center font-bold">✓</span>
              <span className="text-[var(--color-text-secondary)]">Required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-6 rounded-full bg-[var(--color-border)] text-[var(--color-text-secondary)] flex items-center justify-center font-bold">–</span>
              <span className="text-[var(--color-text-secondary)]">Not Applicable</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-6 rounded-full bg-[#B68A4C] text-white flex items-center justify-center font-bold">C</span>
              <span className="text-[var(--color-text-secondary)]">Conditional</span>
            </div>
          </div>
        </div>

        {/* Definitions */}
        <div>
          <h2 className="text-3xl font-bold mb-8 font-serif text-[var(--color-text)]">
            Document <span className="text-[#B68A4C]">Definitions</span>
          </h2>

          <div className="space-y-6">
            {definitions.map((def) => (
              <div
                key={def.code}
                className="rounded-xl p-6 bg-[var(--color-surface)] border border-[var(--color-border)]"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#B68A4C] text-white">
                    {def.code}
                  </span>
                  <h3 className="text-lg font-bold font-serif text-[var(--color-text)]">
                    <span className="text-[#B68A4C]">{def.code}</span> — {def.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed mb-4 text-[var(--color-text)]">{def.body}</p>
                <div className="flex gap-6 text-xs">
                  <div>
                    <span className="font-semibold text-[var(--color-text-secondary)]">Owner:</span>{' '}
                    <span className="text-[var(--color-text)]">{def.owner}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--color-text-secondary)]">Timing:</span>{' '}
                    <span className="text-[var(--color-text)]">{def.timing}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
