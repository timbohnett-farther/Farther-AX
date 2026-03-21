"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";

// ─── Types ───────────────────────────────────────────────────────────────────

type Attendee = { name: string; email: string };
const emptyAttendee = (): Attendee => ({ name: "", email: "" });

// ─── Meetings ────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ width: 110, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#5b6a71", fontFamily: "'Fakt', sans-serif" }}>
          {label}
          {required && <span style={{ color: "#c0392b" }}> *</span>}
        </span>
      </div>
      <input
        type="text"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="Name"
        style={{
          flex: 1,
          padding: "7px 12px",
          borderRadius: 6,
          border: "1px solid #dde8f0",
          backgroundColor: "#FAF7F2",
          color: "#333333",
          fontSize: 13,
          outline: "none",
          fontFamily: "'Fakt', sans-serif",
        }}
      />
      <input
        type="email"
        value={value.email}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
        placeholder={placeholder || "email@example.com"}
        style={{
          flex: 1,
          padding: "7px 12px",
          borderRadius: 6,
          border: "1px solid #dde8f0",
          backgroundColor: "#FAF7F2",
          color: "#333333",
          fontSize: 13,
          outline: "none",
          fontFamily: "'Fakt', sans-serif",
        }}
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
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: "50%",
        backgroundColor: "#d4eaed",
        color: "#155961",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.03em",
        border: "1.5px solid #1d7682",
        flexShrink: 0,
        cursor: "default",
      }}
    >
      {initials}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  // ── Attendee resolver ───────────────────────────────────────────────────────

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

  // ── Google Calendar link ────────────────────────────────────────────────────

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

  // ── Section label styles ────────────────────────────────────────────────────

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "#1d7682",
    marginBottom: 10,
    fontFamily: "'Fakt', sans-serif",
  };

  const addBtn: React.CSSProperties = {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "#1d7682",
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontFamily: "'Fakt', sans-serif",
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageLayout
      step={12}
      title="Calendar Generator"
      subtitle="Auto-Calculate Meeting Dates & Generate Google Calendar Links"
      backHref="/breakaway-process"
      nextHref="/knowledge-check"
    >
      <div className="max-w-3xl">

        {/* ── Advisor Details ── */}
        <div
          className="rounded-xl border p-6 mb-6"
          style={{ borderColor: "#dde8f0", backgroundColor: "rgba(250,247,242,0.8)" }}
        >
          <h2
            className="text-xl font-bold mb-5"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: "#333333" }}
          >
            Advisor Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#5b6a71" }}>
                Advisor Name
              </label>
              <input
                type="text"
                value={advisorName}
                onChange={(e) => setAdvisorName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="w-full px-3 py-2 rounded-md border text-sm outline-hidden"
                style={{ borderColor: "#dde8f0", backgroundColor: "#FAF7F2", color: "#333333" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#5b6a71" }}>
                Pathway
              </label>
              <select
                value={pathway}
                onChange={(e) => setPathway(e.target.value)}
                className="w-full px-3 py-2 rounded-md border text-sm outline-hidden"
                style={{ borderColor: "#dde8f0", backgroundColor: "#FAF7F2", color: "#333333" }}
              >
                <option value="breakaway">Breakaway</option>
                <option value="independent_ria">Independent RIA</option>
                <option value="ma">M&A</option>
                <option value="no_low_aum">No to Low AUM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#5b6a71" }}>
                Launch / Go Live Date
              </label>
              <input
                type="date"
                value={launchDate}
                onChange={(e) => setLaunchDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md border text-sm outline-hidden"
                style={{ borderColor: "#dde8f0", backgroundColor: "#FAF7F2", color: "#333333" }}
              />
            </div>
          </div>
        </div>

        {/* ── Team & Attendees ── */}
        <div
          className="rounded-xl border p-6 mb-6"
          style={{ borderColor: "#dde8f0", backgroundColor: "rgba(250,247,242,0.8)" }}
        >
          <h2
            className="text-xl font-bold mb-5"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: "#333333" }}
          >
            Team &amp; Attendees
          </h2>

          {/* Advisors */}
          <div style={{ marginBottom: 20 }}>
            <div style={sectionLabel}>Advisors</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                style={addBtn}
                onClick={() => setAdvisors((prev) => [...prev, emptyAttendee()])}
              >
                + Add Advisor
              </button>
            )}
          </div>

          {/* Internal Team */}
          <div style={{ marginBottom: 20 }}>
            <div style={sectionLabel}>Internal Team</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <AttendeeRow label="AXM" value={axm} onChange={setAxm} placeholder="axm@farther.com" />
              <AttendeeRow label="AXA" value={axa} onChange={setAxa} placeholder="axa@farther.com" />
              <AttendeeRow label="CTM" value={ctm} onChange={setCtm} placeholder="ctm@farther.com" />
              <AttendeeRow label="CTA" value={cta} onChange={setCta} placeholder="cta@farther.com" />
            </div>
          </div>

          {/* Advisor's Team */}
          <div style={{ marginBottom: 20 }}>
            <div style={sectionLabel}>Advisor&apos;s Team</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
              style={addBtn}
              onClick={() => setAdvisorTeam((prev) => [...prev, emptyAttendee()])}
            >
              + Add Team Member
            </button>
          </div>

          {/* Other Stakeholders */}
          <div>
            <div style={sectionLabel}>Other Stakeholders</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <AttendeeRow label="Compliance"     value={compliance}    onChange={setCompliance}    placeholder="compliance@farther.com" />
              <AttendeeRow label="RIA Leadership" value={riaLeadership} onChange={setRiaLeadership} placeholder="ria@farther.com" />
              <AttendeeRow label="CX Manager"     value={cxManager}     onChange={setCxManager}     placeholder="cx@farther.com" />
            </div>
          </div>
        </div>

        {/* ── Generate button ── */}
        <button
          onClick={() => setGenerated(true)}
          disabled={!launchDate}
          className="mb-6 px-6 py-2.5 rounded-md text-sm font-semibold text-white transition-opacity"
          style={{
            backgroundColor: launchDate ? "#1d7682" : "#dde8f0",
            cursor: launchDate ? "pointer" : "not-allowed",
          }}
        >
          Generate Calendar →
        </button>

        {/* ── Meeting schedule ── */}
        {generated && launch && (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "#dde8f0" }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ backgroundColor: "#f0f5f9" }}
            >
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: "#333333" }}
              >
                {advisorName ? `${advisorName} — Meeting Schedule` : "Meeting Schedule"}
              </h2>
              <span className="text-sm" style={{ color: "#5b6a71" }}>
                Launch: {formatDate(launch)}
              </span>
            </div>

            <div className="divide-y" style={{ borderColor: "#dde8f0" }}>
              {MEETINGS.map((m) => {
                const date = addDays(launch, m.daysFromLaunch);
                const isLaunchDay = m.id === "launch_day";
                const attendees = getMeetingAttendees(m.id);
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-6 py-3"
                    style={{
                      backgroundColor: isLaunchDay ? "rgba(29,118,130,0.07)" : "transparent",
                      opacity: included[m.id] ? 1 : 0.4,
                    }}
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
                        <span className="text-sm font-medium" style={{ color: "#333333" }}>
                          {m.label}
                        </span>
                        {isLaunchDay && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: "#1d7682", color: "white" }}
                          >
                            Launch Day
                          </span>
                        )}
                        {m.optional && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: "#f0f5f9", color: "#5b6a71", border: "1px solid #dde8f0" }}
                          >
                            optional
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "#5b6a71" }}>
                        {formatDate(date)} · Owner: {m.owner}
                      </div>
                    </div>

                    {/* Attendee badges */}
                    {attendees.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap", maxWidth: 160 }}>
                        {attendees.slice(0, 8).map((a, i) => (
                          <AttendeeBadge key={i} attendee={a} />
                        ))}
                        {attendees.length > 8 && (
                          <span style={{ fontSize: 10, color: "#5b6a71" }}>
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
                        className="shrink-0 px-3 py-1 rounded-sm text-xs font-medium border transition-colors"
                        style={{ borderColor: "#1d7682", color: "#155961" }}
                      >
                        Add to Calendar ↗
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
