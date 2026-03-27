'use client';

import Link from "next/link";
import { useMemo } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { getThemeColors } from '@/lib/design-tokens';

export default function IntroductionPage() {
  const { theme } = useTheme();
  const C = useMemo(() => getThemeColors(theme === 'dark'), [theme]);

  return (
    <div className="min-h-screen" style={{ color: C.dark }}>
      {/* Step Indicator — hidden on mobile (covered by nav header) */}
      <div className="hidden sm:block fixed top-6 right-8 z-50">
        <span className="font-sans text-xs tracking-[0.2em] uppercase px-4 py-2 rounded-full" style={{ background: C.cardBg, border: `1px solid ${C.border}`, color: C.slate }}>
          01 / 13
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 lg:py-20">

        {/* Page Header */}
        <header className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gold opacity-30" />
            <span className="font-sans text-xs tracking-[0.25em] uppercase text-gold">
              Farther Advisor Experience
            </span>
            <div className="h-px flex-1 bg-gold opacity-30" />
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl leading-tight mb-5 tracking-tight text-center" style={{ color: C.dark }}>
            Welcome to the <span className="text-gold">AX Playbook</span>
          </h1>
          <p className="font-sans text-base tracking-wide text-center" style={{ color: C.slate }}>
            Advisor Experience Onboarding &amp; Transition Reference
          </p>
        </header>

        {/* Overview */}
        <section className="mb-20">
          <div className="rounded-2xl px-4 sm:px-10 py-6 sm:py-10" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
            <p className="font-sans text-base leading-8" style={{ color: C.dark }}>
              This playbook is the definitive reference for Farther&rsquo;s Advisor Experience (AX) team. It
              guides <strong className="font-semibold" style={{ color: C.dark }}>AX Managers (AXMs)</strong> and{" "}
              <strong className="font-semibold" style={{ color: C.dark }}>AX Associates (AXAs)</strong> through every step of
              bringing a new advisor onto the Farther platform — from the moment a deal is signed through the
              advisor&rsquo;s graduation to full independence. Whether you&rsquo;re onboarding a breakaway advisor
              leaving a wirehouse, integrating an Independent RIA, or working through a complex M&amp;A situation,
              this resource provides the frameworks, documents, timelines, and workflows you need.
            </p>
          </div>
        </section>

        {/* The Four Advisor Onboarding Paths */}
        <section className="mb-20">
          <div className="mb-10">
            <h2 className="font-serif text-3xl mb-2" style={{ color: C.dark }}>
              The Four Advisor{" "}
              <span className="text-gold">Onboarding Paths</span>
            </h2>
            <p className="font-sans text-sm" style={{ color: C.slate }}>
              Every advisor follows one of four distinct paths based on their background and book of business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Card 1: Breakaway */}
            <div className="rounded-2xl p-8 group hover:shadow-[0_0_24px_rgba(29,118,130,0.2)] transition-all duration-300" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
              <div className="flex items-start justify-between mb-6">
                <span className="font-serif text-5xl text-gold opacity-25 leading-none select-none">01</span>
                <span className="font-sans text-[10px] tracking-[0.2em] uppercase bg-gold/10 text-gold-dark border border-gold/20 px-3 py-1 rounded-full shadow-[0_0_8px_rgba(29,118,130,0.15)]">
                  High Compliance
                </span>
              </div>
              <h3 className="font-serif text-xl mb-2" style={{ color: C.dark }}>Breakaway</h3>
              <p className="font-sans text-xs uppercase tracking-widest mb-4" style={{ color: C.slate }}>
                Wirehouse / Captive Firm
              </p>
              <p className="font-sans text-sm leading-7" style={{ color: C.dark }}>
                Advisor departing a wirehouse or captive firm. Highest compliance sensitivity — resignation must
                occur before certain steps can proceed, and the U4 is held until departure. Typical advisors
                leaving Merrill Lynch, Morgan Stanley, UBS, or Wells Fargo.
              </p>
            </div>

            {/* Card 2: Independent RIA */}
            <div className="rounded-2xl p-8 group hover:shadow-[0_0_24px_rgba(16,185,129,0.15)] transition-all duration-300" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
              <div className="flex items-start justify-between mb-6">
                <span className="font-serif text-5xl text-gold opacity-25 leading-none select-none">02</span>
                <span className="font-sans text-[10px] tracking-[0.2em] uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                  Lower Legal Risk
                </span>
              </div>
              <h3 className="font-serif text-xl mb-2" style={{ color: C.dark }}>Independent RIA</h3>
              <p className="font-sans text-xs uppercase tracking-widest mb-4" style={{ color: C.slate }}>
                Existing RIA Owner
              </p>
              <p className="font-sans text-sm leading-7" style={{ color: C.dark }}>
                Advisor who already owns their book of business and operates independently. Must file an ADV-W
                within 90 days of joining Farther. Considerations vary by dual vs. non-dual registration states.
              </p>
            </div>

            {/* Card 3: M&A */}
            <div className="rounded-2xl p-8 group hover:shadow-[0_0_24px_rgba(59,130,246,0.15)] transition-all duration-300" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
              <div className="flex items-start justify-between mb-6">
                <span className="font-serif text-5xl text-gold opacity-25 leading-none select-none">03</span>
                <span className="font-sans text-[10px] tracking-[0.2em] uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.2)]">
                  Case-by-Case
                </span>
              </div>
              <h3 className="font-serif text-xl mb-2" style={{ color: C.dark }}>M&amp;A</h3>
              <p className="font-sans text-xs uppercase tracking-widest mb-4" style={{ color: C.slate }}>
                Mergers &amp; Acquisitions
              </p>
              <p className="font-sans text-sm leading-7" style={{ color: C.dark }}>
                Advisor or practice joining Farther through an acquisition or merger transaction. Complex legal and
                operational considerations apply. Each situation is handled individually with dedicated support.
              </p>
            </div>

            {/* Card 4: No to Low AUM */}
            <div className="rounded-2xl p-8 group hover:shadow-[0_0_24px_rgba(245,158,11,0.15)] transition-all duration-300" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
              <div className="flex items-start justify-between mb-6">
                <span className="font-serif text-5xl text-gold opacity-25 leading-none select-none">04</span>
                <span className="font-sans text-[10px] tracking-[0.2em] uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                  Training First
                </span>
              </div>
              <h3 className="font-serif text-xl mb-2" style={{ color: C.dark }}>No to Low AUM</h3>
              <p className="font-sans text-xs uppercase tracking-widest mb-4" style={{ color: C.slate }}>
                Below $15–20M AUM
              </p>
              <p className="font-sans text-sm leading-7" style={{ color: C.dark }}>
                Advisors bringing less than $15–20M in assets under management. A training-first approach is taken
                before full onboarding begins. Requires a Focus Team assessment to evaluate fit and growth trajectory.
              </p>
            </div>

          </div>
        </section>

        {/* The Three Transition Methods */}
        <section className="mb-20">
          <div className="mb-10">
            <h2 className="font-serif text-3xl mb-2" style={{ color: C.dark }}>
              The Three{" "}
              <span className="text-gold">Transition Methods</span>
            </h2>
            <p className="font-sans text-sm" style={{ color: C.slate }}>
              After an advisor joins, client assets must transition to Farther&rsquo;s custodians via one of three methods.
            </p>
          </div>

          <div className="flex flex-col gap-5">

            {/* Method 1: Master Merge */}
            <div className="rounded-2xl px-8 py-7" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="shrink-0">
                  <span className="inline-block font-sans text-[10px] tracking-[0.2em] uppercase bg-gold/10 text-gold-dark border border-gold/20 px-4 py-2 rounded-full whitespace-nowrap shadow-[0_0_8px_rgba(29,118,130,0.15)]">
                    4–6 weeks
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-2 h-2 rounded-full bg-gold shrink-0" />
                    <h3 className="font-serif text-lg" style={{ color: C.dark }}>Master Merge</h3>
                  </div>
                  <p className="font-sans text-xs uppercase tracking-widest mb-3 pl-5" style={{ color: C.slate }}>
                    Fastest Method
                  </p>
                  <p className="font-sans text-sm leading-7 pl-5" style={{ color: C.dark }}>
                    Assets are moved via a master account merge at the custodian level. Best suited for advisors
                    with large, uniform books of business. Requires close custodian coordination and is the most
                    efficient path when available.
                  </p>
                </div>
              </div>
            </div>

            {/* Method 2: LPOA */}
            <div className="rounded-2xl px-8 py-7" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="shrink-0">
                  <span className="inline-block font-sans text-[10px] tracking-[0.2em] uppercase bg-gold/10 text-gold-dark border border-gold/20 px-4 py-2 rounded-full whitespace-nowrap shadow-[0_0_8px_rgba(29,118,130,0.15)]">
                    6–8 weeks
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-2 h-2 rounded-full bg-gold shrink-0" />
                    <h3 className="font-serif text-lg" style={{ color: C.dark }}>LPOA — Limited Power of Attorney</h3>
                  </div>
                  <p className="font-sans text-xs uppercase tracking-widest mb-3 pl-5" style={{ color: C.slate }}>
                    Mid-Range Timeline
                  </p>
                  <p className="font-sans text-sm leading-7 pl-5" style={{ color: C.dark }}>
                    The advisor signs an LPOA document authorizing Farther to act on behalf of clients. Available
                    at Schwab, Fidelity IWS, and Pershing PAS. A balanced option when a Master Merge is not
                    available.
                  </p>
                </div>
              </div>
            </div>

            {/* Method 3: Repaper / ACAT */}
            <div className="rounded-2xl px-8 py-7" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="shrink-0">
                  <span className="inline-block font-sans text-[10px] tracking-[0.2em] uppercase bg-gold/10 text-gold-dark border border-gold/20 px-4 py-2 rounded-full whitespace-nowrap shadow-[0_0_8px_rgba(29,118,130,0.15)]">
                    8–12 weeks
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-2 h-2 rounded-full bg-gold shrink-0" />
                    <h3 className="font-serif text-lg" style={{ color: C.dark }}>Repaper / ACAT</h3>
                  </div>
                  <p className="font-sans text-xs uppercase tracking-widest mb-3 pl-5" style={{ color: C.slate }}>
                    Longest Method
                  </p>
                  <p className="font-sans text-sm leading-7 pl-5" style={{ color: C.dark }}>
                    Clients must sign new account paperwork (repaper) and assets transfer via ACAT — Automated
                    Customer Account Transfer. Required when neither LPOA nor Master Merge is available. The most
                    client-touch-intensive path.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* How to Use This Playbook */}
        <section className="mb-24">
          <div className="mb-8">
            <h2 className="font-serif text-3xl mb-2" style={{ color: C.dark }}>
              How to Use{" "}
              <span className="text-gold">This Playbook</span>
            </h2>
          </div>

          <div className="rounded-2xl px-10 py-9" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
            <p className="font-sans text-sm leading-8" style={{ color: C.dark }}>
              Use the navigation on the left to move through each section of this playbook. The step indicator
              in the top-right corner of every page shows your current position — for example,{" "}
              <span className="font-semibold" style={{ color: C.dark }}>01 / 13</span>. Use the{" "}
              <span className="font-semibold" style={{ color: C.dark }}>Next</span> and{" "}
              <span className="font-semibold" style={{ color: C.dark }}>Back</span> buttons at the bottom of each page to
              move sequentially through the material, or jump directly to any section from the sidebar at any
              time.
            </p>
          </div>
        </section>

        {/* Bottom Navigation */}
        <footer className="flex items-center justify-between border-t pt-10" style={{ borderColor: C.border }}>
          <span className="font-sans text-xs tracking-[0.2em] uppercase" style={{ color: C.slate }}>
            Introduction
          </span>
          <Link
            href="/onboarding-vs-transitions"
            className="group inline-flex items-center gap-3 font-sans text-sm tracking-wide bg-gold text-white px-8 py-4 rounded-full hover:bg-gold-dark transition-all duration-200 shadow-[0_0_16px_rgba(29,118,130,0.3)] hover:shadow-[0_0_28px_rgba(29,118,130,0.5)] hover:-translate-y-0.5"
          >
            <span>Next</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
          </Link>
        </footer>

      </div>
    </div>
  );
}
