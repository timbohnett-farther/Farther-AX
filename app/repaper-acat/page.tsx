'use client';

import PageLayout from '@/components/PageLayout';
import { THEME } from '@/lib/theme';

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
        <div className="grid md:grid-cols-3 gap-4 mb-16">
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

        {/* Overview */}
        <div className="rounded-xl p-8 mb-16 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-2xl font-bold mb-4 font-serif text-[var(--color-text)]">
            What is <span style={{ color: THEME.colors.gold }}>Repaper / ACAT?</span>
          </h2>
          <p className="text-base leading-relaxed text-[var(--color-text)] mb-4">
            <strong>Repaper / ACAT</strong> is the most comprehensive — and most client-touch-intensive —
            transition method. It is required when neither Master Merge nor LPOA is available. In this
            method, clients must sign new account opening documents (repaper), and assets transfer via
            <strong> ACAT</strong> (Automated Customer Account Transfer) through the DTCC clearing system.
          </p>
          <p className="text-base leading-relaxed text-[var(--color-text)]">
            While this method takes <strong>8–12 weeks</strong> from start to finish, it is universally
            applicable across all custodians and account types. It is the fallback option when faster
            methods are not feasible, and it ensures a compliant, fully documented transition.
          </p>
        </div>

        {/* When to Use */}
        <div className="rounded-xl p-8 mb-16 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-2xl font-bold mb-6 font-serif text-[var(--color-text)]">
            When to Use <span style={{ color: THEME.colors.gold }}>Repaper / ACAT</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-3 text-[var(--color-text)]">✓ Required When</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Master Merge is unavailable</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>LPOA is not supported by custodian</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Advisor has limited custodian access</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Clients are transitioning from multiple custodians</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Complex account registrations (trusts, entities)</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Compliance or regulatory requirements mandate full re-documentation</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-3 text-[var(--color-text)]">✗ Avoid If Possible</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.steel }}>•</span>
                  <span>Master Merge is available (use that instead)</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.steel }}>•</span>
                  <span>LPOA is supported (faster alternative)</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.steel }}>•</span>
                  <span>Client engagement is low (hard to get signatures)</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.steel }}>•</span>
                  <span>Time-sensitive transition (too slow)</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.steel }}>•</span>
                  <span>Advisor has minimal client contact (high friction)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="rounded-xl p-8 mb-16 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-2xl font-bold mb-6 font-serif text-[var(--color-text)]">
            Requirements & <span style={{ color: THEME.colors.gold }}>Preparation</span>
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                1. New Account Opening Paperwork
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Each client must sign Farther account opening documents. This includes account applications, advisory agreements, custodian agreements, and regulatory disclosures (Form ADV Part 2A/2B, privacy policy, etc.).
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                2. DTCC ACAT Eligibility
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                All accounts must be at ACAT-eligible custodians (Schwab, Fidelity, Pershing, TD Ameritrade, etc.). Non-ACAT custodians require manual asset transfers, adding weeks to the timeline.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                3. Client Communication Plan
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Advisor must proactively communicate the Repaper/ACAT process to clients. Set expectations: clients will receive paperwork, must sign within 7–10 days, and transfers may take 6–8 weeks after submission.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                4. Account Registration Verification
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                New account registrations must match existing accounts exactly. Any discrepancies (name spelling, SSN, entity structure) will cause ACAT rejections and delays.
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
                  <p className="text-sm font-bold text-[var(--color-text)]">Week 1–2</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Paperwork Preparation & Outreach</p>
                </div>
              </div>
              <ul className="ml-14 space-y-2">
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>AXM generates account opening documents for all clients</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Advisor sends &quot;Welcome to Farther&quot; email with paperwork links</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Clients receive DocuSign envelopes with full document packets</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>AXM monitors signature completion rates daily</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Follow up with clients who have not signed within 5 days</span>
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
                  <p className="text-sm font-bold text-[var(--color-text)]">Week 3–4</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Account Opening & ACAT Submission</p>
                </div>
              </div>
              <ul className="ml-14 space-y-2">
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Farther Ops opens new custodian accounts as paperwork is completed</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>AXM submits ACAT requests to receiving custodian (Schwab/Fidelity/Pershing)</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>ACAT requests include account numbers, full names, SSNs, and account types</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>DTCC processes ACAT submissions and notifies delivering custodian</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Delivering custodian validates account information and approves/rejects transfers</span>
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
                  <p className="text-sm font-bold text-[var(--color-text)]">Week 5–8</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">ACAT Processing & Rejections</p>
                </div>
              </div>
              <ul className="ml-14 space-y-2">
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Monitor ACAT status daily via custodian portals</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Address ACAT rejections immediately (name mismatches, account restrictions, margin balances, etc.)</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Resubmit corrected ACAT requests within 24–48 hours</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Keep clients informed of transfer progress and delays</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Coordinate with delivering custodian to resolve account restrictions</span>
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
                  <p className="text-sm font-bold text-[var(--color-text)]">Week 9–12</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Transfer Completion & Verification</p>
                </div>
              </div>
              <ul className="ml-14 space-y-2">
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Assets begin transferring as ACAT approvals are finalized</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>AXM reconciles transferred positions against original account statements</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Verify cash balances, securities, and accrued interest match</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Resolve any transfer discrepancies with delivering custodian</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Close out old accounts at delivering custodian (if applicable)</span>
                </li>
                <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]">
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>Advisor begins managing assets on Farther platform</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Common ACAT Rejections */}
        <div className="rounded-xl p-8 mb-16 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-2xl font-bold mb-6 font-serif text-[var(--color-text)]">
            Common <span style={{ color: THEME.colors.gold }}>ACAT Rejections</span> & Solutions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                ⚠️ Name Mismatch
              </h3>
              <p className="text-sm leading-relaxed mb-1 text-[var(--color-text-secondary)]">
                <strong>Cause:</strong> Client name on new account does not match old account exactly
              </p>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                <strong>Solution:</strong> Verify name spelling, middle initials, suffixes (Jr., Sr., III) match exactly. Resubmit with corrected registration.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                ⚠️ Account Not Found
              </h3>
              <p className="text-sm leading-relaxed mb-1 text-[var(--color-text-secondary)]">
                <strong>Cause:</strong> Account number or SSN/TIN is incorrect
              </p>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                <strong>Solution:</strong> Double-check account number and SSN/TIN against client statements. Correct and resubmit.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                ⚠️ Account Has Margin Balance
              </h3>
              <p className="text-sm leading-relaxed mb-1 text-[var(--color-text-secondary)]">
                <strong>Cause:</strong> Delivering account has open margin debt or short positions
              </p>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                <strong>Solution:</strong> Instruct client to pay down margin or liquidate short positions before transfer. Resubmit ACAT after balance is cleared.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                ⚠️ Partial Transfer Not Allowed
              </h3>
              <p className="text-sm leading-relaxed mb-1 text-[var(--color-text-secondary)]">
                <strong>Cause:</strong> Delivering firm requires full account transfer, not partial
              </p>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                <strong>Solution:</strong> Change ACAT request from partial to full transfer, or work with delivering firm to allow partial (rare).
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                ⚠️ Account Under Legal Hold
              </h3>
              <p className="text-sm leading-relaxed mb-1 text-[var(--color-text-secondary)]">
                <strong>Cause:</strong> Account flagged for legal, compliance, or regulatory restriction
              </p>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                <strong>Solution:</strong> Escalate to compliance. May require legal intervention. Cannot proceed until hold is lifted.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                ⚠️ Non-ACAT Eligible Security
              </h3>
              <p className="text-sm leading-relaxed mb-1 text-[var(--color-text-secondary)]">
                <strong>Cause:</strong> Account holds non-transferrable assets (private placements, restricted stock)
              </p>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                <strong>Solution:</strong> Transfer eligible securities via ACAT. Handle non-eligible assets separately (liquidate or manual transfer).
              </p>
            </div>
          </div>
        </div>

        {/* Client Communication Templates */}
        <div className="rounded-xl p-8 mb-16 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-2xl font-bold mb-6 font-serif text-[var(--color-text)]">
            Client <span style={{ color: THEME.colors.gold }}>Communication</span> Strategy
          </h2>
          <p className="text-sm leading-relaxed mb-6 text-[var(--color-text-secondary)]">
            Repaper/ACAT requires the most client engagement of all transition methods. Proactive,
            clear communication is critical to maintaining client confidence and avoiding delays.
          </p>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                Week 1: Initial Outreach
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Send &quot;Welcome to Farther&quot; email explaining the transition process, timeline, and next steps. Include links to paperwork and set expectation for 8–12 week timeline.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                Week 2–3: Signature Follow-Up
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Follow up with clients who have not signed paperwork within 5 days. Emphasize that signatures are required to proceed. Offer to answer questions or schedule calls.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                Week 4–6: ACAT Submission Notification
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Notify clients that ACAT transfers have been submitted. Explain that they may receive notifications from both old and new custodians. Reassure that this is normal.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                Week 7–10: Transfer in Progress Updates
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Provide weekly status updates on transfer progress. If delays occur, explain the reason (rejection, custodian backlog) and revised timeline.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2 text-[var(--color-text)]">
                Week 11–12: Transfer Complete
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Confirm that all assets have transferred successfully. Invite clients to log in to new Farther platform and schedule onboarding call to review account.
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
              <span>Send paperwork in small batches (10–20 clients) to manage signature completion rates</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
              <span style={{ color: THEME.colors.teal }}>✓</span>
              <span>Use DocuSign reminders (3 days, 7 days) to increase signature rates to 80%+</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
              <span style={{ color: THEME.colors.teal }}>✓</span>
              <span>Submit ACAT requests immediately after accounts are opened (do not wait for all paperwork)</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
              <span style={{ color: THEME.colors.teal }}>✓</span>
              <span>Monitor ACAT status daily and address rejections within 24 hours</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
              <span style={{ color: THEME.colors.teal }}>✓</span>
              <span>Keep detailed notes on each client&apos;s transfer status in CRM</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
              <span style={{ color: THEME.colors.teal }}>✓</span>
              <span>Set realistic client expectations: 8–12 weeks is normal, faster is rare</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
              <span style={{ color: THEME.colors.teal }}>✓</span>
              <span>Have advisor personally call clients with ACAT rejections to explain and resolve</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]">
              <span style={{ color: THEME.colors.teal }}>✓</span>
              <span>Complete full reconciliation before closing old accounts (never rush this step)</span>
            </li>
          </ul>
        </div>

      </div>
    </PageLayout>
  );
}
