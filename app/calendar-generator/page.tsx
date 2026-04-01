"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";
// --- Types ---

type Attendee = { name: string; email: string };
const emptyAttendee = (): Attendee => ({ name: "", email: "" });

// --- Meetings ---

const MEETINGS = [
  { id: "internal_pre_sync",        label: "Internal Pre-Sync",          daysFromLaunch: -42, owner: "AXM", optional: false },
  { id: "internal_checklist_sync",  label: "Internal Checklist Sync",    daysFromLaunch: -35, owner: "AXM", optional: false },
  { id: "kickoff",                  label: "Kick-Off Meeting",            daysFromLaunch: -28, owner: "AXM", optional: false },
  { id: "intro_compliance",         label: "Intro: Compliance",           daysFromLaunch: -21, owner: "AXM", optional: true  },
  { id: "intro_ria_leadership",     label: "Intro: RIA Leadership",       daysFromLaunch: -19, owner: "AXM", optional: false },
  { id: "intro_fam",                label: "Intro: FAM",                  daysFromLaunch: -17, owner: "AXM", optional: false },
  { id: "pre_launch_sync",          label: "Pre-Launch Sync",             daysFromLaunch: -7,  owner: "AXM", optional: false },
  { id: "t1_launch_sync",           label: "T-1 Launch Sync",             daysFromLaunch: -1,  owner: "AXM", optional: false },
  { id: "launch_day",               label: "Launch Day Check-In",         daysFromLaunch: 0,   owner: "AXM", optional: false },
  { id: "farther_systems",          label: "Farther Systems Overview",    daysFromLaunch: 7,   owner: "AXM", optional: false },
  { id: "cx_tasking",               label: "CX Tasking Overview",         daysFromLaunch: 14,  owner: "CX",  optional: false },
  { id: "intro_investment",         label: "Intro: Investment Strategy",  daysFromLaunch: 14,  owner: "AXM", optional: false },
  { id: "is_book_analysis",         label: "IS: Book Analysis",           daysFromLaunch: 21,  owner: "AXM", optional: false },
  { id: "intro_fig",                label: "Intro: FIG",                  daysFromLaunch: 21,  owner: "AXM", optional: true  },
  { id: "intro_financial_planning", label: "Intro: Financial Planning",   daysFromLaunch: 28,  owner: "AXM", optional: false },
];

// --- Helpers ---

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function toGCalDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0].slice(0, 8);
}

// --- Sub-components ---

function AttendeeRow({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
}: {
  label: string;
  value: Attendee;
  onChange: (v: Attendee) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex gap-3 items-center">
      <div className="w-[110px] shrink-0">
        <span className="text-[11px] font-semibold text-cream-muted font-sans">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </span>
      </div>
      <input
        type="text"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="Name"
        className="flex-1 px-3 py-[7px] rounded-md border border-cream-border bg-charcoal-500/50 text-cream text-[13px] outline-none font-sans"
      />
      <input
        type="email"
        value={value.email}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
        placeholder={placeholder || "email@example.com"}
        className="flex-1 px-3 py-[7px] rounded-md border border-cream-border bg-charcoal-500/50 text-cream text-[13px] outline-none font-sans"
      />
    </div>
  );
}

function AttendeeBadge({ attendee }: { attendee: Attendee }) {
  const initials = attendee.name
    ? attendee.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : attendee.email.slice(0, 2).toUpperCase();
  return (
    <span
      title={`${attendee.name || ""} <${attendee.email}>`}
      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-dark text-[9px] font-bold tracking-[0.03em] border-[1.5px] border-teal shrink-0 cursor-default"
    >
      {initials}
    </span>
  );
}

// --- Page ---

export default function CalendarGeneratorPage() {
  const [advisorName, setAdvisorName] = useState("");
  const [pathway, setPathway] = useState("breakaway");
  const [launchDate, setLaunchDate] = useState("");
  const [generated, setGenerated] = useState(false);

  // Advisors (up to 6)
  const [advisors, setAdvisors] = useState<Attendee[]>([emptyAttendee()]);

  // Internal team
  const [axm, setAxm] = useState<Attendee>(emptyAttendee());
  const [axa, setAxa] = useState<Attendee>(emptyAttendee());
  const [ctm, setCtm] = useState<Attendee>(emptyAttendee());
  const [cta, setCta] = useState<Attendee>(emptyAttendee());

  // Advisor's team
  const [advisorTeam, setAdvisorTeam] = useState<Attendee[]>([emptyAttendee()]);

  // Other stakeholders
  const [compliance, setCompliance] = useState<Attendee>(emptyAttendee());
  const [riaLeadership, setRiaLeadership] = useState<Attendee>(emptyAttendee());
  const [cxManager, setCxManager] = useState<Attendee>(emptyAttendee());

  const [included, setIncluded] = useState<Record<string, boolean>>(
    Object.fromEntries(MEETINGS.map((m) => [m.id, true]))
  );

  const launch = launchDate ? new Date(launchDate + "T12:00:00") : null;

  const toggle = (id: string) =>
    setIncluded((prev) => ({ ...prev, [id]: !prev[id] }));

  // -- Attendee resolver --

  const getMeetingAttendees = (meetingId: string): Attendee[] => {
    const allAdvisors = advisors.filter((a) => a.email);
    const teamMembers = advisorTeam.filter((a) => a.email);

    const map: Record<string, Attendee[]> = {
      internal_pre_sync:        [axm, axa, ctm].filter((a) => a.email),
      internal_checklist_sync:  [axm, axa, ctm].filter((a) => a.email),
      kickoff:                  [...allAdvisors, axm, axa, ctm].filter((a) => a.email),
      intro_compliance:         [...allAdvisors, axm, axa, compliance].filter((a) => a.email),
      intro_ria_leadership:     [...allAdvisors, axm, riaLeadership].filter((a) => a.email),
      intro_fam:                [...allAdvisors, axm].filter((a) => a.email),
      pre_launch_sync:          [...allAdvisors, axm, axa, ctm, cta, cxManager].filter((a) => a.email),
      t1_launch_sync:           [...allAdvisors, axm, axa].filter((a) => a.email),
      launch_day:               [...allAdvisors, axm, axa].filter((a) => a.email),
      farther_systems:          [...allAdvisors, ...teamMembers, axm].filter((a) => a.email),
      cx_tasking:               [...allAdvisors, ...teamMembers, axm, cxManager].filter((a) => a.email),
      intro_investment:         [...allAdvisors, axm, axa].filter((a) => a.email),
      is_book_analysis:         [...allAdvisors, axm, axa].filter((a) => a.email),
      intro_fig:                [...allAdvisors, axm, axa].filter((a) => a.email),
      intro_financial_planning: [...allAdvisors, axm].filter((a) => a.email),
    };

    return map[meetingId] ?? [];
  };

  // -- Google Calendar link --

  const gCalLink = (meeting: (typeof MEETINGS)[0]) => {
    if (!launch) return "#";
    const date = addDays(launch, meeting.daysFromLaunch);
    const dateStr = toGCalDate(date);
    const title = encodeURIComponent(
      `[Farther AX] ${advisorName ? advisorName + " — " : ""}${meeting.label}`
    );
    const attendees = getMeetingAttendees(meeting.id);
    const addParams = attendees.map((a) => `&add=${encodeURIComponent(a.email)}`).join("");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${encodeURIComponent(`Owner: ${meeting.owner}`)}&location=Zoom+Meeting${addParams}`;
  };

  // -- Render --

  return (
    <PageLayout
      step={12}
      title="Calendar Generator"
      subtitle="Auto-Calculate Meeting Dates & Generate Google Calendar Links"
      backHref="/breakaway-process"
      nextHref="/knowledge-check"
    >
      <div className="max-w-3xl">

        {/* -- Advisor Details -- */}
        <div className="rounded-xl p-6 mb-6 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-xl font-bold font-sans text-cream mb-5">
            Advisor Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-cream-muted">
                Advisor Name
              </label>
              <input
                type="text"
                value={advisorName}
                onChange={(e) => setAdvisorName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="w-full px-3 py-2 rounded-md border border-cream-border bg-charcoal-700 text-cream text-sm outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-cream-muted">
                Pathway
              </label>
              <select
                value={pathway}
                onChange={(e) => setPathway(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-cream-border bg-charcoal-700 text-cream text-sm outline-hidden"
              >
                <option value="breakaway">Breakaway</option>
                <option value="independent_ria">Independent RIA</option>
                <option value="ma">M&A</option>
                <option value="no_low_aum">No to Low AUM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-cream-muted">
                Launch / Go Live Date
              </label>
              <input
                type="date"
                value={launchDate}
                onChange={(e) => setLaunchDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-cream-border bg-charcoal-700 text-cream text-sm outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* -- Team & Attendees -- */}
        <div className="rounded-xl p-6 mb-6 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-xl font-bold font-sans text-cream mb-5">
            Team &amp; Attendees
          </h2>

          {/* Advisors */}
          <div className="mb-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-teal mb-2.5 font-sans">Advisors</div>
            <div className="flex flex-col gap-2">
              {advisors.map((adv, i) => (
                <AttendeeRow
                  key={i}
                  label={`Advisor ${i + 1}`}
                  value={adv}
                  onChange={(v) => setAdvisors((prev) => prev.map((a, j) => (j === i ? v : a)))}
                  placeholder={`advisor${i > 0 ? i + 1 : ""}@example.com`}
                  required={i === 0}
                />
              ))}
            </div>
            {advisors.length < 6 && (
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-teal bg-transparent border-none p-0 cursor-pointer font-sans"
                onClick={() => setAdvisors((prev) => [...prev, emptyAttendee()])}
              >
                + Add Advisor
              </button>
            )}
          </div>

          {/* Internal Team */}
          <div className="mb-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-teal mb-2.5 font-sans">Internal Team</div>
            <div className="flex flex-col gap-2">
              <AttendeeRow label="AXM" value={axm} onChange={setAxm} placeholder="axm@farther.com" />
              <AttendeeRow label="AXA" value={axa} onChange={setAxa} placeholder="axa@farther.com" />
              <AttendeeRow label="CTM" value={ctm} onChange={setCtm} placeholder="ctm@farther.com" />
              <AttendeeRow label="CTA" value={cta} onChange={setCta} placeholder="cta@farther.com" />
            </div>
          </div>

          {/* Advisor's Team */}
          <div className="mb-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-teal mb-2.5 font-sans">Advisor&apos;s Team</div>
            <div className="flex flex-col gap-2">
              {advisorTeam.map((member, i) => (
                <AttendeeRow
                  key={i}
                  label={`Team/Admin ${i + 1}`}
                  value={member}
                  onChange={(v) => setAdvisorTeam((prev) => prev.map((a, j) => (j === i ? v : a)))}
                />
              ))}
            </div>
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-teal bg-transparent border-none p-0 cursor-pointer font-sans"
              onClick={() => setAdvisorTeam((prev) => [...prev, emptyAttendee()])}
            >
              + Add Team Member
            </button>
          </div>

          {/* Other Stakeholders */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-teal mb-2.5 font-sans">Other Stakeholders</div>
            <div className="flex flex-col gap-2">
              <AttendeeRow label="Compliance"     value={compliance}    onChange={setCompliance}    placeholder="compliance@farther.com" />
              <AttendeeRow label="RIA Leadership" value={riaLeadership} onChange={setRiaLeadership} placeholder="ria@farther.com" />
              <AttendeeRow label="CX Manager"     value={cxManager}     onChange={setCxManager}     placeholder="cx@farther.com" />
            </div>
          </div>
        </div>

        {/* -- Generate button -- */}
        <button
          onClick={() => setGenerated(true)}
          disabled={!launchDate}
          className={`mb-6 px-6 py-2.5 rounded-md text-sm font-semibold text-white transition-opacity ${launchDate ? "bg-teal cursor-pointer" : "bg-charcoal-400 cursor-not-allowed"}`}
        >
          Generate Calendar &rarr;
        </button>

        {/* -- Meeting schedule -- */}
        {generated && launch && (
          <div className="rounded-xl border border-cream-border overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between bg-charcoal-600">
              <h2 className="text-xl font-bold font-sans text-cream">
                {advisorName ? `${advisorName} — Meeting Schedule` : "Meeting Schedule"}
              </h2>
              <span className="text-sm text-cream-muted">
                Launch: {formatDate(launch)}
              </span>
            </div>

            <div className="divide-y divide-cream-border">
              {MEETINGS.map((m) => {
                const date = addDays(launch, m.daysFromLaunch);
                const isLaunchDay = m.id === "launch_day";
                const attendees = getMeetingAttendees(m.id);
                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-3 px-6 py-3 ${isLaunchDay ? "bg-teal/[0.07]" : ""} ${!included[m.id] ? "opacity-40" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={included[m.id]}
                      onChange={() => toggle(m.id)}
                      className="h-4 w-4 accent-teal-700 shrink-0"
                    />

                    {/* Label + date */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-cream">
                          {m.label}
                        </span>
                        {isLaunchDay && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-teal text-white">
                            Launch Day
                          </span>
                        )}
                        {m.optional && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-white/[0.06] text-cream-muted border border-cream-border">
                            optional
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5 text-cream-muted">
                        {formatDate(date)} &middot; Owner: {m.owner}
                      </div>
                    </div>

                    {/* Attendee badges */}
                    {attendees.length > 0 && (
                      <div className="flex items-center gap-[3px] flex-wrap max-w-[160px]">
                        {attendees.slice(0, 8).map((a, i) => (
                          <AttendeeBadge key={i} attendee={a} />
                        ))}
                        {attendees.length > 8 && (
                          <span className="text-[10px] text-slate">
                            +{attendees.length - 8}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Calendar link */}
                    {included[m.id] && (
                      <a
                        href={gCalLink(m)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-3 py-1 rounded-sm text-xs font-medium border border-teal text-teal-dark transition-colors"
                      >
                        Add to Calendar &nearr;
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
