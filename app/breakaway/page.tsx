'use client';

import PageLayout from '@/components/PageLayout';
export default function BreakawayPage() {

  return (
    <PageLayout
      step={4}
      title="Breakaway"
      subtitle="Advisor Pathway — Wirehouse & Captive Firm Departures"
      backHref="/key-documents"
      nextHref="/independent-ria"
      nextLabel="Next: Independent RIA"
    >
      <div className="max-w-5xl mx-auto">
        {/* Intro */}
        <p
          className="text-base leading-relaxed mb-12"
        >
          The Breakaway pathway applies to advisors departing a wirehouse (Merrill Lynch, Morgan Stanley,
          UBS, Wells Fargo, Raymond James, etc.) or other captive firm to join Farther. This pathway
          carries the <strong>highest compliance sensitivity</strong> of all four onboarding paths. Every
          step must be carefully sequenced to protect the advisor, protect Farther, and avoid triggering
          unnecessary legal action from the departing firm.
        </p>

        {/* Protocol Callout */}
        <div
          className="rounded-xl p-8 mb-12"
          style={{
            border: `1px solid ${'#B68A4C'}`,
            borderLeft: `4px solid ${'#B68A4C'}`,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⚠️</span>
            <span
              className="text-xs uppercase tracking-wider font-bold"
              style={{ color: '#B68A4C' }}
            >
              Protocol-Permitted Data Only
            </span>
          </div>
          <p className="text-sm leading-relaxed mb-4 text-[var(--color-text)]">
            Farther operates under the Protocol for Broker Recruitment. Advisors leaving a protocol member
            firm may bring <strong>only</strong> the following:
          </p>
          <ol className="space-y-2 mb-4 pl-5 list-decimal">
            {['Client name', 'Address', 'Phone number', 'Email address', 'Account title'].map((item) => (
              <li key={item} className="text-sm font-medium text-[var(--color-text)]">
                {item}
              </li>
            ))}
          </ol>
          <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
            Advisors must verify their prior firm's protocol status before departure. Non-protocol
            situations require additional Legal review.
          </p>
        </div>

        {/* Timeline */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-[var(--color-text)]">
            Critical Timeline Sequencing
          </h2>

          <div className="space-y-0">
            {[
              { num: '01', title: 'Deal Signed', body: 'AXM assigned. Legal briefed. NCL reviewed. No client contact yet.' },
              { num: '02', title: 'Pre-Resignation Phase', body: 'All Farther tech access and training completed in stealth. IAA and Exhibit B signed. U4 prepared but held.' },
              { num: '03', title: 'Resignation Day', body: 'Advisor formally resigns. U4 submitted immediately. Client notification letters prepared for same-day or next-day delivery.' },
              { num: '04', title: 'Post-Resignation', body: 'Client outreach begins per protocol. Transition method initiated. Custodian paperwork submitted.' },
              { num: '05', title: 'Go Live', body: 'Advisor is active on Farther platform. Transitions running in parallel.' },
            ].map((step, i) => (
              <div key={step.num} className="flex gap-6">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: '#3B5A69', color: '#FFFFFF' }}
                  >
                    {step.num}
                  </div>
                  {i < 4 && <div className="w-px flex-1 min-h-8" style={{ backgroundColor: 'var(--color-border)' }} />}
                </div>
                <div className="pb-8">
                  <p className="font-bold mb-1 text-[var(--color-text)]">
                    {step.title}
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Common Pitfalls */}
        <div
          className="rounded-xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 text-[var(--color-text)]">
            Common Pitfalls
          </h2>
          <ul className="space-y-3">
            {[
              'Submitting U4 before resignation — creates FINRA event, alerts prior firm',
              'Client outreach before resignation — non-solicitation violation risk',
              'Taking client data beyond protocol list — grounds for injunctive relief',
              "Failing to check prior firm's protocol membership status",
              'Not briefing Farther Legal before advisor communicates any transition plans',
            ].map((pitfall) => (
              <li key={pitfall} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
                <span style={{ color: '#B68A4C' }}>•</span>
                <span>{pitfall}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </PageLayout>
  );
}
