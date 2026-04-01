'use client';

import PageLayout from '@/components/PageLayout';
export default function IntroductionPage() {

  return (
    <PageLayout
      step={1}
      title="Welcome to the AX Playbook"
      subtitle="Advisor Experience Onboarding & Transition Reference"
      nextHref="/onboarding-vs-transitions"
      nextLabel="Next: Onboarding vs. Transitions"
    >
      <div className="max-w-5xl mx-auto">
        {/* Overview */}
        <div
          className="rounded-xl p-8 mb-16"
          style={{
            backgroundColor: THEME.colors.surface,
            border: `1px solid ${THEME.colors.border}`,
          }}
        >
          <p className="text-base leading-relaxed" style={{ color: THEME.colors.text }}>
            This playbook is the definitive reference for Farther's Advisor Experience (AX) team. It
            guides <strong>AX Managers (AXMs)</strong> and{' '}
            <strong>AX Associates (AXAs)</strong> through every step of bringing a new advisor onto
            the Farther platform — from the moment a deal is signed through the advisor's graduation
            to full independence. Whether you're onboarding a breakaway advisor leaving a wirehouse,
            integrating an Independent RIA, or working through a complex M&A situation, this resource
            provides the frameworks, documents, timelines, and workflows you need.
          </p>
        </div>

        {/* Four Paths */}
        <div className="mb-16">
          <h2
            className="text-3xl font-bold mb-8 text-center"
            style={{ color: THEME.colors.text }}
          >
            The Four Advisor <span style={{ color: THEME.colors.gold }}>Onboarding Paths</span>
          </h2>
          <p className="text-center mb-12" style={{ color: THEME.colors.textSecondary }}>
            Every advisor follows one of four distinct paths based on their background and book of business.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Path 1: Breakaway */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className="text-5xl font-bold opacity-20"
                  style={{ color: THEME.colors.gold }}
                >
                  01
                </span>
                <span
                  className="text-xs uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: THEME.colors.gold,
                    color: '#FFFFFF',
                  }}
                >
                  High Compliance
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: THEME.colors.text }}>
                Breakaway
              </h3>
              <p className="text-xs uppercase tracking-wider mb-4" style={{ color: THEME.colors.textSecondary }}>
                Wirehouse / Captive Firm
              </p>
              <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                Advisor departing a wirehouse or captive firm. Highest compliance sensitivity —
                resignation must occur before certain steps can proceed, and the U4 is held until
                departure. Typical advisors leaving Merrill Lynch, Morgan Stanley, UBS, or Wells Fargo.
              </p>
            </div>

            {/* Path 2: Independent RIA */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className="text-5xl font-bold opacity-20"
                  style={{ color: THEME.colors.gold }}
                >
                  02
                </span>
                <span
                  className="text-xs uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: THEME.colors.teal,
                    color: '#FFFFFF',
                  }}
                >
                  Lower Legal Risk
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: THEME.colors.text }}>
                Independent RIA
              </h3>
              <p className="text-xs uppercase tracking-wider mb-4" style={{ color: THEME.colors.textSecondary }}>
                Existing RIA Owner
              </p>
              <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                Advisor who already owns their book of business and operates independently. Must file an
                ADV-W within 90 days of joining Farther. Considerations vary by dual vs. non-dual
                registration states.
              </p>
            </div>

            {/* Path 3: M&A */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className="text-5xl font-bold opacity-20"
                  style={{ color: THEME.colors.gold }}
                >
                  03
                </span>
                <span
                  className="text-xs uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: THEME.colors.steel,
                    color: '#FFFFFF',
                  }}
                >
                  Case-by-Case
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: THEME.colors.text }}>
                M&A
              </h3>
              <p className="text-xs uppercase tracking-wider mb-4" style={{ color: THEME.colors.textSecondary }}>
                Mergers & Acquisitions
              </p>
              <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                Advisor or practice joining Farther through an acquisition or merger transaction. Complex
                legal and operational considerations apply. Each situation is handled individually with
                dedicated support.
              </p>
            </div>

            {/* Path 4: No to Low AUM */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className="text-5xl font-bold opacity-20"
                  style={{ color: THEME.colors.gold }}
                >
                  04
                </span>
                <span
                  className="text-xs uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: THEME.colors.gold,
                    color: '#FFFFFF',
                  }}
                >
                  Training First
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: THEME.colors.text }}>
                No to Low AUM
              </h3>
              <p className="text-xs uppercase tracking-wider mb-4" style={{ color: THEME.colors.textSecondary }}>
                Below $15–20M AUM
              </p>
              <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                Advisors bringing less than $15–20M in assets under management. A training-first approach
                is taken before full onboarding begins. Requires a Focus Team assessment to evaluate fit
                and growth trajectory.
              </p>
            </div>
          </div>
        </div>

        {/* Three Methods */}
        <div className="mb-16">
          <h2
            className="text-3xl font-bold mb-8 text-center"
            style={{ color: THEME.colors.text }}
          >
            The Three <span style={{ color: THEME.colors.gold }}>Transition Methods</span>
          </h2>
          <p className="text-center mb-12" style={{ color: THEME.colors.textSecondary }}>
            After an advisor joins, client assets must transition to Farther's custodians via one of three methods.
          </p>

          <div className="space-y-6">
            {/* Method 1 */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
              }}
            >
              <div className="flex items-start gap-6">
                <span
                  className="text-xs uppercase tracking-wider px-4 py-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: THEME.colors.gold,
                    color: '#FFFFFF',
                  }}
                >
                  4–6 weeks
                </span>
                <div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: THEME.colors.text }}>
                    Master Merge
                  </h3>
                  <p className="text-xs uppercase tracking-wider mb-3" style={{ color: THEME.colors.textSecondary }}>
                    Fastest Method
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                    Assets are moved via a master account merge at the custodian level. Best suited for
                    advisors with large, uniform books of business. Requires close custodian coordination
                    and is the most efficient path when available.
                  </p>
                </div>
              </div>
            </div>

            {/* Method 2 */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
              }}
            >
              <div className="flex items-start gap-6">
                <span
                  className="text-xs uppercase tracking-wider px-4 py-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: THEME.colors.gold,
                    color: '#FFFFFF',
                  }}
                >
                  6–8 weeks
                </span>
                <div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: THEME.colors.text }}>
                    LPOA — Limited Power of Attorney
                  </h3>
                  <p className="text-xs uppercase tracking-wider mb-3" style={{ color: THEME.colors.textSecondary }}>
                    Mid-Range Timeline
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                    The advisor signs an LPOA document authorizing Farther to act on behalf of clients.
                    Available at Schwab, Fidelity IWS, and Pershing PAS. A balanced option when a Master
                    Merge is not available.
                  </p>
                </div>
              </div>
            </div>

            {/* Method 3 */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
              }}
            >
              <div className="flex items-start gap-6">
                <span
                  className="text-xs uppercase tracking-wider px-4 py-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: THEME.colors.gold,
                    color: '#FFFFFF',
                  }}
                >
                  8–12 weeks
                </span>
                <div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: THEME.colors.text }}>
                    Repaper / ACAT
                  </h3>
                  <p className="text-xs uppercase tracking-wider mb-3" style={{ color: THEME.colors.textSecondary }}>
                    Longest Method
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                    Clients must sign new account paperwork (repaper) and assets transfer via ACAT —
                    Automated Customer Account Transfer. Required when neither LPOA nor Master Merge is
                    available. The most client-touch-intensive path.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use */}
        <div
          className="rounded-xl p-8 mb-12"
          style={{
            backgroundColor: THEME.colors.surface,
            border: `1px solid ${THEME.colors.border}`,
          }}
        >
          <h2 className="text-2xl font-bold mb-4" style={{ color: THEME.colors.text }}>
            How to Use <span style={{ color: THEME.colors.gold }}>This Playbook</span>
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
            Use the navigation on the left to move through each section of this playbook. The step
            indicator in the top-right corner of every page shows your current position — for example,{' '}
            <span className="font-semibold">01 / 13</span>. Use the{' '}
            <span className="font-semibold">Next</span> and{' '}
            <span className="font-semibold">Back</span> buttons at the bottom of each page to move
            sequentially through the material, or jump directly to any section from the sidebar at any
            time.
          </p>
        </div>

      </div>
    </PageLayout>
  );
}
