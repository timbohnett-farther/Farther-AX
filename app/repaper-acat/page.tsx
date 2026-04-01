'use client';

import PageLayout from '@/components/PageLayout';

export default function RepaperAcatPage() {
  return (
    <PageLayout
      step={10}
      title="Repaper / ACAT"
      subtitle="Transition Method — Full Re-Documentation (8–12 Weeks)"
      backHref="/lpoa"
      nextHref="/breakaway-process"
      nextLabel="Next: Breakaway Process"
    >
      <div className="max-w-5xl mx-auto">

        {/* At a Glance Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            { label: 'Timeline', value: '8–12 Weeks' },
            { label: 'Client Action', value: 'Required' },
            { label: 'Use Case', value: 'Universal' },
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
            The Repaper / ACAT section will provide complete guidance for executing
            the most comprehensive transition method — including client paperwork
            workflows, ACAT submission procedures, and timeline management.
          </p>
        </div>

        {/* Preview */}
        <div className="rounded-xl p-8 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h3 className="text-xl font-bold mb-6 font-serif text-[var(--color-text)]">
            What This Section Will Cover
          </h3>
          <ul className="space-y-3">
            {[
              'New account opening and client re-papering requirements',
              'ACAT submission process and DTCC requirements',
              'Managing client communication throughout the 8–12 week window',
              'Handling ACAT rejections and re-submissions',
              'Account type specific considerations (IRAs, trusts, entities)',
              'Coordinating with custodians on transfer scheduling',
              'Post-transfer reconciliation and account verification',
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
