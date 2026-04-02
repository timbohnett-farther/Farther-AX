'use client';

import PageLayout from '@/components/PageLayout';
import { THEME } from '@/lib/theme';

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
        <div className="grid md:grid-cols-3 gap-4 mb-16">
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

        {/* Overview */}
        <div className="rounded-xl p-8 mb-16 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-2xl font-bold mb-4 font-serif text-[var(--color-text)]">
            What is a <span style={{ color: THEME.colors.gold }}>Master Merge?</span>
          </h2>
          <p className="text-base leading-relaxed text-[var(--color-text)] mb-4">
            A <strong>Master Merge</strong> is the fastest available transition method for moving
            advisor assets to Farther. Instead of transferring accounts individually, assets are
            moved in bulk via a master account merge at the custodian level. This approach requires
            close coordination with the custodian and is best suited for advisors with large,
            uniform books of business on a single platform.
          </p>
          <p className="text-base leading-relaxed text-[var(--color-text)]">
            When executed successfully, Master Merge significantly reduces client friction and
            accelerates the transition timeline to <strong>4–6 weeks</strong> from start to finish.
            However, it is not available for all custodians and requires specific eligibility criteria.
          </p>
        </div>

        {/* When to Use */}
        <div className="rounded-xl p-8 mb-16 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-2xl font-bold mb-6 font-serif text-[var(--color-text)]">
            When to Use <span style={{ color: THEME.colors.gold }}>Master Merge</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-3 text-[var(--color-text)]">✓ Ideal For</h3>
              <ul className="space-y-2">
                {[
                  'Large books of business ($50M+ AUM)',
                  'Advisors on a single custodian platform',
                  'Uniform account types (mostly brokerage)',
                  'Advisors with custodian relationships',
                  'Time-sensitive transitions',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                    <span style={{ color: THEME.colors.teal }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-3 text-[var(--color-text)]">✗ Not Suitable For</h3>
              <ul className="space-y-2">
                {[
                  'Multiple custodian platforms',
                  'Complex trust and estate accounts',
                  'Mixed registration types (individual, joint, entity)',
                  'Advisors with limited custodian access',
                  'Books under $20M AUM',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                    <span style={{ color: THEME.colors.steel }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Eligibility & Requirements */}
        <div className="rounded-xl p-8 mb-16 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-2xl font-bold mb-6 font-serif text-[var(--color-text)]">
            Eligibility & <span style={{ color: THEME.colors.gold }}>Requirements</span>
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                1. Custodian Support
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Master Merge is only available at specific custodians with institutional merge capabilities. Schwab and Fidelity offer the most reliable Master Merge workflows. Pershing and other custodians may require alternative methods.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                2. Account Uniformity
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                The majority of accounts must be standard brokerage accounts. IRAs, trusts, and entity accounts may be excluded from the merge and require separate handling via LPOA or Repaper.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                3. Advisor Relationship
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                The departing advisor must have full access to the custodian platform and be willing to coordinate directly with custodian operations teams during the merge process.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                4. Clean Book
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Accounts must be in good standing with no pending legal holds, margin calls, or compliance restrictions. Any flagged accounts will be excluded from the merge.
              </p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Process */}
        <div className="rounded-xl p-8 mb-16 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-2xl font-bold mb-6 font-serif text-[var(--color-text)]">
            Step-by-Step <span style={{ color: THEME.colors.gold }}>Process</span>
          </h2>
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                  style={{
                    backgroundColor: THEME.colors.teal + '26',
                    border: `1px solid ${THEME.colors.teal}4D`,
                    color: THEME.colors.teal,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  01
                </span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text)]">Week 1</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Discovery & Scoping</p>
                </div>
              </div>
              <ul className="ml-14 space-y-2">
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>AXM and advisor conduct initial book review</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Identify eligible accounts for Master Merge</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Flag accounts requiring alternative transition methods</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Open Farther custodian accounts under new RIA</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Submit custodian relationship forms</span>
                </li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                  style={{
                    backgroundColor: THEME.colors.teal + '26',
                    border: `1px solid ${THEME.colors.teal}4D`,
                    color: THEME.colors.teal,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  02
                </span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text)]">Week 2</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Custodian Coordination</p>
                </div>
              </div>
              <ul className="ml-14 space-y-2">
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>AXM initiates contact with custodian operations</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Submit Master Merge request with account list</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Custodian reviews eligibility and confirms merge path</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Custodian provides merge timeline and requirements</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Advisor completes any custodian-specific forms</span>
                </li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                  style={{
                    backgroundColor: THEME.colors.teal + '26',
                    border: `1px solid ${THEME.colors.teal}4D`,
                    color: THEME.colors.teal,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  03
                </span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text)]">Week 3–4</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Merge Execution</p>
                </div>
              </div>
              <ul className="ml-14 space-y-2">
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Custodian executes master account merge</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Assets move from old rep code to Farther rep code</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Accounts maintain existing positions and registration</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>AXM monitors merge progress daily via custodian portal</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Address any accounts flagged or excluded by custodian</span>
                </li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                  style={{
                    backgroundColor: THEME.colors.teal + '26',
                    border: `1px solid ${THEME.colors.teal}4D`,
                    color: THEME.colors.teal,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  04
                </span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text)]">Week 5–6</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Post-Merge Verification</p>
                </div>
              </div>
              <ul className="ml-14 space-y-2">
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>AXM reconciles all merged accounts against original list</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Verify account values match pre-merge balances</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Confirm all positions transferred correctly</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Resolve any discrepancies with custodian</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Graduate advisor to full production status</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="rounded-xl p-8 mb-16 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-2xl font-bold mb-6 font-serif text-[var(--color-text)]">
            Common <span style={{ color: THEME.colors.gold }}>Issues</span> & Resolutions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                ⚠️ Custodian Rejects Master Merge Request
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                <strong>Resolution:</strong> If the custodian determines the book is ineligible for Master Merge, pivot to LPOA as the next fastest option. AXM should request a detailed rejection reason to inform the alternative approach.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                ⚠️ Accounts Excluded from Merge
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                <strong>Resolution:</strong> Certain account types (trusts, entities, IRAs with specific features) may be excluded. These accounts must transition separately via LPOA or Repaper. AXM should identify excluded accounts early and set client expectations.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                ⚠️ Merge Timeline Extends Beyond 6 Weeks
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                <strong>Resolution:</strong> Custodian delays are common. AXM should maintain daily contact with custodian operations and escalate through the advisor&apos;s custodian relationship manager if necessary. Keep advisor and clients informed of delays.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                ⚠️ Post-Merge Position Discrepancies
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                <strong>Resolution:</strong> If account values or positions do not match pre-merge balances, immediately open a ticket with custodian operations. Do not allow advisor to trade on discrepant accounts until fully reconciled.
              </p>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="rounded-xl p-8 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-2xl font-bold mb-6 font-serif text-[var(--color-text)]">
            Best <span style={{ color: THEME.colors.gold }}>Practices</span>
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
              <span style={{ color: THEME.colors.teal }}>✓</span>
              <span>Conduct a thorough book review before initiating Master Merge to identify potential blockers</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
              <span style={{ color: THEME.colors.teal }}>✓</span>
              <span>Establish daily communication with custodian operations during the merge window</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
              <span style={{ color: THEME.colors.teal }}>✓</span>
              <span>Set clear client expectations: Master Merge is fast but requires custodian cooperation</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
              <span style={{ color: THEME.colors.teal }}>✓</span>
              <span>Have a backup plan (LPOA or Repaper) ready if Master Merge is rejected or delayed</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
              <span style={{ color: THEME.colors.teal }}>✓</span>
              <span>Complete post-merge reconciliation before allowing advisor to trade on merged accounts</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
              <span style={{ color: THEME.colors.teal }}>✓</span>
              <span>Document all custodian communications and decisions for compliance records</span>
            </li>
          </ul>
        </div>

      </div>
    </PageLayout>
  );
}
