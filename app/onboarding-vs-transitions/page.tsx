'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme-provider';

export default function OnboardingVsTransitionsPage() {
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
              Step 02 / 13
            </span>
          </div>
          <h1
            className="text-5xl font-bold mb-4"
            style={{ color: THEME.colors.text }}
          >
            Onboarding vs. <span style={{ color: THEME.colors.gold }}>Transitions</span>
          </h1>
          <p className="text-lg" style={{ color: THEME.colors.textSecondary }}>
            Understanding Team Ownership & Role Responsibilities
          </p>
        </div>

        {/* Two Distinct Workstreams */}
        <div className="mb-16">
          <h2
            className="text-3xl font-bold mb-6"
            style={{ color: THEME.colors.text }}
          >
            Two Distinct <span style={{ color: THEME.colors.gold }}>Workstreams</span>
          </h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: THEME.colors.text }}>
            Onboarding and Transitions are distinct processes with different owners, timelines, and
            success metrics. Understanding the boundary between these two workstreams is critical to
            ensuring nothing falls through the cracks.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Onboarding */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-xl font-bold"
                style={{
                  backgroundColor: THEME.colors.gold,
                  color: '#FFFFFF',
                }}
              >
                ◈
              </div>
              <h3 className="text-xl font-bold mb-4" style={{ color: THEME.colors.text }}>
                Onboarding
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                Owned by the <span className="font-medium">AX Manager (AXM)</span>. Covers everything
                related to setting up the advisor as a Farther professional — their technology access,
                compliance filings, training, introductions to internal teams, and graduation milestones.
              </p>
            </div>

            {/* Transitions */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-xl font-bold"
                style={{
                  backgroundColor: THEME.colors.surface,
                  color: THEME.colors.text,
                  border: `1px solid ${THEME.colors.border}`,
                }}
              >
                ⇌
              </div>
              <h3 className="text-xl font-bold mb-4" style={{ color: THEME.colors.text }}>
                Transitions
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                Owned by the <span className="font-medium">Transitions team (CTM/CTA)</span>. Covers the
                movement of client assets from the advisor's previous custodian to Farther's custodians.
                This process runs in parallel with onboarding but has its own timeline and dependencies.
              </p>
            </div>
          </div>
        </div>

        {/* AXM Role */}
        <div className="mb-16">
          <h2
            className="text-3xl font-bold mb-8"
            style={{ color: THEME.colors.text }}
          >
            AXM — <span style={{ color: THEME.colors.gold }}>Advisor Experience Manager</span>
          </h2>

          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: THEME.colors.surface,
              border: `1px solid ${THEME.colors.border}`,
            }}
          >
            {/* Header */}
            <div
              className="px-8 py-6"
              style={{ borderBottom: `1px solid ${THEME.colors.border}` }}
            >
              <div className="flex items-center gap-4 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                  style={{ backgroundColor: THEME.colors.gold, color: '#FFFFFF' }}
                >
                  A
                </div>
                <div>
                  <p
                    className="text-xs uppercase tracking-wider font-medium mb-1"
                    style={{ color: THEME.colors.gold }}
                  >
                    Primary Ownership
                  </p>
                  <p className="font-medium" style={{ color: THEME.colors.text }}>
                    Onboarding workstream
                  </p>
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider" style={{ color: THEME.colors.textSecondary }}>
                Reports to: Head of Advisor Experience
              </p>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              <h4
                className="text-xs uppercase tracking-wider font-medium mb-4"
                style={{ color: THEME.colors.gold }}
              >
                Core Responsibilities
              </h4>
              <ul className="space-y-3 mb-8">
                {[
                  'Serve as the primary point of contact for the incoming advisor from deal-signed through graduation',
                  'Coordinate the onboarding kickoff meeting (typically within 48 hours of deal signed)',
                  'Manage all compliance filings: U4 submission, ADV-W (for Independent RIAs), NCL processing',
                  'Ensure advisor completes all required training modules before launch',
                  'Run the weekly check-in cadence throughout the onboarding period',
                  'Own the "Go Live" milestone and graduation criteria',
                  'Escalate issues to legal, compliance, or executive sponsors as needed',
                  'Maintain accurate records in the Transition Tracker',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                    <span style={{ color: THEME.colors.gold }}>▸</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h4
                className="text-xs uppercase tracking-wider font-medium mb-4"
                style={{ color: THEME.colors.gold }}
              >
                Success Metrics
              </h4>
              <ul className="space-y-3">
                {[
                  'Advisor launches on or ahead of target date',
                  'All compliance documents filed on time',
                  'Advisor NPS / satisfaction score post-graduation',
                  'No compliance violations during the onboarding window',
                ].map((metric, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                    <span style={{ color: THEME.colors.gold }}>◆</span>
                    <span>{metric}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* AXA Role */}
        <div className="mb-16">
          <h2
            className="text-3xl font-bold mb-8"
            style={{ color: THEME.colors.text }}
          >
            AXA — <span style={{ color: THEME.colors.gold }}>Advisor Experience Associate</span>
          </h2>

          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: THEME.colors.surface,
              border: `1px solid ${THEME.colors.border}`,
            }}
          >
            {/* Header */}
            <div
              className="px-8 py-6"
              style={{ borderBottom: `1px solid ${THEME.colors.border}` }}
            >
              <div className="flex items-center gap-4 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                  style={{
                    backgroundColor: THEME.colors.surface,
                    color: THEME.colors.text,
                    border: `1px solid ${THEME.colors.border}`,
                  }}
                >
                  A
                </div>
                <div>
                  <p
                    className="text-xs uppercase tracking-wider font-medium mb-1"
                    style={{ color: THEME.colors.gold }}
                  >
                    Primary Ownership
                  </p>
                  <p className="font-medium" style={{ color: THEME.colors.text }}>
                    Day-to-day execution and logistics support
                  </p>
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider" style={{ color: THEME.colors.textSecondary }}>
                Reports to: AXM
              </p>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              <h4
                className="text-xs uppercase tracking-wider font-medium mb-4"
                style={{ color: THEME.colors.gold }}
              >
                Core Responsibilities
              </h4>
              <ul className="space-y-3 mb-8">
                {[
                  'Support the AXM in all onboarding logistics and coordination',
                  'Schedule all required meetings (kickoff, check-ins, training sessions, graduation)',
                  'Manage document collection: gather, review, and track IAA, U4, LPOA, and all required agreements',
                  'Send advisor welcome communications and ensure portal access is set up',
                  'Track open items and follow-ups in the Transition Tracker',
                  'Coordinate with the CTM/CTA on transition timelines and custodian requirements',
                  'Prepare meeting agendas and send follow-up summaries after each session',
                  'Manage the Holiday List distribution and scheduling considerations',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                    <span style={{ color: THEME.colors.gold }}>▸</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h4
                className="text-xs uppercase tracking-wider font-medium mb-4"
                style={{ color: THEME.colors.gold }}
              >
                Success Metrics
              </h4>
              <ul className="space-y-3">
                {[
                  'All required documents collected before kickoff',
                  'No missed meetings or scheduling gaps',
                  'Transition Tracker kept current (updated within 24 hours of each touchpoint)',
                ].map((metric, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                    <span style={{ color: THEME.colors.gold }}>◆</span>
                    <span>{metric}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* The Handoff Moment */}
        <div
          className="rounded-xl p-8 mb-12"
          style={{
            backgroundColor: THEME.colors.surface,
            border: `1px solid ${THEME.colors.border}`,
            borderLeft: `4px solid ${THEME.colors.gold}`,
          }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: THEME.colors.text }}>
            The <span style={{ color: THEME.colors.gold }}>Handoff Moment</span>
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
            <span className="font-medium" style={{ color: THEME.colors.gold }}>
              Onboarding begins at deal-signed.
            </span>{' '}
            Transitions begin when the advisor's chosen transition method is confirmed and custodian
            paperwork is initiated. Both workstreams proceed in parallel until Go Live, at which point
            onboarding continues through graduation while transitions closes out remaining account
            transfers.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/introduction"
            className="px-6 py-3 rounded-lg text-sm font-semibold"
            style={{
              border: `1px solid ${THEME.colors.border}`,
              color: THEME.colors.text,
            }}
          >
            ← Back
          </Link>
          <Link
            href="/key-documents"
            className="px-8 py-4 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: THEME.colors.gold,
              color: '#FFFFFF',
            }}
          >
            Next: Key Documents →
          </Link>
        </div>
      </div>
    </div>
  );
}
