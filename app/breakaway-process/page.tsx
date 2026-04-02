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

        <QuizSection topicSlug="breakaway-process" topicTitle="Breakaway Process" />
      </div>
    </PageLayout>
  );
}
