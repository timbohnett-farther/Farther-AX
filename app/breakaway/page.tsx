'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme-provider';

export default function BreakawayPage() {
  const { THEME } = useTheme();

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME.colors.bg }}>
      <div className="max-w-5xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-4">
            <span
              className="text-xs uppercase tracking-widest font-semibold"
              style={{ color: THEME.colors.gold }}
            >
              Step 04 / 13
            </span>
          </div>
          <h1
            className="text-5xl font-bold mb-4"
            style={{ color: THEME.colors.text }}
          >
            Breakaway
          </h1>
          <p className="text-lg" style={{ color: THEME.colors.textSecondary }}>
            Advisor Pathway — Wirehouse & Captive Firm Departures
          </p>
        </div>

        {/* Intro */}
        <p
          className="text-base leading-relaxed mb-12"
          style={{
            color: THEME.colors.text,
            borderLeft: `3px solid ${THEME.colors.teal}`,
            paddingLeft: '1.5rem',
          }}
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
            backgroundColor: THEME.colors.surface,
            border: `1px solid ${THEME.colors.gold}`,
            borderLeft: `4px solid ${THEME.colors.gold}`,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⚠️</span>
            <span
              className="text-xs uppercase tracking-wider font-bold"
              style={{ color: THEME.colors.gold }}
            >
              Protocol-Permitted Data Only
            </span>
          </div>
          <p className="text-sm leading-relaxed mb-4" style={{ color: THEME.colors.text }}>
            Farther operates under the Protocol for Broker Recruitment. Advisors leaving a protocol member
            firm may bring <strong>only</strong> the following:
          </p>
          <ol className="space-y-2 mb-4 pl-5 list-decimal">
            {['Client name', 'Address', 'Phone number', 'Email address', 'Account title'].map((item) => (
              <li key={item} className="text-sm font-medium" style={{ color: THEME.colors.text }}>
                {item}
              </li>
            ))}
          </ol>
          <p className="text-xs leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
            Advisors must verify their prior firm's protocol status before departure. Non-protocol
            situations require additional Legal review.
          </p>
        </div>

        {/* Timeline */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8" style={{ color: THEME.colors.text }}>
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
                    style={{ backgroundColor: THEME.colors.teal, color: '#FFFFFF' }}
                  >
                    {step.num}
                  </div>
                  {i < 4 && <div className="w-px flex-1 min-h-8" style={{ backgroundColor: THEME.colors.border }} />}
                </div>
                <div className="pb-8">
                  <p className="font-bold mb-1" style={{ color: THEME.colors.text }}>
                    {step.title}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
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
          style={{
            backgroundColor: THEME.colors.surface,
            border: `1px solid ${THEME.colors.border}`,
          }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: THEME.colors.text }}>
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
              <li key={pitfall} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                <span style={{ color: THEME.colors.gold }}>•</span>
                <span>{pitfall}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/key-documents"
            className="px-6 py-3 rounded-lg text-sm font-semibold"
            style={{
              border: `1px solid ${THEME.colors.border}`,
              color: THEME.colors.text,
            }}
          >
            ← Back
          </Link>
          <Link
            href="/independent-ria"
            className="px-8 py-4 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: THEME.colors.gold,
              color: '#FFFFFF',
            }}
          >
            Next: Independent RIA →
          </Link>
        </div>
      </div>
    </div>
  );
}
