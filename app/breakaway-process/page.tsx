'use client';

import PageLayout from "@/components/PageLayout";
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
                    backgroundColor: '#3B5A69',
                    boxShadow: `0 0 10px ${'#3B5A69'}50`
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
                    boxShadow: `0 0 6px ${'#3B5A69'}25`
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
                  boxShadow: `0 0 16px ${'#3B5A69'}25`
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
                              boxShadow: `0 0 6px ${'#3B5A69'}33`
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

        <QuizSection topicSlug="breakaway-process" topicTitle="Breakaway Process" />
      </div>
    </PageLayout>
  );
}
