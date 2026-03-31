'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme-provider';

export default function NoToLowAUMPage() {
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
              Step 07 / 13
            </span>
          </div>
          <h1
            className="text-5xl font-bold mb-4"
            style={{ color: THEME.colors.text }}
          >
            No to Low AUM
          </h1>
          <p className="text-lg" style={{ color: THEME.colors.textSecondary }}>
            Advisor Pathway — Below $15–20M AUM
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
          The No to Low AUM pathway applies to advisors bringing fewer than $15-20 million in assets
          under management to Farther. While Farther welcomes advisors at all stages, advisors below
          this threshold follow a modified, <strong>training-first onboarding approach</strong> before proceeding to
          full transitions.
        </p>

        {/* When This Pathway Applies */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6" style={{ color: THEME.colors.text }}>
            When This Pathway Applies
          </h2>
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: THEME.colors.surface,
              border: `1px solid ${THEME.colors.teal}`,
              borderLeft: `4px solid ${THEME.colors.teal}`,
            }}
          >
            <div className="flex items-start gap-4">
              <span
                className="text-xl shrink-0"
                style={{ color: THEME.colors.teal }}
              >
                ℹ️
              </span>
              <p className="text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                This pathway is triggered when an advisor's projected AUM at launch is below $15-20M.
                The exact threshold is assessed case-by-case with input from the Focus Team, which
                evaluates the advisor's growth trajectory, client quality, and strategic fit.
              </p>
            </div>
          </div>
        </div>

        {/* Key Characteristics */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8" style={{ color: THEME.colors.text }}>
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
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `1px solid ${THEME.colors.border}`,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: THEME.colors.teal }}
                  />
                  <h3 className="text-lg font-bold" style={{ color: THEME.colors.text }}>
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Focus Team Review */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6" style={{ color: THEME.colors.text }}>
            The Focus Team Review
          </h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: THEME.colors.surface,
              border: `1px solid ${THEME.colors.border}`,
            }}
          >
            <div
              className="px-8 py-6"
              style={{ borderBottom: `1px solid ${THEME.colors.border}` }}
            >
              <p className="text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
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
                  <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                    <span style={{ color: THEME.colors.teal }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Training Curriculum */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6" style={{ color: THEME.colors.text }}>
            Training Curriculum Priority
          </h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: THEME.colors.surface,
              border: `1px solid ${THEME.colors.border}`,
            }}
          >
            <div
              className="px-8 py-4"
              style={{ borderBottom: `1px solid ${THEME.colors.border}` }}
            >
              <span
                className="text-xs uppercase tracking-wider font-semibold"
                style={{ color: THEME.colors.teal }}
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
                        backgroundColor: THEME.colors.teal,
                        color: '#FFFFFF',
                      }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/ma"
            className="px-6 py-3 rounded-lg text-sm font-semibold"
            style={{
              border: `1px solid ${THEME.colors.border}`,
              color: THEME.colors.text,
            }}
          >
            ← Back
          </Link>
          <Link
            href="/master-merge"
            className="px-8 py-4 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: THEME.colors.gold,
              color: '#FFFFFF',
            }}
          >
            Next: Master Merge →
          </Link>
        </div>
      </div>
    </div>
  );
}
