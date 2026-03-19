# Calendar Generator — Attendees & Zoom Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace placeholder meetings with 15 real Breakaway workflow meetings, add a full attendee management section, auto-assign attendees per meeting, show attendee badges, and default all calendar events to Zoom.

**Architecture:** Single-file React component update to `app/calendar-generator/page.tsx`. All state managed locally with `useState`. Attendee data flows from form inputs → per-meeting attendee resolver → Google Calendar URL builder → badge renderer. No external dependencies needed.

**Tech Stack:** Next.js 14, React 18, TypeScript, inline CSS (no Tailwind classes for styling), Google Calendar URL API

---

### Task 1: Replace MEETINGS array and add Zoom location

**Files:**
- Modify: `app/calendar-generator/page.tsx`

**Step 1: Replace the MEETINGS constant**

Replace the existing `MEETINGS` array (lines 6–19) with the 15 canonical Breakaway meetings. Use these `daysFromLaunch` values based on the Breakaway timeline:

```typescript
const MEETINGS = [
  { id: "internal_pre_sync",        label: "Internal Pre-Sync",           daysFromLaunch: -42, owner: "AXM",  optional: false },
  { id: "internal_checklist_sync",  label: "Internal Checklist Sync",     daysFromLaunch: -35, owner: "AXM",  optional: false },
  { id: "kickoff",                  label: "Kick-Off Meeting",             daysFromLaunch: -28, owner: "AXM",  optional: false },
  { id: "intro_compliance",         label: "Intro: Compliance",            daysFromLaunch: -21, owner: "AXM",  optional: true  },
  { id: "intro_ria_leadership",     label: "Intro: RIA Leadership",        daysFromLaunch: -19, owner: "AXM",  optional: false },
  { id: "intro_fam",                label: "Intro: FAM",                   daysFromLaunch: -17, owner: "AXM",  optional: false },
  { id: "pre_launch_sync",          label: "Pre-Launch Sync",              daysFromLaunch: -7,  owner: "AXM",  optional: false },
  { id: "t1_launch_sync",           label: "T-1 Launch Sync",              daysFromLaunch: -1,  owner: "AXM",  optional: false },
  { id: "launch_day",               label: "Launch Day Check-In",          daysFromLaunch: 0,   owner: "AXM",  optional: false },
  { id: "farther_systems",          label: "Farther Systems Overview",     daysFromLaunch: 7,   owner: "AXM",  optional: false },
  { id: "cx_tasking",               label: "CX Tasking Overview",          daysFromLaunch: 14,  owner: "CX",   optional: false },
  { id: "intro_investment",         label: "Intro: Investment Strategy",   daysFromLaunch: 14,  owner: "AXM",  optional: false },
  { id: "is_book_analysis",         label: "IS: Book Analysis",            daysFromLaunch: 21,  owner: "AXM",  optional: false },
  { id: "intro_fig",                label: "Intro: FIG",                   daysFromLaunch: 21,  owner: "AXM",  optional: true  },
  { id: "intro_financial_planning", label: "Intro: Financial Planning",    daysFromLaunch: 28,  owner: "AXM",  optional: false },
];
```

**Step 2: Add Zoom location to `gCalLink`**

In the `gCalLink` function, add `&location=Zoom+Meeting` to the returned URL:

```typescript
return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${encodeURIComponent(`Owner: ${meeting.owner}`)}&location=Zoom+Meeting&add=${guests}`;
```

---

### Task 2: Define attendee state shape and initial state

**Files:**
- Modify: `app/calendar-generator/page.tsx`

**Step 1: Define the `Attendee` type above the component**

```typescript
type Attendee = { name: string; email: string };
const emptyAttendee = (): Attendee => ({ name: "", email: "" });
```

**Step 2: Add attendee state inside the component**

Replace the existing `advisorEmail`/`axmEmail` state with a comprehensive attendee state object:

```typescript
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
```

**Step 3: Remove the old `advisorEmail` and `axmEmail` useState calls**

---

### Task 3: Build the attendee-resolver function

**Files:**
- Modify: `app/calendar-generator/page.tsx`

**Step 1: Add `getMeetingAttendees` function above the return**

This function takes a meeting ID and returns the array of `Attendee` objects assigned to it:

```typescript
const getMeetingAttendees = (meetingId: string): Attendee[] => {
  const allAdvisors = advisors.filter(a => a.email);
  const teamMembers = advisorTeam.filter(a => a.email);

  const map: Record<string, Attendee[]> = {
    internal_pre_sync:        [axm, axa, ctm].filter(a => a.email),
    internal_checklist_sync:  [axm, axa, ctm].filter(a => a.email),
    kickoff:                  [...allAdvisors, axm, axa, ctm].filter(a => a.email),
    intro_compliance:         [...allAdvisors, axm, axa, compliance].filter(a => a.email),
    intro_ria_leadership:     [...allAdvisors, axm, riaLeadership].filter(a => a.email),
    intro_fam:                [...allAdvisors, axm].filter(a => a.email),
    pre_launch_sync:          [...allAdvisors, axm, axa, ctm, cta, cxManager].filter(a => a.email),
    t1_launch_sync:           [...allAdvisors, axm, axa].filter(a => a.email),
    launch_day:               [...allAdvisors, axm, axa].filter(a => a.email),
    farther_systems:          [...allAdvisors, ...teamMembers, axm].filter(a => a.email),
    cx_tasking:               [...allAdvisors, ...teamMembers, axm, cxManager].filter(a => a.email),
    intro_investment:         [...allAdvisors, axm, axa].filter(a => a.email),
    is_book_analysis:         [...allAdvisors, axm, axa].filter(a => a.email),
    intro_fig:                [...allAdvisors, axm, axa].filter(a => a.email),
    intro_financial_planning: [...allAdvisors, axm].filter(a => a.email),
  };

  return map[meetingId] ?? [];
};
```

**Step 2: Update `gCalLink` to use `getMeetingAttendees`**

Replace the old `guests` computation with:

```typescript
const gCalLink = (meeting: (typeof MEETINGS)[0]) => {
  if (!launch) return "#";
  const date = addDays(launch, meeting.daysFromLaunch);
  const dateStr = toGCalDate(date);
  const title = encodeURIComponent(
    `[Farther AX] ${advisorName ? advisorName + " — " : ""}${meeting.label}`
  );
  const attendees = getMeetingAttendees(meeting.id);
  const addParams = attendees.map(a => `&add=${encodeURIComponent(a.email)}`).join("");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${encodeURIComponent(`Owner: ${meeting.owner}`)}&location=Zoom+Meeting${addParams}`;
};
```

---

### Task 4: Build the "Team & Attendees" section UI

**Files:**
- Modify: `app/calendar-generator/page.tsx`

**Step 1: Add the helper `AttendeeRow` component above `CalendarGeneratorPage`**

This renders a paired Name + Email row:

```tsx
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
    <div className="flex gap-3 items-start">
      <div style={{ width: 100, flexShrink: 0 }}>
        <span className="text-xs font-semibold" style={{ color: "#5b6a71" }}>{label}{required && <span style={{ color: "#c0392b" }}> *</span>}</span>
      </div>
      <input
        type="text"
        value={value.name}
        onChange={e => onChange({ ...value, name: e.target.value })}
        placeholder="Name"
        className="flex-1 px-3 py-2 rounded-md border text-sm outline-none"
        style={{ borderColor: "#dde8f0", backgroundColor: "#FAF7F2", color: "#333333" }}
      />
      <input
        type="email"
        value={value.email}
        onChange={e => onChange({ ...value, email: e.target.value })}
        placeholder={placeholder || "email@example.com"}
        className="flex-1 px-3 py-2 rounded-md border text-sm outline-none"
        style={{ borderColor: "#dde8f0", backgroundColor: "#FAF7F2", color: "#333333" }}
      />
    </div>
  );
}
```

**Step 2: Insert the "Team & Attendees" section in the JSX**

Place it between the existing "Advisor Details" form card and the Generate button. Structure:

```tsx
{/* Team & Attendees */}
<div
  className="rounded-xl border p-6 mb-6"
  style={{ borderColor: "#dde8f0", backgroundColor: "rgba(250,247,242,0.8)" }}
>
  <h2 className="text-xl font-bold mb-5" style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: "#333333" }}>
    Team &amp; Attendees
  </h2>

  {/* Advisors */}
  <div className="mb-5">
    <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "#1d7682" }}>Advisors</h3>
    <div className="flex flex-col gap-2">
      {advisors.map((adv, i) => (
        <AttendeeRow
          key={i}
          label={`Advisor ${i + 1}`}
          value={adv}
          onChange={v => setAdvisors(prev => prev.map((a, j) => j === i ? v : a))}
          placeholder={`advisor${i + 1}@example.com`}
          required={i === 0}
        />
      ))}
    </div>
    {advisors.length < 6 && (
      <button
        onClick={() => setAdvisors(prev => [...prev, emptyAttendee()])}
        className="mt-2 text-xs font-medium"
        style={{ color: "#1d7682" }}
        type="button"
      >
        + Add Advisor
      </button>
    )}
  </div>

  {/* Internal Team */}
  <div className="mb-5">
    <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "#1d7682" }}>Internal Team</h3>
    <div className="flex flex-col gap-2">
      <AttendeeRow label="AXM" value={axm} onChange={setAxm} placeholder="axm@farther.com" />
      <AttendeeRow label="AXA" value={axa} onChange={setAxa} placeholder="axa@farther.com" />
      <AttendeeRow label="CTM" value={ctm} onChange={setCtm} placeholder="ctm@farther.com" />
      <AttendeeRow label="CTA" value={cta} onChange={setCta} placeholder="cta@farther.com" />
    </div>
  </div>

  {/* Advisor's Team */}
  <div className="mb-5">
    <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "#1d7682" }}>Advisor&apos;s Team</h3>
    <div className="flex flex-col gap-2">
      {advisorTeam.map((member, i) => (
        <AttendeeRow
          key={i}
          label={`Team/Admin ${i + 1}`}
          value={member}
          onChange={v => setAdvisorTeam(prev => prev.map((a, j) => j === i ? v : a))}
        />
      ))}
    </div>
    <button
      onClick={() => setAdvisorTeam(prev => [...prev, emptyAttendee()])}
      className="mt-2 text-xs font-medium"
      style={{ color: "#1d7682" }}
      type="button"
    >
      + Add Team Member
    </button>
  </div>

  {/* Other Stakeholders */}
  <div>
    <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "#1d7682" }}>Other Stakeholders</h3>
    <div className="flex flex-col gap-2">
      <AttendeeRow label="Compliance" value={compliance} onChange={setCompliance} placeholder="compliance@farther.com" />
      <AttendeeRow label="RIA Leadership" value={riaLeadership} onChange={setRiaLeadership} placeholder="ria@farther.com" />
      <AttendeeRow label="CX Manager" value={cxManager} onChange={setCxManager} placeholder="cx@farther.com" />
    </div>
  </div>
</div>
```

---

### Task 5: Add attendee badges to meeting rows

**Files:**
- Modify: `app/calendar-generator/page.tsx`

**Step 1: Add `AttendeeBadge` component above `CalendarGeneratorPage`**

```tsx
function AttendeeBadge({ attendee }: { attendee: Attendee }) {
  const initials = attendee.name
    ? attendee.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
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
        color: "#1d7682",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.02em",
        border: "1.5px solid #1d7682",
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}
```

**Step 2: Add badges into meeting row JSX**

Inside the meeting row `div.flex.items-center`, after the label/date block and before the "Add to Calendar" link, add:

```tsx
{/* Attendee badges */}
<div className="flex items-center gap-1 flex-wrap" style={{ minWidth: 0 }}>
  {getMeetingAttendees(m.id).slice(0, 8).map((a, i) => (
    <AttendeeBadge key={i} attendee={a} />
  ))}
  {getMeetingAttendees(m.id).length > 8 && (
    <span style={{ fontSize: 10, color: "#5b6a71" }}>+{getMeetingAttendees(m.id).length - 8}</span>
  )}
</div>
```

---

### Task 6: Clean up old state refs and update `included` initial state

**Files:**
- Modify: `app/calendar-generator/page.tsx`

**Step 1: Update `included` initial state**

The `included` state is keyed by meeting ID. Since MEETINGS changed, re-initialize:

```typescript
const [included, setIncluded] = useState<Record<string, boolean>>(
  Object.fromEntries(MEETINGS.map((m) => [m.id, true]))
);
```
This is already correct as written — just ensure the MEETINGS array update from Task 1 feeds in.

**Step 2: Update the meeting row to show optional badge**

In the meeting row, replace the `isGoLive` badge with a dual check:

```tsx
const isLaunchDay = m.id === "launch_day";
// In the badge section:
{isLaunchDay && (
  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#1d7682", color: "white" }}>
    Launch Day
  </span>
)}
{m.optional && (
  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#f0f5f9", color: "#5b6a71", border: "1px solid #dde8f0" }}>
    optional
  </span>
)}
```

---

### Task 7: Commit and push

```bash
cd /Users/tim.bohnett/ClaudeCode/Farther-AX
git add app/calendar-generator/page.tsx docs/plans/2026-03-18-calendar-generator-attendees.md
git commit -m "feat: calendar generator — real breakaway meetings, attendee management, zoom default, badges"
git push
```
