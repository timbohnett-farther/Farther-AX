'use client';

import Link from "next/link";
import QuizSection from "@/components/QuizSection";
import { useTheme } from '@/lib/theme-provider';

export default function OnboardingVsTransitions() {
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
          02 / 13
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-20 lg:py-28">

        {/* Page Header */}
        <header className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1" style={{ backgroundColor: THEME.colors.gold, opacity: 0.3 }} />
            <span className="font-sans text-xs tracking-[0.25em] uppercase" style={{ color: THEME.colors.gold }}>
              Playbook — Step 02
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: THEME.colors.gold, opacity: 0.3 }} />
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl leading-tight mb-5 tracking-tight text-center" style={{ color: THEME.colors.text }}>
            Onboarding vs. <span style={{ color: THEME.colors.gold }}>Transitions</span>
          </h1>
          <p className="font-sans text-base tracking-wide text-center" style={{ color: THEME.colors.textSecondary }}>
            Understanding Team Ownership &amp; Role Responsibilities
          </p>
        </header>

        {/* Section 1: Two Distinct Workstreams */}
        <section className="mb-20">
          <div className="mb-10">
            <h2 className="font-serif text-3xl mb-2" style={{ color: THEME.colors.text }}>
              Two Distinct <span style={{ color: THEME.colors.gold }}>Workstreams</span>
            </h2>
            <p className="font-sans text-sm" style={{ color: THEME.colors.textSecondary }}>
              The AX team operates two parallel workstreams when a new advisor joins Farther.
            </p>
          </div>

          <p className="font-sans text-base leading-8 mb-10" style={{ color: THEME.colors.text }}>
            Onboarding and Transitions are distinct processes with different owners, timelines,
            and success metrics. Understanding the boundary between these two workstreams is
            critical to ensuring nothing falls through the cracks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Onboarding Card */}
            <div
              className="rounded-2xl p-8 transition-all duration-300"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
                boxShadow: '0 0 0 rgba(29,118,130,0)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 24px rgba(29,118,130,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 rgba(29,118,130,0)'}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    backgroundColor: THEME.colors.gold,
                    color: '#FFFFFF',
                    boxShadow: '0 0 10px rgba(29,118,130,0.3)'
                  }}
                >
                  ◈
                </div>
                <h3 className="font-serif text-xl" style={{ color: THEME.colors.text }}>Onboarding</h3>
              </div>
              <p className="font-sans text-sm leading-7" style={{ color: THEME.colors.text }}>
                Owned by the <span className="font-medium">AX Manager (AXM)</span>.
                Covers everything related to setting up the advisor as a Farther professional —
                their technology access, compliance filings, training, introductions to internal
                teams, and graduation milestones.
              </p>
            </div>

            {/* Transitions Card */}
            <div
              className="rounded-2xl p-8 transition-all duration-300"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
                boxShadow: '0 0 0 rgba(29,118,130,0)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 24px rgba(29,118,130,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 rgba(29,118,130,0)'}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    backgroundColor: THEME.colors.surface,
                    color: THEME.colors.text,
                    border: `1px solid ${THEME.colors.border}`,
                    boxShadow: '0 0 10px rgba(29,118,130,0.15)'
                  }}
                >
                  ⇌
                </div>
                <h3 className="font-serif text-xl" style={{ color: THEME.colors.text }}>Transitions</h3>
              </div>
              <p className="font-sans text-sm leading-7" style={{ color: THEME.colors.text }}>
                Owned by the <span className="font-medium">Transitions team (CTM/CTA)</span>.
                Covers the movement of client assets from the advisor&apos;s previous custodian to
                Farther&apos;s custodians. This process runs in parallel with onboarding but has its
                own timeline and dependencies.
              </p>
            </div>

          </div>
        </section>

        {/* Section 2: AXM Role Card */}
        <section className="mb-20">
          <div className="mb-8">
            <h2 className="font-serif text-3xl mb-2" style={{ color: THEME.colors.text }}>
              AXM — <span style={{ color: THEME.colors.gold }}>Advisor Experience Manager</span>
            </h2>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}` }}>

            {/* Card Header */}
            <div className="px-8 py-6 flex flex-col sm:flex-row sm:items-start gap-6" style={{ borderBottom: `1px solid ${THEME.colors.border}` }}>
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: THEME.colors.gold }}
                >
                  <span className="text-xl font-serif font-bold" style={{ color: '#FFFFFF' }}>A</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: THEME.colors.gold }}>
                    Primary Ownership
                  </p>
                  <p className="font-medium" style={{ color: THEME.colors.text }}>Onboarding workstream</p>
                </div>
              </div>
              <div className="hidden sm:block w-px self-stretch" style={{ backgroundColor: THEME.colors.border }} />
              <div>
                <p className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: THEME.colors.gold }}>
                  Reports to
                </p>
                <p className="font-medium" style={{ color: THEME.colors.text }}>Head of Advisor Experience</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

              {/* Core Responsibilities */}
              <div className="px-8 py-7" style={{ borderBottom: `1px solid ${THEME.colors.border}` }}>
                <h4 className="text-xs uppercase tracking-widest font-medium mb-5" style={{ color: THEME.colors.gold }}>
                  Core Responsibilities
                </h4>
                <ul className="space-y-3">
                  {[
                    "Serve as the primary point of contact for the incoming advisor from deal-signed through graduation",
                    "Coordinate the onboarding kickoff meeting (typically within 48 hours of deal signed)",
                    "Manage all compliance filings: U4 submission, ADV-W (for Independent RIAs), NCL processing",
                    "Ensure advisor completes all required training modules before launch",
                    "Run the weekly check-in cadence throughout the onboarding period",
                    "Own the \"Go Live\" milestone and graduation criteria",
                    "Escalate issues to legal, compliance, or executive sponsors as needed",
                    "Maintain accurate records in the Transition Tracker",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                      <span className="mt-0.5 shrink-0" style={{ color: THEME.colors.gold }}>▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Relationships + Metrics */}
              <div style={{ borderLeft: `1px solid ${THEME.colors.border}` }}>
                <div className="px-8 py-7" style={{ borderBottom: `1px solid ${THEME.colors.border}` }}>
                  <h4 className="text-xs uppercase tracking-widest font-medium mb-5" style={{ color: THEME.colors.gold }}>
                    Key Relationships
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {["Advisor", "AXA", "Compliance team", "Legal team", "Technology/Ops", "CTM"].map((rel) => (
                      <span
                        key={rel}
                        className="text-xs px-3 py-1.5 rounded-full font-medium"
                        style={{
                          border: `1px solid rgba(182, 138, 76, 0.3)`,
                          backgroundColor: 'rgba(182, 138, 76, 0.1)',
                          color: THEME.colors.text
                        }}
                      >
                        {rel}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="px-8 py-7">
                  <h4 className="text-xs uppercase tracking-widest font-medium mb-5" style={{ color: THEME.colors.gold }}>
                    Success Metrics
                  </h4>
                  <ul className="space-y-3">
                    {[
                      "Advisor launches on or ahead of target date",
                      "All compliance documents filed on time",
                      "Advisor NPS / satisfaction score post-graduation",
                      "No compliance violations during the onboarding window",
                    ].map((metric, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                        <span className="mt-0.5 shrink-0" style={{ color: THEME.colors.gold }}>◆</span>
                        <span>{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Section 3: AXA Role Card */}
        <section className="mb-20">
          <div className="mb-8">
            <h2 className="font-serif text-3xl mb-2" style={{ color: THEME.colors.text }}>
              AXA — <span style={{ color: THEME.colors.gold }}>Advisor Experience Associate</span>
            </h2>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}` }}>

            {/* Card Header */}
            <div className="px-8 py-6 flex flex-col sm:flex-row sm:items-start gap-6" style={{ borderBottom: `1px solid ${THEME.colors.border}` }}>
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: THEME.colors.surface,
                    border: `1px solid ${THEME.colors.border}`
                  }}
                >
                  <span className="text-xl font-serif font-bold" style={{ color: THEME.colors.text }}>A</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: THEME.colors.gold }}>
                    Primary Ownership
                  </p>
                  <p className="font-medium" style={{ color: THEME.colors.text }}>Day-to-day execution and logistics support</p>
                </div>
              </div>
              <div className="hidden sm:block w-px self-stretch" style={{ backgroundColor: THEME.colors.border }} />
              <div>
                <p className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: THEME.colors.gold }}>
                  Reports to
                </p>
                <p className="font-medium" style={{ color: THEME.colors.text }}>AXM</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

              {/* Core Responsibilities */}
              <div className="px-8 py-7" style={{ borderBottom: `1px solid ${THEME.colors.border}` }}>
                <h4 className="text-xs uppercase tracking-widest font-medium mb-5" style={{ color: THEME.colors.gold }}>
                  Core Responsibilities
                </h4>
                <ul className="space-y-3">
                  {[
                    "Support the AXM in all onboarding logistics and coordination",
                    "Schedule all required meetings (kickoff, check-ins, training sessions, graduation)",
                    "Manage document collection: gather, review, and track IAA, U4, LPOA, and all required agreements",
                    "Send advisor welcome communications and ensure portal access is set up",
                    "Track open items and follow-ups in the Transition Tracker",
                    "Coordinate with the CTM/CTA on transition timelines and custodian requirements",
                    "Prepare meeting agendas and send follow-up summaries after each session",
                    "Manage the Holiday List distribution and scheduling considerations",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                      <span className="mt-0.5 shrink-0" style={{ color: THEME.colors.gold }}>▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Relationships + Metrics */}
              <div style={{ borderLeft: `1px solid ${THEME.colors.border}` }}>
                <div className="px-8 py-7" style={{ borderBottom: `1px solid ${THEME.colors.border}` }}>
                  <h4 className="text-xs uppercase tracking-widest font-medium mb-5" style={{ color: THEME.colors.gold }}>
                    Key Relationships
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {["AXM", "CTM", "CTA", "Advisor", "Advisor's team/admin"].map((rel) => (
                      <span
                        key={rel}
                        className="text-xs px-3 py-1.5 rounded-full font-medium"
                        style={{
                          border: `1px solid rgba(182, 138, 76, 0.3)`,
                          backgroundColor: 'rgba(182, 138, 76, 0.1)',
                          color: THEME.colors.text
                        }}
                      >
                        {rel}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="px-8 py-7">
                  <h4 className="text-xs uppercase tracking-widest font-medium mb-5" style={{ color: THEME.colors.gold }}>
                    Success Metrics
                  </h4>
                  <ul className="space-y-3">
                    {[
                      "All required documents collected before kickoff",
                      "No missed meetings or scheduling gaps",
                      "Transition Tracker kept current (updated within 24 hours of each touchpoint)",
                    ].map((metric, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                        <span className="mt-0.5 shrink-0" style={{ color: THEME.colors.gold }}>◆</span>
                        <span>{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Section 4: The Handoff Moment */}
        <section className="mb-24">
          <div className="mb-8">
            <h2 className="font-serif text-3xl mb-2" style={{ color: THEME.colors.text }}>
              The <span style={{ color: THEME.colors.gold }}>Handoff Moment</span>
            </h2>
          </div>

          <div className="relative rounded-2xl px-8 py-8 overflow-hidden" style={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}` }}>

            {/* Decorative accent */}
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ backgroundColor: THEME.colors.gold }} />
            <div
              className="absolute top-4 right-6 text-8xl font-serif leading-none select-none"
              style={{ color: THEME.colors.gold, opacity: 0.1 }}
            >
              ⇌
            </div>

            {/* Timeline visual */}
            <div className="mb-7 relative z-10">
              <div className="flex items-center gap-0 mb-4">
                <div
                  className="flex items-center gap-2 rounded-lg px-4 py-2"
                  style={{
                    backgroundColor: 'rgba(182, 138, 76, 0.2)',
                    border: `1px solid rgba(182, 138, 76, 0.4)`,
                    boxShadow: '0 0 8px rgba(29,118,130,0.2)'
                  }}
                >
                  <span className="text-xs font-medium uppercase tracking-widest" style={{ color: THEME.colors.gold }}>Deal Signed</span>
                </div>

                <div className="flex-1 h-px mx-1" style={{ backgroundColor: THEME.colors.gold, opacity: 0.3 }} />

                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{
                    backgroundColor: 'rgba(182, 138, 76, 0.1)',
                    border: `1px solid rgba(182, 138, 76, 0.3)`
                  }}
                >
                  <span className="text-xs font-medium uppercase tracking-widest" style={{ color: THEME.colors.gold }}>Transition Initiated</span>
                </div>

                <div className="flex-1 h-px mx-1" style={{ backgroundColor: THEME.colors.gold, opacity: 0.3 }} />

                <div
                  className="flex items-center gap-2 rounded-lg px-4 py-2"
                  style={{
                    backgroundColor: 'rgba(182, 138, 76, 0.2)',
                    border: `1px solid rgba(182, 138, 76, 0.4)`,
                    boxShadow: '0 0 8px rgba(29,118,130,0.2)'
                  }}
                >
                  <span className="text-xs font-medium uppercase tracking-widest" style={{ color: THEME.colors.gold }}>Go Live</span>
                </div>

                <div className="flex-1 h-px mx-1" style={{ backgroundColor: THEME.colors.gold, opacity: 0.3 }} />

                <div
                  className="flex items-center gap-2 rounded-lg px-4 py-2"
                  style={{
                    backgroundColor: 'rgba(182, 138, 76, 0.1)',
                    border: `1px solid rgba(182, 138, 76, 0.3)`
                  }}
                >
                  <span className="text-xs font-medium uppercase tracking-widest" style={{ color: THEME.colors.gold }}>Graduation</span>
                </div>
              </div>

              {/* Track labels */}
              <div className="mt-4 pl-1 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: THEME.colors.gold }} />
                  <span className="text-xs font-medium" style={{ color: THEME.colors.gold }}>Onboarding track — runs Deal Signed → Graduation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: THEME.colors.border }} />
                  <span className="text-xs" style={{ color: THEME.colors.textSecondary }}>Transitions track — runs Transition Initiated → account transfers close</span>
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed relative z-10 max-w-3xl" style={{ color: THEME.colors.text }}>
              <span className="font-medium" style={{ color: THEME.colors.gold }}>Onboarding begins at deal-signed.</span>{" "}
              Transitions begin when the advisor&apos;s chosen transition method is confirmed and
              custodian paperwork is initiated. Both workstreams proceed in parallel until Go Live,
              at which point onboarding continues through graduation while transitions closes out
              remaining account transfers.
            </p>
          </div>
        </section>

        {/* Bottom Navigation */}
        <footer className="flex items-center justify-between border-t pt-10" style={{ borderColor: THEME.colors.border }}>
          <Link
            href="/introduction"
            className="group inline-flex items-center gap-3 font-sans text-sm tracking-wide px-6 py-3 rounded-full transition-all duration-200"
            style={{ color: THEME.colors.textSecondary }}
            onMouseEnter={(e) => { e.currentTarget.style.color = THEME.colors.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = THEME.colors.textSecondary; }}
          >
            <span>&larr;</span>
            <span>Back</span>
          </Link>

          <span className="font-sans text-xs tracking-[0.2em] uppercase" style={{ color: THEME.colors.textSecondary }}>
            02 / 13
          </span>

          <Link
            href="/key-documents"
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

        <QuizSection topicSlug="onboarding-vs-transitions" topicTitle="Onboarding vs. Transitions" />

      </div>
    </div>
  );
}
