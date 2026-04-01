'use client';

import PageLayout from '@/components/PageLayout';

export default function MasterMergePage() {
  return (
    <PageLayout
      step={8}
      title="Master Merge"
      subtitle="Transition Method — Fastest Option (4–6 Weeks)"
      backHref="/no-to-low-aum"
      nextHref="/lpoa"
      nextLabel="Next: LPOA"
    >
      <div className="max-w-5xl mx-auto">

        {/* At a Glance Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            { label: 'Timeline', value: '4-6 Weeks' },
            { label: 'Method', value: 'Custodian-Level Merge' },
            { label: 'Complexity', value: 'High' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-6 text-center bg-[var(--color-surface)] border border-[var(--color-border)]"
            >
              <p className="text-xs uppercase tracking-wider mb-2 text-[var(--color-text-secondary)]">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-[var(--color-text)]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Coming Soon Banner */}
        <div className="rounded-xl p-12 mb-12 text-center bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="text-6xl mb-6 text-[#3B5A69]">
            ◆
          </div>
          <h2 className="text-3xl font-bold mb-4 font-serif text-[var(--color-text)]">
            Detailed Content Coming Soon
          </h2>
          <p className="text-base leading-relaxed max-w-2xl mx-auto text-[var(--color-text-secondary)]">
            The Master Merge section will provide a complete step-by-step guide to
            executing the fastest available transition method, including custodian
            requirements, eligibility criteria, and the full workflow.
          </p>
        </div>

        {/* Preview */}
        <div className="rounded-xl p-8 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h3 className="text-xl font-bold mb-6 font-serif text-[var(--color-text)]">
            What This Section Will Cover
          </h3>
          <ul className="space-y-3">
            {[
              'Eligibility criteria for Master Merge (custodian and account type requirements)',
              'Step-by-step custodian coordination process',
              'Account type considerations and exclusions',
              'Timeline milestones and dependency mapping',
              'Common failure points and how to resolve them',
              'Post-merge verification and reconciliation',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
                <span className="text-[#3B5A69]">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </PageLayout>
  );
}
