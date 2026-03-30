'use client';

import Link from "next/link";
import QuizSection from "@/components/QuizSection";
import { useTheme } from '@/lib/theme-provider';

export default function IntroductionPage() {
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
          01 / 13
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-20 lg:py-28">

        {/* Page Header */}
        <header className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1" style={{ backgroundColor: THEME.colors.gold, opacity: 0.3 }} />
            <span className="font-sans text-xs tracking-[0.25em] uppercase" style={{ color: THEME.colors.gold }}>
              Farther Advisor Experience
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: THEME.colors.gold, opacity: 0.3 }} />
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl leading-tight mb-5 tracking-tight text-center" style={{ color: THEME.colors.text }}>
            Welcome to the <span style={{ color: THEME.colors.gold }}>AX Playbook</span>
          </h1>
          <p className="font-sans text-base tracking-wide text-center" style={{ color: THEME.colors.textSecondary }}>
            Advisor Experience Onboarding &amp; Transition Reference
          </p>
        </header>

        {/* Overview */}
        <section className="mb-20">
          <div className="rounded-2xl px-10 py-10" style={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}` }}>
            <p className="font-sans text-base leading-8" style={{ color: THEME.colors.text }}>
              This playbook is the definitive reference for Farther&rsquo;s Advisor Experience (AX) team. It
              guides <strong className="font-semibold">AX Managers (AXMs)</strong> and{" "}
              <strong className="font-semibold">AX Associates (AXAs)</strong> through every step of
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
            <h2 className="font-serif text-3xl mb-2" style={{ color: THEME.colors.text }}>
              The Four Advisor{" "}
              <span style={{ color: THEME.colors.gold }}>Onboarding Paths</span>
            </h2>
            <p className="font-sans text-sm" style={{ color: THEME.colors.textSecondary }}>
              Every advisor follows one of four distinct paths based on their background and book of business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Card 1: Breakaway */}
            <div
              className="rounded-2xl p-8 group transition-all duration-300"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
                boxShadow: '0 0 0 rgba(29,118,130,0)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 24px rgba(29,118,130,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 rgba(29,118,130,0)'}
            >
              <div className="flex items-start justify-between mb-6">
                <span className="font-serif text-5xl leading-none select-none" style={{ color: THEME.colors.gold, opacity: 0.25 }}>01</span>
                <span
                  className="font-sans text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(182, 138, 76, 0.1)',
                    color: THEME.colors.gold,
                    border: `1px solid rgba(182, 138, 76, 0.2)`
                  }}
                >
                  High Compliance
                </span>
              </div>
              <h3 className="font-serif text-xl mb-2" style={{ color: THEME.colors.text }}>Breakaway</h3>
              <p className="font-sans text-xs uppercase tracking-widest mb-4" style={{ color: THEME.colors.textSecondary }}>
                Wirehouse / Captive Firm
              </p>
              <p className="font-sans text-sm leading-7" style={{ color: THEME.colors.text }}>
                Advisor departing a wirehouse or captive firm. Highest compliance sensitivity — resignation must
                occur before certain steps can proceed, and the U4 is held until departure. Typical advisors
                leaving Merrill Lynch, Morgan Stanley, UBS, or Wells Fargo.
              </p>
            </div>

            {/* Card 2: Independent RIA */}
            <div
              className="rounded-2xl p-8 group transition-all duration-300"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
                boxShadow: '0 0 0 rgba(16,185,129,0)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 24px rgba(16,185,129,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 rgba(16,185,129,0)'}
            >
              <div className="flex items-start justify-between mb-6">
                <span className="font-serif text-5xl leading-none select-none" style={{ color: THEME.colors.gold, opacity: 0.25 }}>02</span>
                <span
                  className="font-sans text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  Lower Legal Risk
                </span>
              </div>
              <h3 className="font-serif text-xl mb-2" style={{ color: THEME.colors.text }}>Independent RIA</h3>
              <p className="font-sans text-xs uppercase tracking-widest mb-4" style={{ color: THEME.colors.textSecondary }}>
                Existing RIA Owner
              </p>
              <p className="font-sans text-sm leading-7" style={{ color: THEME.colors.text }}>
                Advisor who already owns their book of business and operates independently. Must file an ADV-W
                within 90 days of joining Farther. Considerations vary by dual vs. non-dual registration states.
              </p>
            </div>

            {/* Card 3: M&A */}
            <div
              className="rounded-2xl p-8 group transition-all duration-300"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
                boxShadow: '0 0 0 rgba(59,130,246,0)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 24px rgba(59,130,246,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 rgba(59,130,246,0)'}
            >
              <div className="flex items-start justify-between mb-6">
                <span className="font-serif text-5xl leading-none select-none" style={{ color: THEME.colors.gold, opacity: 0.25 }}>03</span>
                <span
                  className="font-sans text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: '#3B82F6',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}
                >
                  Case-by-Case
                </span>
              </div>
              <h3 className="font-serif text-xl mb-2" style={{ color: THEME.colors.text }}>M&amp;A</h3>
              <p className="font-sans text-xs uppercase tracking-widest mb-4" style={{ color: THEME.colors.textSecondary }}>
                Mergers &amp; Acquisitions
              </p>
              <p className="font-sans text-sm leading-7" style={{ color: THEME.colors.text }}>
                Advisor or practice joining Farther through an acquisition or merger transaction. Complex legal and
                operational considerations apply. Each situation is handled individually with dedicated support.
              </p>
            </div>

            {/* Card 4: No to Low AUM */}
            <div
              className="rounded-2xl p-8 group transition-all duration-300"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
                boxShadow: '0 0 0 rgba(245,158,11,0)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 24px rgba(245,158,11,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 rgba(245,158,11,0)'}
            >
              <div className="flex items-start justify-between mb-6">
                <span className="font-serif text-5xl leading-none select-none" style={{ color: THEME.colors.gold, opacity: 0.25 }}>04</span>
                <span
                  className="font-sans text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    color: '#F59E0B',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}
                >
                  Training First
                </span>
              </div>
              <h3 className="font-serif text-xl mb-2" style={{ color: THEME.colors.text }}>No to Low AUM</h3>
              <p className="font-sans text-xs uppercase tracking-widest mb-4" style={{ color: THEME.colors.textSecondary }}>
                Below $15–20M AUM
              </p>
              <p className="font-sans text-sm leading-7" style={{ color: THEME.colors.text }}>
                Advisors bringing less than $15–20M in assets under management. A training-first approach is taken
                before full onboarding begins. Requires a Focus Team assessment to evaluate fit and growth trajectory.
              </p>
            </div>

          </div>
        </section>

        {/* The Three Transition Methods */}
        <section className="mb-20">
          <div className="mb-10">
            <h2 className="font-serif text-3xl mb-2" style={{ color: THEME.colors.text }}>
              The Three{" "}
              <span style={{ color: THEME.colors.gold }}>Transition Methods</span>
            </h2>
            <p className="font-sans text-sm" style={{ color: THEME.colors.textSecondary }}>
              After an advisor joins, client assets must transition to Farther&rsquo;s custodians via one of three methods.
            </p>
          </div>

          <div className="flex flex-col gap-5">

            {/* Method 1: Master Merge */}
            <div className="rounded-2xl px-8 py-7" style={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}` }}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="shrink-0">
                  <span
                    className="inline-block font-sans text-[10px] tracking-[0.2em] uppercase px-4 py-2 rounded-full whitespace-nowrap"
                    style={{
                      backgroundColor: 'rgba(182, 138, 76, 0.1)',
                      color: THEME.colors.gold,
                      border: `1px solid rgba(182, 138, 76, 0.2)`
                    }}
                  >
                    4–6 weeks
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: THEME.colors.gold }} />
                    <h3 className="font-serif text-lg" style={{ color: THEME.colors.text }}>Master Merge</h3>
                  </div>
                  <p className="font-sans text-xs uppercase tracking-widest mb-3 pl-5" style={{ color: THEME.colors.textSecondary }}>
                    Fastest Method
                  </p>
                  <p className="font-sans text-sm leading-7 pl-5" style={{ color: THEME.colors.text }}>
                    Assets are moved via a master account merge at the custodian level. Best suited for advisors
                    with large, uniform books of business. Requires close custodian coordination and is the most
                    efficient path when available.
                  </p>
                </div>
              </div>
            </div>

            {/* Method 2: LPOA */}
            <div className="rounded-2xl px-8 py-7" style={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}` }}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="shrink-0">
                  <span
                    className="inline-block font-sans text-[10px] tracking-[0.2em] uppercase px-4 py-2 rounded-full whitespace-nowrap"
                    style={{
                      backgroundColor: 'rgba(182, 138, 76, 0.1)',
                      color: THEME.colors.gold,
                      border: `1px solid rgba(182, 138, 76, 0.2)`
                    }}
                  >
                    6–8 weeks
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: THEME.colors.gold }} />
                    <h3 className="font-serif text-lg" style={{ color: THEME.colors.text }}>LPOA — Limited Power of Attorney</h3>
                  </div>
                  <p className="font-sans text-xs uppercase tracking-widest mb-3 pl-5" style={{ color: THEME.colors.textSecondary }}>
                    Mid-Range Timeline
                  </p>
                  <p className="font-sans text-sm leading-7 pl-5" style={{ color: THEME.colors.text }}>
                    The advisor signs an LPOA document authorizing Farther to act on behalf of clients. Available
                    at Schwab, Fidelity IWS, and Pershing PAS. A balanced option when a Master Merge is not
                    available.
                  </p>
                </div>
              </div>
            </div>

            {/* Method 3: Repaper / ACAT */}
            <div className="rounded-2xl px-8 py-7" style={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}` }}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="shrink-0">
                  <span
                    className="inline-block font-sans text-[10px] tracking-[0.2em] uppercase px-4 py-2 rounded-full whitespace-nowrap"
                    style={{
                      backgroundColor: 'rgba(182, 138, 76, 0.1)',
                      color: THEME.colors.gold,
                      border: `1px solid rgba(182, 138, 76, 0.2)`
                    }}
                  >
                    8–12 weeks
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: THEME.colors.gold }} />
                    <h3 className="font-serif text-lg" style={{ color: THEME.colors.text }}>Repaper / ACAT</h3>
                  </div>
                  <p className="font-sans text-xs uppercase tracking-widest mb-3 pl-5" style={{ color: THEME.colors.textSecondary }}>
                    Longest Method
                  </p>
                  <p className="font-sans text-sm leading-7 pl-5" style={{ color: THEME.colors.text }}>
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
            <h2 className="font-serif text-3xl mb-2" style={{ color: THEME.colors.text }}>
              How to Use{" "}
              <span style={{ color: THEME.colors.gold }}>This Playbook</span>
            </h2>
          </div>

          <div className="rounded-2xl px-10 py-9" style={{ backgroundColor: THEME.colors.surface, border: `1px solid ${THEME.colors.border}` }}>
            <p className="font-sans text-sm leading-8" style={{ color: THEME.colors.text }}>
              Use the navigation on the left to move through each section of this playbook. The step indicator
              in the top-right corner of every page shows your current position — for example,{" "}
              <span className="font-semibold">01 / 13</span>. Use the{" "}
              <span className="font-semibold">Next</span> and{" "}
              <span className="font-semibold">Back</span> buttons at the bottom of each page to
              move sequentially through the material, or jump directly to any section from the sidebar at any
              time.
            </p>
          </div>
        </section>

        {/* Bottom Navigation */}
        <footer className="flex items-center justify-between border-t pt-10" style={{ borderColor: THEME.colors.border }}>
          <span className="font-sans text-xs tracking-[0.2em] uppercase" style={{ color: THEME.colors.textSecondary }}>
            Introduction
          </span>
          <Link
            href="/onboarding-vs-transitions"
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

        <QuizSection topicSlug="introduction" topicTitle="Introduction" />

      </div>
    </div>
  );
}
