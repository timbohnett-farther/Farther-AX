'use client';

import PageLayout from "@/components/PageLayout";
import QuizSection from "@/components/QuizSection";
import { useTheme } from '@/lib/theme-provider';

const keyCharacteristics = [
  {
    icon: "\u25C8",
    title: "Focus Team Check Required",
    body: "Before onboarding begins, the Focus Team reviews the advisor's profile to confirm Farther is the right fit and that the advisor has a credible path to growth.",
  },
  {
    icon: "\u25CE",
    title: "Training-First Approach",
    body: "Rather than leading with transitions, this pathway prioritizes getting the advisor proficient on the Farther platform first. Full transitions may be deferred until the advisor demonstrates platform mastery.",
  },
  {
    icon: "\u21CC",
    title: "Simplified Transition Process",
    body: "Given lower AUM, transitions are typically simpler. Repaper/ACAT is most common. LPOA may be used if custodian supports it.",
  },
  {
    icon: "\u25B8",
    title: "Growth Plan Required",
    body: "The AXM works with the advisor to establish a 90-day and 180-day growth plan with clear milestones for AUM growth, client acquisition, and platform utilization.",
  },
];

const trainingItems = [
  "Farther portal navigation and account management",
  "Model portfolio selection and implementation",
  "Client reporting and communication tools",
  "Compliance workflows and document submission",
  "Billing and fee management",
];

const focusTeamItems = [
  "Current AUM and trajectory",
  "Client demographics and retention history",
  "The advisor's prior firm performance record",
  "Strategic alignment with Farther's growth goals",
];

export default function NoToLowAUMPage() {
  const { THEME } = useTheme();

  return (
    <PageLayout
      step={7}
      title="No to Low AUM"
      subtitle="Advisor Pathway — Below $15-20M AUM"
      backHref="/ma"
      nextHref="/master-merge"
      backLabel="M&A"
      nextLabel="Master Merge"
    >
      <div className="max-w-4xl mx-auto">

        {/* Intro */}
        <p className="leading-relaxed text-base mb-12 max-w-3xl" style={{ color: THEME.colors.textSecondary }}>
          The No to Low AUM pathway applies to advisors bringing fewer than $15-20 million in assets
          under management to Farther. While Farther welcomes advisors at all stages, advisors below
          this threshold follow a modified, training-first onboarding approach before proceeding to
          full transitions.
        </p>

        {/* Section: When This Pathway Applies */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full" style={{ background: THEME.colors.teal }} />
            <h2 className="font-sans text-2xl font-bold" style={{ color: THEME.colors.text }}>
              When This Pathway Applies
            </h2>
          </div>

          {/* Informational callout */}
          <div
            className="rounded-xl px-7 py-6"
            style={{
              backgroundColor: `${THEME.colors.steel}26`,
              border: `1px solid ${THEME.colors.steel}4D`,
              borderLeft: `4px solid ${THEME.colors.steel}`,
              boxShadow: `0 0 12px ${THEME.colors.steel}26`
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="shrink-0 w-8 h-8 flex items-center justify-center text-sm font-bold mt-0.5 rounded-full"
                style={{
                  backgroundColor: THEME.colors.steel,
                  color: '#FFFFFF',
                  boxShadow: `0 0 10px ${THEME.colors.steel}66`
                }}
              >
                i
              </div>
              <p className="leading-relaxed text-sm" style={{ color: THEME.colors.textSecondary }}>
                This pathway is triggered when an advisor&apos;s projected AUM at launch is below $15-20M.
                The exact threshold is assessed case-by-case with input from the Focus Team, which
                evaluates the advisor&apos;s growth trajectory, client quality, and strategic fit.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Key Characteristics */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full" style={{ background: THEME.colors.teal }} />
            <h2 className="font-sans text-2xl font-bold" style={{ color: THEME.colors.text }}>
              Key Characteristics
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {keyCharacteristics.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl p-6 transition-all duration-200"
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `1px solid ${THEME.colors.border}`,
                  boxShadow: '0 0 0 transparent',
                  transform: 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 20px ${THEME.colors.teal}33`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{
                      backgroundColor: THEME.colors.teal,
                      color: '#FFFFFF',
                      boxShadow: `0 0 10px ${THEME.colors.teal}4D`
                    }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="font-sans text-lg leading-tight" style={{ color: THEME.colors.text }}>
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section: The Focus Team Review */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full" style={{ background: THEME.colors.teal }} />
            <h2 className="font-sans text-2xl font-bold" style={{ color: THEME.colors.text }}>
              The Focus Team Review
            </h2>
          </div>

          <div className="rounded-xl overflow-hidden border" style={{ borderColor: THEME.colors.border }}>
            <div className="px-7 py-5 border-b" style={{ background: THEME.colors.surface, borderColor: THEME.colors.border }}>
              <p className="text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                The Focus Team is an internal Farther committee that reviews borderline advisor
                candidates. Their assessment covers the following areas. The AXM must present the
                advisor&apos;s profile to the Focus Team before initiating any onboarding steps.
              </p>
            </div>
            <div className="px-7 py-6" style={{ background: THEME.colors.surfaceSubtle }}>
              <ul className="space-y-3">
                {focusTeamItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5" style={{ color: THEME.colors.teal }}>&#9670;</span>
                    <span className="text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Section: Training Curriculum Priority */}
        <section className="mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full" style={{ background: THEME.colors.teal }} />
            <h2 className="font-sans text-2xl font-bold" style={{ color: THEME.colors.text }}>
              Training Curriculum Priority
            </h2>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: THEME.colors.border }}>
            <div className="px-2 py-1 border-b" style={{ background: THEME.colors.surface, borderColor: THEME.colors.border }}>
              <span className="text-xs uppercase tracking-widest font-medium px-5 py-3 inline-block" style={{ color: THEME.colors.teal }}>
                Required Training Modules — In Order
              </span>
            </div>
            <div style={{ background: THEME.colors.surfaceSubtle }}>
              {trainingItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-5 px-6 py-4 border-b last:border-b-0"
                  style={{ borderColor: THEME.colors.border }}
                >
                  <span
                    className="shrink-0 w-7 h-7 flex items-center justify-center text-xs font-bold font-sans rounded-full"
                    style={{
                      backgroundColor: THEME.colors.surface,
                      color: THEME.colors.teal,
                      border: `1px solid ${THEME.colors.border}`,
                      boxShadow: `0 0 8px ${THEME.colors.teal}4D`
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <QuizSection topicSlug="no-to-low-aum" topicTitle="No to Low AUM" />
      </div>
    </PageLayout>
  );
}
