'use client';

import PageLayout from '@/components/PageLayout';
export default function NoToLowAUMPage() {

  return (
    <PageLayout
      step={7}
      title="No to Low AUM"
      subtitle="Advisor Pathway — Below $15–20M AUM"
      backHref="/ma"
      nextHref="/master-merge"
      nextLabel="Next: Master Merge"
    >
      <div className="max-w-5xl mx-auto">

        {/* Intro */}
        <p
          className="text-base leading-relaxed mb-12"
        >
          The No to Low AUM pathway applies to advisors bringing fewer than $15-20 million in assets
          under management to Farther. While Farther welcomes advisors at all stages, advisors below
          this threshold follow a modified, <strong>training-first onboarding approach</strong> before proceeding to
          full transitions.
        </p>

        {/* When This Pathway Applies */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-[var(--color-text)]">
            When This Pathway Applies
          </h2>
          <div
            className="rounded-xl p-6"
            style={{
              border: `1px solid ${'#3B5A69'}`,
              borderLeft: `4px solid ${'#3B5A69'}`,
            }}
          >
            <div className="flex items-start gap-4">
              <span
                className="text-xl shrink-0 text-[#3B5A69]"
              >
                ℹ️
              </span>
              <p className="text-sm leading-relaxed text-[var(--color-text)]">
                This pathway is triggered when an advisor's projected AUM at launch is below $15-20M.
                The exact threshold is assessed case-by-case with input from the Focus Team, which
                evaluates the advisor's growth trajectory, client quality, and strategic fit.
              </p>
            </div>
          </div>
        </div>

        {/* Key Characteristics */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-[var(--color-text)]">
            Key Characteristics
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Focus Team Check Required',
                body: 'Before onboarding begins, the Focus Team reviews the advisor\'s profile to confirm Farther is the right fit and that the advisor has a credible path to growth.',
              },
              {
                title: 'Training-First Approach',
                body: 'Rather than leading with transitions, this pathway prioritizes getting the advisor proficient on the Farther platform first. Full transitions may be deferred until the advisor demonstrates platform mastery.',
              },
              {
                title: 'Simplified Transition Process',
                body: 'Given lower AUM, transitions are typically simpler. Repaper/ACAT is most common. LPOA may be used if custodian supports it.',
              },
              {
                title: 'Growth Plan Required',
                body: 'The AXM works with the advisor to establish a 90-day and 180-day growth plan with clear milestones for AUM growth, client acquisition, and platform utilization.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: '#3B5A69' }}
                  />
                  <h3 className="text-lg font-bold text-[var(--color-text)]">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Focus Team Review */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-[var(--color-text)]">
            The Focus Team Review
          </h2>
          <div
            className="rounded-xl overflow-hidden"
          >
            <div
              className="px-8 py-6"
              style={{ borderBottom: `1px solid ${'var(--color-border)'}` }}
            >
              <p className="text-sm leading-relaxed text-[var(--color-text)]">
                The Focus Team is an internal Farther committee that reviews borderline advisor
                candidates. Their assessment covers the following areas. The AXM must present the
                advisor's profile to the Focus Team before initiating any onboarding steps.
              </p>
            </div>
            <div className="px-8 py-6">
              <ul className="space-y-3">
                {[
                  'Current AUM and trajectory',
                  'Client demographics and retention history',
                  'The advisor\'s prior firm performance record',
                  'Strategic alignment with Farther\'s growth goals',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
                    <span className="text-[#3B5A69]">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Training Curriculum */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-[var(--color-text)]">
            Training Curriculum Priority
          </h2>
          <div
            className="rounded-xl overflow-hidden"
          >
            <div
              className="px-8 py-4"
              style={{ borderBottom: `1px solid ${'var(--color-border)'}` }}
            >
              <span
                className="text-xs uppercase tracking-wider font-semibold text-[#3B5A69]"
              >
                Required Training Modules — In Order
              </span>
            </div>
            <div className="px-8 py-6">
              <div className="space-y-4">
                {[
                  'Farther portal navigation and account management',
                  'Model portfolio selection and implementation',
                  'Client reporting and communication tools',
                  'Compliance workflows and document submission',
                  'Billing and fee management',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: '#3B5A69',
                        color: '#FFFFFF',
                      }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm leading-relaxed text-[var(--color-text)]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
