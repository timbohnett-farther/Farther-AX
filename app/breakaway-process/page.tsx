'use client';

import PageLayout from "@/components/PageLayout";
import { THEME } from '@/lib/theme';
import QuizSection from "@/components/QuizSection";
export default function BreakawayProcessPage() {

  const phases = [
    {
      phase: "Phase 1",
      title: "Deal Signed",
      duration: "Day 0",
      items: [
        { meeting: "AX Kickoff (Internal)", attendees: "AXM, AXA, Legal", agenda: "Review advisor profile, confirm pathway, brief Legal on NCL status", followUp: "AXM assigns owner to each workstream", owner: "AXM" },
        { meeting: "Legal Review", attendees: "AXM, Legal, Advisor", agenda: "Review non-compete obligations, protocol membership, client communication restrictions", followUp: "NCL drafted and sent to advisor", owner: "Legal" },
      ],
    },
    {
      phase: "Phase 2",
      title: "Pre-Resignation Preparation",
      duration: "Weeks 1–3",
      items: [
        { meeting: "Tech Onboarding Session", attendees: "AXA, Advisor", agenda: "Portal access setup, platform walkthrough, model portfolio orientation", followUp: "Advisor completes training modules", owner: "AXA" },
        { meeting: "IAA & Exhibit B Signing", attendees: "AXM, Legal, Advisor", agenda: "Review and execute IAA and Exhibit B", followUp: "Documents stored in client file", owner: "AXM" },
        { meeting: "Transition Planning Session", attendees: "AXM, AXA, CTM, Advisor", agenda: "Confirm transition method, review custodian accounts, begin Transition Spreadsheet", followUp: "CTM prepares transition documentation", owner: "CTM" },
        { meeting: "U4 Preparation", attendees: "AXM, Compliance", agenda: "Prepare U4 form — DO NOT SUBMIT until after resignation", followUp: "U4 held in Compliance queue", owner: "Compliance" },
      ],
    },
    {
      phase: "Phase 3",
      title: "Resignation & Go Live",
      duration: "Day of Resignation",
      items: [
        { meeting: "Resignation Coordination Call", attendees: "AXM, Legal, Advisor", agenda: "Confirm resignation timing, review client communication plan, confirm U4 submit trigger", followUp: "Resignation executed by advisor", owner: "AXM" },
        { meeting: "U4 Submission", attendees: "Compliance", agenda: "Submit U4 immediately after resignation confirmation", followUp: "FINRA acknowledgment received and filed", owner: "Compliance" },
        { meeting: "Client Notification Deployment", attendees: "AXA, Advisor", agenda: "Send pre-approved client letters per protocol", followUp: "Track client response and opt-out requests", owner: "AXA" },
      ],
    },
    {
      phase: "Phase 4",
      title: "Transitions Running",
      duration: "Weeks 2–8+",
      items: [
        { meeting: "Weekly Transitions Check-In", attendees: "AXM, AXA, CTM, CTA", agenda: "Review Transition Spreadsheet, address open items, escalate blockers", followUp: "Transition Tracker updated within 24 hours", owner: "CTM" },
        { meeting: "Client Progress Review", attendees: "AXM, Advisor", agenda: "Discuss client transfer progress, address advisor concerns, manage client expectations", followUp: "Advisor sends update communications as needed", owner: "AXM" },
      ],
    },
    {
      phase: "Phase 5",
      title: "Graduation",
      duration: "Week 8–12",
      items: [
        { meeting: "Graduation Review", attendees: "AXM, AXA, Advisor, Head of AX", agenda: "Confirm all graduation criteria met: all accounts transferred, training complete, advisor self-sufficient on platform", followUp: "Advisor officially graduated. AX support transitions to standard model.", owner: "AXM" },
        { meeting: "Closeout & Handoff", attendees: "AXM, AXA, CTM", agenda: "Close out Transition Tracker, archive documents, confirm no open items", followUp: "Files archived. Case closed.", owner: "AXA" },
      ],
    },
  ];

  return (
    <PageLayout
      step={11}
      title="Breakaway Process"
      subtitle="Full Workflow — Deal Signed Through Graduation"
      backHref="/repaper-acat"
      nextHref="/calendar-generator"
    >
      <div className="max-w-4xl">
        <p className="text-base leading-relaxed mb-8 text-[var(--color-text)]">
          The following workflow maps every phase of a Breakaway advisor onboarding — from the
          moment the deal is signed through graduation. Each phase shows the key meetings,
          required attendees, agenda items, and follow-up actions with assigned owners.
        </p>

        <div className="space-y-6">
          {phases.map((phase, phaseIdx) => (
            <div key={phaseIdx}>
              {/* Phase header */}
              <div className="flex items-center gap-4 mb-3">
                <div
                  className="px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase text-white"
                  style={{
                    backgroundColor: THEME.colors.teal,
                    boxShadow: `0 0 10px ${THEME.colors.teal}50`
                  }}
                >
                  {phase.phase}
                </div>
                <h3
                  className="text-xl font-bold font-sans text-[var(--color-text)]"
                >
                  {phase.title}
                </h3>
                <span
                  className="text-sm px-2 py-0.5 border rounded-full"
                  style={{
                    borderColor: 'var(--color-border)',
                    boxShadow: `0 0 6px ${THEME.colors.teal}25`
                  }}
                >
                  {phase.duration}
                </span>
              </div>

              {/* Meetings table */}
              <div
                className="rounded-lg border overflow-hidden transition-all duration-200"
                style={{
                  borderColor: 'var(--color-border)',
                  boxShadow: `0 0 16px ${THEME.colors.teal}25`
                }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface)]">
                      <th
                        className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider w-[22%] text-[var(--color-text-secondary)]"
                      >
                        Meeting
                      </th>
                      <th
                        className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider w-[20%] text-[var(--color-text-secondary)]"
                      >
                        Attendees
                      </th>
                      <th
                        className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider w-[28%] text-[var(--color-text-secondary)]"
                      >
                        Agenda
                      </th>
                      <th
                        className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider w-[22%] text-[var(--color-text-secondary)]"
                      >
                        Follow-Up
                      </th>
                      <th
                        className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider w-[8%] text-[var(--color-text-secondary)]"
                      >
                        Owner
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {phase.items.map((item, itemIdx) => (
                      <tr
                        key={itemIdx}
                        className="transition-colors duration-200 hover:bg-white/5 border-t"
                        style={{
                          backgroundColor: itemIdx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)',
                          borderColor: 'var(--color-border)'
                        }}
                      >
                        <td
                          className="px-4 py-3 font-medium text-[var(--color-text)]"
                        >
                          {item.meeting}
                        </td>
                        <td
                          className="px-4 py-3 text-[var(--color-text)]"
                        >
                          {item.attendees}
                        </td>
                        <td
                          className="px-4 py-3 text-[var(--color-text)]"
                        >
                          {item.agenda}
                        </td>
                        <td
                          className="px-4 py-3 text-[var(--color-text)]"
                        >
                          {item.followUp}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 text-xs font-semibold rounded-full"
                            style={{
                              boxShadow: `0 0 6px ${THEME.colors.teal}33`
                            }}
                          >
                            {item.owner}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Day One Activation Checklist */}
        <div className="mt-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-3 font-serif text-[var(--color-text)]">
              Day One <span style={{ color: THEME.colors.gold }}>Activation Checklist</span>
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Technology activation items to be completed on the advisor&apos;s first official day with Farther. AXA owns coordination; advisor completes activation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { system: 'Google Workspace', items: ['Email account created and active', 'Calendar access configured', 'Google Drive folder structure created', 'Shared team drives access granted'] },
              { system: 'HubSpot CRM', items: ['User account provisioned', 'Contact and pipeline access configured', 'Training on household/contact views', 'Mobile app installed and configured'] },
              { system: 'Zoom & Zoom Phone', items: ['Meeting host license activated', 'Personal Meeting ID configured', 'Phone number assigned and forwarded', 'Desktop and mobile apps installed'] },
              { system: 'Scheduling & Communication', items: ['Calendly/scheduling tool configured', 'Chrome extension installed', 'Email signature template applied', 'Voicemail greeting recorded'] },
            ].map((group, i) => (
              <div
                key={i}
                className="rounded-xl p-6 bg-[var(--color-surface)] border border-[var(--color-border)]"
              >
                <h3 className="text-base font-bold mb-4 text-[var(--color-text)]" style={{ color: THEME.colors.teal }}>
                  {group.system}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-[var(--color-text)]">
                      <span className="text-xs mt-0.5" style={{ color: THEME.colors.teal }}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* First Week Technology Setup */}
        <div className="mt-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-3 font-serif text-[var(--color-text)]">
              First Week <span style={{ color: THEME.colors.gold }}>Technology Setup</span>
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Additional platforms and tools to be configured during the first week. Advisor completes setup with AXA support as needed.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { category: 'Financial Operations', items: ['Ramp (corporate card)', 'Navan (travel & expense)'] },
              { category: 'Planning & Analysis', items: ['RightCapital (financial planning)', 'AdvicePay (billing platform)', 'Pontera (held-away account management)', 'SmartRIA (risk assessment)'] },
              { category: 'Client Communication', items: ['AI note-taker (meeting transcription)', 'DocuSign (automated envelope workflow)', '"Welcome to Farther" email templates', 'Client portal access setup'] },
            ].map((section, i) => (
              <div
                key={i}
                className="rounded-xl p-6 bg-[var(--color-surface)] border border-[var(--color-border)]"
              >
                <h3 className="text-base font-bold mb-3 text-[var(--color-text)]">
                  {section.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {section.items.map((item, j) => (
                    <span
                      key={j}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border"
                      style={{
                        backgroundColor: THEME.colors.teal + '1A',
                        borderColor: THEME.colors.teal + '4D',
                        color: THEME.colors.teal,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg p-4 border" style={{ borderColor: THEME.colors.gold + '4D', backgroundColor: THEME.colors.gold + '0D' }}>
            <p className="text-sm text-[var(--color-text)]">
              <strong style={{ color: THEME.colors.gold }}>Timeline:</strong> All technology platforms should be fully configured and accessible by end of Week 1. AXA schedules 30-minute setup sessions for each platform as needed.
            </p>
          </div>
        </div>

        {/* First Month Department Meetings */}
        <div className="mt-16 mb-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-3 font-serif text-[var(--color-text)]">
              First Month <span style={{ color: THEME.colors.gold }}>Department Meetings</span>
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              10 introduction meetings scheduled throughout the first month to connect advisors with key Farther departments. AXM coordinates scheduling; each meeting is 30 minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { dept: 'RIA Leadership', topics: ['Farther RIA structure and governance', 'Strategic priorities and vision', 'Leadership team introductions'] },
              { dept: 'Planning', topics: ['Financial planning philosophy', 'RightCapital workflows', 'Planning deliverables and cadence'] },
              { dept: 'Investment Strategy', topics: ['Investment philosophy and process', 'Model portfolios overview', 'Rebalancing and tax-loss harvesting'] },
              { dept: 'FAM (Financial Advisor Marketing)', topics: ['Marketing support and resources', 'Social media guidelines', 'Event planning and sponsorship'] },
              { dept: 'Trust & Estate', topics: ['Estate planning services', 'Trust administration', 'Referral process for complex cases'] },
              { dept: 'Farther Institutional', topics: ['Institutional client services', 'Corporate retirement plans (401k)', 'Group benefits and executive compensation'] },
              { dept: 'Client Experience (CX)', topics: ['Client service model and expectations', 'Service tier definitions', 'CX team workflows and escalation'] },
              { dept: 'Insurance & Annuities', topics: ['Insurance product offerings', 'Annuity solutions', 'Underwriting and carrier relationships'] },
              { dept: '401k / Pontera', topics: ['401k plan management', 'Pontera platform for held-away accounts', 'Rollover coordination'] },
              { dept: 'Marketing', topics: ['Brand guidelines and logo usage', 'Content creation and approval process', 'Marketing collateral library'] },
            ].map((meeting, i) => (
              <div
                key={i}
                className="rounded-xl p-5 bg-[var(--color-surface)] border border-[var(--color-border)]"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                    style={{
                      backgroundColor: THEME.colors.teal + '26',
                      border: `1px solid ${THEME.colors.teal}4D`,
                      color: THEME.colors.teal,
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-base font-bold text-[var(--color-text)] mt-0.5">
                    {meeting.dept}
                  </h3>
                </div>
                <ul className="ml-11 space-y-1.5">
                  {meeting.topics.map((topic, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                      <span style={{ color: THEME.colors.teal }}>•</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg p-4 border" style={{ borderColor: THEME.colors.gold + '4D', backgroundColor: THEME.colors.gold + '0D' }}>
            <p className="text-sm text-[var(--color-text)]">
              <strong style={{ color: THEME.colors.gold }}>Scheduling:</strong> AXM books all 10 meetings within the first 30 days. Meetings can be grouped (2-3 per week) to avoid overwhelming the advisor&apos;s calendar during the busy launch period.
            </p>
          </div>
        </div>

        {/* Pre-Signing Guide */}
        <div className="mt-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-3 font-serif text-[var(--color-text)]">
              Pre-Signing <span style={{ color: THEME.colors.gold }}>Preparation Guide</span>
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Critical preparation steps completed before the advisor signs the IAA. These set the foundation for a smooth onboarding and transition.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: 'Welcome Video Recording',
                owner: 'AXM',
                description: 'Record a personalized welcome video from the assigned AXM introducing the onboarding team and previewing the process. Share with the advisor within 24 hours of deal acceptance.',
              },
              {
                title: 'Technology Stack Mapping',
                owner: 'AXA',
                description: 'Document the advisor\'s current technology stack: CRM, financial planning, performance reporting, billing, and communication tools. Identify migration paths and potential data export requirements.',
              },
              {
                title: 'Commitment Collection',
                owner: 'AXM',
                description: 'Collect advisor commitments: target launch date, estimated transferable AUM, household count, staffing needs, and any contractual obligations (non-competes, protocol membership, restrictive covenants).',
              },
              {
                title: 'Custodian Positioning (Schwab)',
                owner: 'AXM',
                description: 'Present Schwab custodian benefits: institutional pricing, broad investment product access, dedicated service team, Schwab Advisor Services technology integration, and seamless ACAT transfer capabilities.',
              },
              {
                title: 'Compliance Data Guidelines',
                owner: 'Compliance',
                description: 'Brief the advisor on what data they CAN and CANNOT take from their current firm. Protocol members may take client names, addresses, phone numbers, email addresses, and account titles. Non-protocol: consult legal.',
              },
              {
                title: '"What NOT to Take" Checklist',
                owner: 'Compliance',
                description: 'Provide the compliance checklist of prohibited items: proprietary research, internal reports, client account statements, performance reports generated by the prior firm, model portfolios, and any firm-branded materials.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl p-6 bg-[var(--color-surface)] border border-[var(--color-border)]"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-[var(--color-text)]">{item.title}</h3>
                  <span
                    className="px-2 py-0.5 text-xs font-semibold rounded-full shrink-0 ml-3"
                    style={{ backgroundColor: THEME.colors.teal + '1A', color: THEME.colors.teal }}
                  >
                    {item.owner}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transition Preparation Guide */}
        <div className="mt-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-3 font-serif text-[var(--color-text)]">
              Transition <span style={{ color: THEME.colors.gold }}>Preparation Guide</span>
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Compliance-first preparation for client data migration and account transfers. Ensure all data handling follows SEC/FINRA requirements.
            </p>
          </div>

          <div className="rounded-xl p-6 bg-[var(--color-surface)] border border-[var(--color-border)] mb-6">
            <h3 className="text-base font-bold mb-4 text-[var(--color-text)]" style={{ color: THEME.colors.teal }}>
              Protocol Member Data Rights
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold mb-2 text-green-400">Permitted to Take</h4>
                <ul className="space-y-1.5">
                  {['Client names', 'Mailing addresses', 'Phone numbers', 'Email addresses', 'Account titles (e.g., "Joint WROS")'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text)]">
                      <span className="text-green-400 text-xs mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-red-400">Prohibited Items</h4>
                <ul className="space-y-1.5">
                  {['Client account statements', 'Performance reports from prior firm', 'Proprietary research or models', 'Internal memos or reports', 'Firm-branded materials', 'Client SSN or tax IDs'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text)]">
                      <span className="text-red-400 text-xs mt-0.5">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6 bg-[var(--color-surface)] border border-[var(--color-border)]">
            <h3 className="text-base font-bold mb-4 text-[var(--color-text)]" style={{ color: THEME.colors.teal }}>
              Data Backup Instructions
            </h3>
            <ol className="space-y-3">
              {[
                'Export permitted client contact data to a personal device or encrypted USB before resignation day',
                'Do NOT use firm email, shared drives, or firm devices to store or transfer client data',
                'Verify all data falls within Protocol-permitted categories with Compliance before export',
                'Store exported data securely until Farther CRM import is complete, then delete the local copy',
                'Non-Protocol advisors: consult Legal before taking ANY client information',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[var(--color-text)]">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: THEME.colors.teal + '26', color: THEME.colors.teal }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* First 90 Days — KPI Tracking */}
        <div className="mt-16 mb-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-3 font-serif text-[var(--color-text)]">
              First 90 Days <span style={{ color: THEME.colors.gold }}>KPI Tracking</span>
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Key performance indicators tracked during the advisor&apos;s first 90 days to measure onboarding success and identify areas for additional support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              { kpi: 'Net New AUM', target: 'Transfer 90%+ of committed AUM', frequency: 'Weekly', description: 'Total assets transferred to Farther accounts vs. committed amount at signing.' },
              { kpi: 'Net Flows', target: 'Positive net flows within 60 days', frequency: 'Monthly', description: 'Net inflows minus outflows after initial transfer. Indicates client retention and growth.' },
              { kpi: 'Revenue per Household', target: 'Match or exceed prior firm level', frequency: 'Monthly', description: 'Average revenue generated per household. Validates fee schedule alignment.' },
              { kpi: 'Pipeline Velocity', target: 'All accounts transferred by Day 60', frequency: 'Weekly', description: 'Rate at which accounts move through the ACAT/repaper pipeline to completion.' },
              { kpi: 'Client NPS', target: 'Score of 8+ within 90 days', frequency: 'At Day 30 and Day 90', description: 'Net Promoter Score from transferred clients. Measures satisfaction with the transition experience.' },
              { kpi: 'Platform Adoption', target: '100% tool activation by Day 30', frequency: 'Weekly', description: 'Tracks advisor adoption of all Farther tools: CRM, planning, billing, compliance, and communication platforms.' },
            ].map((metric, i) => (
              <div
                key={i}
                className="rounded-xl p-5 bg-[var(--color-surface)] border border-[var(--color-border)]"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-[var(--color-text)]">{metric.kpi}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] shrink-0 ml-2">
                    {metric.frequency}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">{metric.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: THEME.colors.gold }}>Target:</span>
                  <span className="text-xs text-[var(--color-text)]">{metric.target}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg p-4 border" style={{ borderColor: THEME.colors.gold + '4D', backgroundColor: THEME.colors.gold + '0D' }}>
            <p className="text-sm text-[var(--color-text)]">
              <strong style={{ color: THEME.colors.gold }}>Graduation Criteria:</strong> Advisors who meet all KPI targets within 90 days are eligible for graduation to standard support. Those below targets receive an extended support plan with weekly AXM check-ins until metrics are met.
            </p>
          </div>
        </div>

        <QuizSection topicSlug="breakaway-process" topicTitle="Breakaway Process" />
      </div>
    </PageLayout>
  );
}
