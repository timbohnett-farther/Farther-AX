"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";

const MEETINGS = [
  { id: "kickoff", label: "AX Kickoff (Internal)", daysFromLaunch: -42, owner: "AXM" },
  { id: "legal_review", label: "Legal Review", daysFromLaunch: -40, owner: "Legal" },
  { id: "tech_onboarding", label: "Tech Onboarding Session", daysFromLaunch: -35, owner: "AXA" },
  { id: "iaa_signing", label: "IAA & Exhibit B Signing", daysFromLaunch: -30, owner: "AXM" },
  { id: "transition_planning", label: "Transition Planning Session", daysFromLaunch: -28, owner: "CTM" },
  { id: "weekly_1", label: "Weekly Check-In #1", daysFromLaunch: -21, owner: "AXM" },
  { id: "weekly_2", label: "Weekly Check-In #2", daysFromLaunch: -14, owner: "AXM" },
  { id: "weekly_3", label: "Weekly Check-In #3", daysFromLaunch: -7, owner: "AXM" },
  { id: "go_live", label: "Go Live", daysFromLaunch: 0, owner: "AXM" },
  { id: "post_live_1", label: "Post-Launch Check-In #1", daysFromLaunch: 7, owner: "AXM" },
  { id: "post_live_2", label: "Post-Launch Check-In #2", daysFromLaunch: 14, owner: "AXM" },
  { id: "graduation", label: "Graduation Review", daysFromLaunch: 30, owner: "AXM" },
];

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

export default function CalendarGeneratorPage() {
  const [advisorName, setAdvisorName] = useState("");
  const [pathway, setPathway] = useState("breakaway");
  const [launchDate, setLaunchDate] = useState("");
  const [advisorEmail, setAdvisorEmail] = useState("");
  const [axmEmail, setAxmEmail] = useState("");
  const [included, setIncluded] = useState<Record<string, boolean>>(
    Object.fromEntries(MEETINGS.map((m) => [m.id, true]))
  );
  const [generated, setGenerated] = useState(false);

  const launch = launchDate ? new Date(launchDate + "T12:00:00") : null;

  const toggle = (id: string) =>
    setIncluded((prev) => ({ ...prev, [id]: !prev[id] }));

  const gCalLink = (meeting: (typeof MEETINGS)[0]) => {
    if (!launch) return "#";
    const date = addDays(launch, meeting.daysFromLaunch);
    const dateStr = toGCalDate(date);
    const title = encodeURIComponent(
      `[Farther AX] ${advisorName ? advisorName + " — " : ""}${meeting.label}`
    );
    const guests = [advisorEmail, axmEmail].filter(Boolean).map(encodeURIComponent).join(",");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${encodeURIComponent(`Owner: ${meeting.owner}`)}&add=${guests}`;
  };

  return (
    <PageLayout
      step={12}
      title="Calendar Generator"
      subtitle="Auto-Calculate Meeting Dates & Generate Google Calendar Links"
      backHref="/breakaway-process"
      nextHref="/knowledge-check"
    >
      <div className="max-w-3xl">
        {/* Form */}
        <div
          className="rounded-xl border p-6 mb-6"
          style={{ borderColor: "#dde8f0", backgroundColor: "rgba(255,255,255,0.5)" }}
        >
          <h2
            className="text-xl font-bold mb-5"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#333333" }}
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
                className="w-full px-3 py-2 rounded-md border text-sm outline-none"
                style={{ borderColor: "#dde8f0", backgroundColor: "#ffffff", color: "#333333" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#5b6a71" }}>
                Pathway
              </label>
              <select
                value={pathway}
                onChange={(e) => setPathway(e.target.value)}
                className="w-full px-3 py-2 rounded-md border text-sm outline-none"
                style={{ borderColor: "#dde8f0", backgroundColor: "#ffffff", color: "#333333" }}
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
                className="w-full px-3 py-2 rounded-md border text-sm outline-none"
                style={{ borderColor: "#dde8f0", backgroundColor: "#ffffff", color: "#333333" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#5b6a71" }}>
                Advisor Email (for invites)
              </label>
              <input
                type="email"
                value={advisorEmail}
                onChange={(e) => setAdvisorEmail(e.target.value)}
                placeholder="advisor@example.com"
                className="w-full px-3 py-2 rounded-md border text-sm outline-none"
                style={{ borderColor: "#dde8f0", backgroundColor: "#ffffff", color: "#333333" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#5b6a71" }}>
                AXM Email
              </label>
              <input
                type="email"
                value={axmEmail}
                onChange={(e) => setAxmEmail(e.target.value)}
                placeholder="axm@farther.com"
                className="w-full px-3 py-2 rounded-md border text-sm outline-none"
                style={{ borderColor: "#dde8f0", backgroundColor: "#ffffff", color: "#333333" }}
              />
            </div>
          </div>

          <button
            onClick={() => setGenerated(true)}
            disabled={!launchDate}
            className="mt-5 px-6 py-2.5 rounded-md text-sm font-semibold text-white transition-opacity"
            style={{
              backgroundColor: launchDate ? "#1d7682" : "#dde8f0",
              cursor: launchDate ? "pointer" : "not-allowed",
            }}
          >
            Generate Calendar →
          </button>
        </div>

        {/* Results */}
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
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#333333" }}
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
                const isGoLive = m.id === "go_live";
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-4 px-6 py-3"
                    style={{
                      backgroundColor: isGoLive ? "rgba(29,118,130,0.1)" : "transparent",
                      opacity: included[m.id] ? 1 : 0.4,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={included[m.id]}
                      onChange={() => toggle(m.id)}
                      className="h-4 w-4 accent-amber-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "#333333" }}>
                          {m.label}
                        </span>
                        {isGoLive && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: "#1d7682", color: "white" }}
                          >
                            Go Live
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "#5b6a71" }}>
                        {formatDate(date)} · Owner: {m.owner}
                      </div>
                    </div>
                    {included[m.id] && (
                      <a
                        href={gCalLink(m)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-3 py-1 rounded text-xs font-medium border transition-colors"
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
