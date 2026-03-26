import PageLayout from "@/components/PageLayout";
import QuizSection from "@/components/QuizSection";

const characteristics = [
  {
    label: "Compliance Sensitivity",
    badge: "High",
    badgeColor: "bg-red-600",
    badgeShadow: "shadow-[0_0_10px_rgba(220,38,38,0.25)]",
    body: "Non-solicitation and non-compete agreements are common. Advisors may face legal action from their prior firm if they contact clients before resignation. AXM and Legal must be briefed before any advisor communication goes out.",
  },
  {
    label: "U4 Timing",
    badge: "Hold Until Resignation",
    badgeColor: "bg-teal",
    badgeShadow: "shadow-[0_0_10px_rgba(78,112,130,0.25)]",
    body: "The U4 registration form must NOT be submitted until after the advisor has formally resigned. Submitting early creates a trackable FINRA event that can alert the prior firm prematurely.",
  },
  {
    label: "Client Communication",
    badge: "Restricted Pre-Resignation",
    badgeColor: "bg-amber-600",
    badgeShadow: "shadow-[0_0_10px_rgba(217,119,6,0.25)]",
    body: "Under the Protocol for Broker Recruitment, advisors may take only client names, addresses, phone numbers, email, and account titles. Any broader client data extraction is prohibited. Advisors should consult their prior firm's protocol membership status.",
  },
  {
    label: "Resignation Required",
    badge: "Mandatory First Step",
    badgeColor: "bg-slate",
    badgeShadow: "shadow-[0_0_10px_rgba(91,106,113,0.25)]",
    body: "The advisor must formally resign before the Farther onboarding can fully proceed. The AXM coordinates timing with the advisor and Legal to minimize exposure and ensure the transition is clean.",
  },
];

const protocolItems = [
  "Client name",
  "Address",
  "Phone number",
  "Email address",
  "Account title",
];

const timelineSteps = [
  {
    num: "01",
    title: "Deal Signed",
    body: "AXM assigned. Legal briefed. NCL reviewed. No client contact yet.",
  },
  {
    num: "02",
    title: "Pre-Resignation Phase",
    body: "All Farther tech access and training completed in stealth. IAA and Exhibit B signed. U4 prepared but held.",
  },
  {
    num: "03",
    title: "Resignation Day",
    body: "Advisor formally resigns. U4 submitted immediately. Client notification letters prepared for same-day or next-day delivery.",
  },
  {
    num: "04",
    title: "Post-Resignation",
    body: "Client outreach begins per protocol. Transition method initiated. Custodian paperwork submitted.",
  },
  {
    num: "05",
    title: "Go Live",
    body: "Advisor is active on Farther platform. Transitions running in parallel.",
  },
];

const pitfalls = [
  "Submitting U4 before resignation — creates FINRA event, alerts prior firm",
  "Client outreach before resignation — non-solicitation violation risk",
  "Taking client data beyond protocol list — grounds for injunctive relief",
  "Failing to check prior firm's protocol membership status",
  "Not briefing Farther Legal before advisor communicates any transition plans",
];

export default function BreakawayPage() {
  return (
    <PageLayout
      step={4}
      totalSteps={13}
      title="Breakaway"
      subtitle="Advisor Pathway — Wirehouse & Captive Firm Departures"
      backHref="/key-documents"
      backLabel="Key Documents"
      nextHref="/independent-ria"
      nextLabel="Independent RIA"
    >
      <div className="max-w-[900px] mx-auto">
        {/* Intro */}
        <p className="text-cream-muted text-base leading-[1.75] mb-10 border-l-[3px] border-teal pl-4">
          The Breakaway pathway applies to advisors departing a wirehouse
          (Merrill Lynch, Morgan Stanley, UBS, Wells Fargo, Raymond James, etc.)
          or other captive firm to join Farther. This pathway carries the{" "}
          <strong className="text-cream">
            highest compliance sensitivity
          </strong>{" "}
          of all four onboarding paths. Every step must be carefully sequenced
          to protect the advisor, protect Farther, and avoid triggering
          unnecessary legal action from the departing firm.
        </p>

        {/* Key Characteristics */}
        <section className="mb-10">
          <h2 className="font-sans text-xl font-bold text-cream mb-5 tracking-[0.01em]">
            Key Characteristics
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            {characteristics.map((c) => (
              <div
                key={c.label}
                className="glass-card rounded-[10px] p-5 flex flex-col gap-2.5 transition-all duration-200 hover:shadow-[0_0_20px_rgba(29,118,130,0.2)] hover:-translate-y-0.5"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[0.7rem] font-bold tracking-[0.08em] uppercase text-cream-muted">
                    {c.label}
                  </span>
                  <span
                    className={`inline-block text-[0.7rem] font-semibold text-white ${c.badgeColor} rounded-full px-3 py-[3px] self-start ${c.badgeShadow} tracking-[0.03em]`}
                  >
                    {c.badge}
                  </span>
                </div>
                <p className="text-[0.85rem] text-cream-muted leading-[1.6] m-0">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Protocol Callout */}
        <section className="mb-10">
          <h2 className="font-sans text-xl font-bold text-cream mb-5 tracking-[0.01em]">
            Protocol for Broker Recruitment
          </h2>
          <div className="bg-amber-500/[0.15] border border-amber-500 border-l-4 rounded-lg px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[1.1rem]">&#9888;</span>
              <span className="text-[0.8rem] font-bold tracking-[0.07em] uppercase text-amber-400">
                Protocol-Permitted Data Only
              </span>
            </div>
            <p className="text-sm text-amber-400 leading-[1.65] mb-3.5">
              Farther operates under the Protocol for Broker Recruitment.
              Advisors leaving a protocol member firm may bring{" "}
              <strong>only</strong> the following:
            </p>
            <ol className="m-0 pl-5 flex flex-col gap-1">
              {protocolItems.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-amber-400 font-medium"
                >
                  {item}
                </li>
              ))}
            </ol>
            <p className="text-[0.85rem] text-amber-400 leading-[1.65] mt-3.5 mb-0">
              Advisors must verify their prior firm&rsquo;s protocol status
              before departure. Non-protocol situations require additional Legal
              review.
            </p>
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-10">
          <h2 className="font-sans text-xl font-bold text-cream mb-5 tracking-[0.01em]">
            Critical Timeline Sequencing
          </h2>
          <div className="flex flex-col">
            {timelineSteps.map((step, i) => (
              <div
                key={step.num}
                className="flex gap-5 relative"
              >
                {/* Left column: number + line */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-9 h-9 rounded-full bg-teal text-white flex items-center justify-center text-xs font-bold shrink-0 z-[1] shadow-[0_0_12px_rgba(78,112,130,0.4)]">
                    {step.num}
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-6 bg-cream-border my-1" />
                  )}
                </div>
                {/* Right column: content */}
                <div className={`pt-1 ${i < timelineSteps.length - 1 ? "pb-5" : ""}`}>
                  <p className="font-bold text-[0.95rem] text-cream mb-1">
                    {step.title}
                  </p>
                  <p className="text-sm text-cream-muted leading-[1.6]">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Common Pitfalls */}
        <section className="mb-4">
          <h2 className="font-sans text-xl font-bold text-cream mb-5 tracking-[0.01em]">
            Common Pitfalls
          </h2>
          <div className="glass-card rounded-[10px] px-6 py-5 transition-all duration-200 hover:shadow-[0_0_16px_rgba(239,68,68,0.12)]">
            <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
              {pitfalls.map((p, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-cream-muted leading-[1.6]"
                >
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-600 mt-[0.55rem]" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <QuizSection topicSlug="breakaway" topicTitle="Breakaway Pathway" />
      </div>
    </PageLayout>
  );
}
