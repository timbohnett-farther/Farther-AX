'use client';

import Link from "next/link";
import QuizSection from "@/components/QuizSection";
import { useTheme } from '@/lib/theme-provider';

export default function OnboardingVsTransitions() {
  const { THEME } = useTheme();

  return (
    <div className="min-h-screen bg-transparent font-sans">
      {/* Top Bar */}
      <div className="border-b border-cream-border bg-charcoal-700">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-serif text-gold-dark text-sm tracking-widest uppercase">
            Farther AX Hub
          </span>
          <span className="text-foreground-muted text-xs tracking-widest uppercase font-medium">
            Step 02 / 13
          </span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-14">
        {/* Page Header */}
        <div className="mb-12">
          <p className="text-gold text-xs tracking-widest uppercase font-medium mb-3">
            ◆ Playbook — Step 02
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-tight mb-4">
            Onboarding vs. Transitions
          </h1>
          <p className="text-foreground-muted text-lg font-sans leading-relaxed">
            Understanding Team Ownership &amp; Role Responsibilities
          </p>
          <div className="mt-6 w-16 h-px bg-gold opacity-60" />
        </div>

        {/* Section 1: Two Distinct Workstreams */}
        <section className="mb-14">
          <h2 className="font-serif text-2xl text-foreground mb-5">
            Two Distinct Workstreams
          </h2>
          <p className="text-foreground-muted leading-relaxed mb-8 max-w-3xl">
            The AX team operates two parallel workstreams when a new advisor joins Farther.
            Onboarding and Transitions are distinct processes with different owners, timelines,
            and success metrics. Understanding the boundary between these two workstreams is
            critical to ensuring nothing falls through the cracks.
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Onboarding Card */}
            <div className="glass-card rounded-xl p-7 transition-all duration-200 hover:shadow-[0_0_20px_rgba(29,118,130,0.2)] hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center text-foreground text-sm font-bold shrink-0 shadow-[0_0_10px_rgba(29,118,130,0.3)]">
                  ◈
                </div>
                <h3 className="font-serif text-xl text-foreground">Onboarding</h3>
              </div>
              <p className="text-foreground-muted leading-relaxed text-sm">
                Owned by the <span className="text-foreground font-medium">AX Manager (AXM)</span>.
                Covers everything related to setting up the advisor as a Farther professional —
                their technology access, compliance filings, training, introductions to internal
                teams, and graduation milestones.
              </p>
            </div>

            {/* Transitions Card */}
            <div className="glass-card rounded-xl p-7 transition-all duration-200 hover:shadow-[0_0_20px_rgba(29,118,130,0.2)] hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-charcoal flex items-center justify-center text-foreground text-sm font-bold shrink-0 shadow-[0_0_10px_rgba(29,118,130,0.15)]">
                  ⇌
                </div>
                <h3 className="font-serif text-xl text-foreground">Transitions</h3>
              </div>
              <p className="text-foreground-muted leading-relaxed text-sm">
                Owned by the <span className="text-foreground font-medium">Transitions team (CTM/CTA)</span>.
                Covers the movement of client assets from the advisor&apos;s previous custodian to
                Farther&apos;s custodians. This process runs in parallel with onboarding but has its
                own timeline and dependencies.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: AXM Role Card */}
        <section className="mb-10">
          <h2 className="font-serif text-2xl text-foreground mb-6">
            AXM — Advisor Experience Manager
          </h2>
          <div className="glass-card rounded-xl overflow-hidden">
            {/* Card Header */}
            <div className="border-b border-cream-border px-8 py-6 flex flex-wrap gap-6 items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold flex items-center justify-center shrink-0">
                  <span className="text-foreground text-xl font-serif font-bold">A</span>
                </div>
                <div>
                  <p className="text-xs text-gold-dark uppercase tracking-widest font-medium mb-0.5">
                    Primary Ownership
                  </p>
                  <p className="text-foreground font-medium">Onboarding workstream</p>
                </div>
              </div>
              <div className="h-px w-full md:h-auto md:w-px bg-cream-border md:self-stretch" />
              <div>
                <p className="text-xs text-gold-dark uppercase tracking-widest font-medium mb-0.5">
                  Reports to
                </p>
                <p className="text-foreground font-medium">Head of Advisor Experience</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-cream-border">
              {/* Core Responsibilities */}
              <div className="px-8 py-7">
                <h4 className="text-xs text-gold-dark uppercase tracking-widest font-medium mb-5">
                  Core Responsibilities
                </h4>
                <ul className="space-y-3">
                  {[
                    "Serve as the primary point of contact for the incoming advisor from deal-signed through graduation",
                    "Coordinate the onboarding kickoff meeting (typically within 48 hours of deal signed)",
                    "Manage all compliance filings: U4 submission, ADV-W (for Independent RIAs), NCL processing",
                    "Ensure advisor completes all required training modules before launch",
                    "Run the weekly check-in cadence throughout the onboarding period",
                    "Own the \u201cGo Live\u201d milestone and graduation criteria",
                    "Escalate issues to legal, compliance, or executive sponsors as needed",
                    "Maintain accurate records in the Transition Tracker",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground-muted leading-relaxed">
                      <span className="text-gold mt-0.5 shrink-0">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right column: Key Relationships + Metrics */}
              <div className="divide-y divide-cream-border">
                <div className="px-8 py-7">
                  <h4 className="text-xs text-gold-dark uppercase tracking-widest font-medium mb-5">
                    Key Relationships
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {["Advisor", "AXA", "Compliance team", "Legal team", "Technology/Ops", "CTM"].map(
                      (rel) => (
                        <span
                          key={rel}
                          className="border border-teal/30 bg-teal/10 text-foreground text-xs px-3 py-1.5 rounded-full font-medium shadow-[0_0_6px_rgba(29,118,130,0.15)]"
                        >
                          {rel}
                        </span>
                      )
                    )}
                  </div>
                </div>
                <div className="px-8 py-7">
                  <h4 className="text-xs text-gold-dark uppercase tracking-widest font-medium mb-5">
                    Success Metrics
                  </h4>
                  <ul className="space-y-3">
                    {[
                      "Advisor launches on or ahead of target date",
                      "All compliance documents filed on time",
                      "Advisor NPS / satisfaction score post-graduation",
                      "No compliance violations during the onboarding window",
                    ].map((metric, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-foreground-muted leading-relaxed">
                        <span className="text-gold-dark mt-0.5 shrink-0">◆</span>
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
        <section className="mb-14">
          <h2 className="font-serif text-2xl text-foreground mb-6">
            AXA — Advisor Experience Associate
          </h2>
          <div className="glass-card rounded-xl overflow-hidden">
            {/* Card Header */}
            <div className="border-b border-cream-border px-8 py-6 flex flex-wrap gap-6 items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-charcoal flex items-center justify-center shrink-0">
                  <span className="text-foreground text-xl font-serif font-bold">A</span>
                </div>
                <div>
                  <p className="text-xs text-gold-dark uppercase tracking-widest font-medium mb-0.5">
                    Primary Ownership
                  </p>
                  <p className="text-foreground font-medium">Day-to-day execution and logistics support</p>
                </div>
              </div>
              <div className="h-px w-full md:h-auto md:w-px bg-cream-border md:self-stretch" />
              <div>
                <p className="text-xs text-gold-dark uppercase tracking-widest font-medium mb-0.5">
                  Reports to
                </p>
                <p className="text-foreground font-medium">AXM</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-cream-border">
              {/* Core Responsibilities */}
              <div className="px-8 py-7">
                <h4 className="text-xs text-gold-dark uppercase tracking-widest font-medium mb-5">
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
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground-muted leading-relaxed">
                      <span className="text-gold mt-0.5 shrink-0">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right column: Key Relationships + Metrics */}
              <div className="divide-y divide-cream-border">
                <div className="px-8 py-7">
                  <h4 className="text-xs text-gold-dark uppercase tracking-widest font-medium mb-5">
                    Key Relationships
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {["AXM", "CTM", "CTA", "Advisor", "Advisor's team/admin"].map(
                      (rel) => (
                        <span
                          key={rel}
                          className="border border-teal/30 bg-teal/10 text-foreground text-xs px-3 py-1.5 rounded-full font-medium shadow-[0_0_6px_rgba(29,118,130,0.15)]"
                        >
                          {rel}
                        </span>
                      )
                    )}
                  </div>
                </div>
                <div className="px-8 py-7">
                  <h4 className="text-xs text-gold-dark uppercase tracking-widest font-medium mb-5">
                    Success Metrics
                  </h4>
                  <ul className="space-y-3">
                    {[
                      "All required documents collected before kickoff",
                      "No missed meetings or scheduling gaps",
                      "Transition Tracker kept current (updated within 24 hours of each touchpoint)",
                    ].map((metric, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-foreground-muted leading-relaxed">
                        <span className="text-gold-dark mt-0.5 shrink-0">◆</span>
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
        <section className="mb-16">
          <h2 className="font-serif text-2xl text-foreground mb-6">
            The Handoff Moment
          </h2>
          <div className="relative bg-charcoal rounded-xl px-8 py-8 overflow-hidden">
            {/* Decorative accent */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gold rounded-l-xl" />
            <div className="absolute top-4 right-6 text-gold opacity-10 text-8xl font-serif leading-none select-none">
              ⇌
            </div>

            {/* Timeline visual */}
            <div className="mb-7">
              <div className="flex items-center gap-0 mb-2">
                <div className="flex items-center gap-2 bg-gold bg-opacity-20 border border-gold border-opacity-40 rounded-lg px-4 py-2 shadow-[0_0_8px_rgba(29,118,130,0.2)]">
                  <span className="text-gold text-xs font-medium uppercase tracking-widest">Deal Signed</span>
                </div>
                <div className="flex-1 h-px bg-gold opacity-30 mx-1" />
                <div className="flex items-center gap-2 bg-gold bg-opacity-10 border border-gold border-opacity-30 rounded-lg px-3 py-2">
                  <span className="text-gold text-xs font-medium uppercase tracking-widest">Transition Initiated</span>
                </div>
                <div className="flex-1 h-px bg-gold opacity-30 mx-1" />
                <div className="flex items-center gap-2 bg-gold bg-opacity-20 border border-gold border-opacity-40 rounded-lg px-4 py-2 shadow-[0_0_8px_rgba(29,118,130,0.2)]">
                  <span className="text-gold text-xs font-medium uppercase tracking-widest">Go Live</span>
                </div>
                <div className="flex-1 h-px bg-gold opacity-30 mx-1" />
                <div className="flex items-center gap-2 bg-gold bg-opacity-10 border border-gold border-opacity-30 rounded-lg px-4 py-2">
                  <span className="text-gold text-xs font-medium uppercase tracking-widest">Graduation</span>
                </div>
              </div>

              {/* Track labels */}
              <div className="mt-3 pl-1 flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold shrink-0" />
                  <span className="text-gold text-xs font-medium">Onboarding track — runs Deal Signed → Graduation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cream-border shrink-0" />
                  <span className="text-foreground-muted text-xs">Transitions track — runs Transition Initiated → account transfers close</span>
                </div>
              </div>
            </div>

            <p className="text-foreground text-sm leading-relaxed relative z-10 max-w-3xl">
              <span className="text-gold font-medium">Onboarding begins at deal-signed.</span>{" "}
              Transitions begin when the advisor&apos;s chosen transition method is confirmed and
              custodian paperwork is initiated. Both workstreams proceed in parallel until Go Live,
              at which point onboarding continues through graduation while transitions closes out
              remaining account transfers.
            </p>
          </div>
        </section>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-cream-border">
          <Link
            href="/introduction"
            className="group inline-flex items-center gap-2 text-foreground-muted text-sm font-medium hover:text-foreground transition-colors duration-200"
          >
            <span className="text-gold group-hover:-translate-x-0.5 transition-transform duration-200">←</span>
            Back
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold" />
            <span className="text-foreground-muted text-xs tracking-widest font-medium">02 / 13</span>
            <span className="w-2 h-2 rounded-full bg-cream-border" />
          </div>

          <Link
            href="/key-documents"
            className="group inline-flex items-center gap-2 bg-teal text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-200 shadow-[0_0_12px_rgba(29,118,130,0.3)] hover:shadow-[0_0_24px_rgba(29,118,130,0.5)] hover:-translate-y-0.5"
          >
            Next
            <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
          </Link>
        </div>

        <QuizSection topicSlug="onboarding-vs-transitions" topicTitle="Onboarding vs. Transitions" />
      </main>
    </div>
  );
}
