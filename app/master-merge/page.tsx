'use client';

import PageLayout from "@/components/PageLayout";
import { useTheme } from '@/lib/theme-provider';

export default function MasterMergePage() {
  const { THEME } = useTheme();

  return (
    <PageLayout
      step={8}
      title="Master Merge"
      subtitle="Transition Method — Fastest Option (4–6 Weeks)"
      backHref="/no-to-low-aum"
      nextHref="/lpoa"
    >
      <div className="max-w-3xl">
        {/* At a glance */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Timeline", value: "4-6 Weeks" },
            { label: "Method", value: "Custodian-Level Merge" },
            { label: "Complexity", value: "High" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-lg p-5 text-center"
            >
              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: THEME.colors.textMuted }}>
                {stat.label}
              </p>
              <p className="text-xl font-bold font-sans" style={{ color: THEME.colors.text }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Coming Soon Banner */}
        <div className="glass-card-dark rounded-xl p-8 mb-8 text-center">
          <div className="text-5xl mb-4" style={{ color: THEME.colors.teal }}>&#9670;</div>
          <h2 className="text-2xl font-bold font-sans mb-3" style={{ color: THEME.colors.text }}>
            Detailed Content Coming Soon
          </h2>
          <p className="text-base leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
            The Master Merge section will provide a complete step-by-step guide to
            executing the fastest available transition method, including custodian
            requirements, eligibility criteria, and the full workflow.
          </p>
        </div>

        {/* Preview */}
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold font-sans mb-4" style={{ color: THEME.colors.text }}>
            What This Section Will Cover
          </h3>
          <ul className="space-y-3">
            {[
              "Eligibility criteria for Master Merge (custodian and account type requirements)",
              "Step-by-step custodian coordination process",
              "Account type considerations and exclusions",
              "Timeline milestones and dependency mapping",
              "Common failure points and how to resolve them",
              "Post-merge verification and reconciliation",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5" style={{ color: THEME.colors.teal }}>&#9656;</span>
                <span className="text-sm" style={{ color: THEME.colors.text }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageLayout>
  );
}
