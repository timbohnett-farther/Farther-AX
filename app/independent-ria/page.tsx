import PageLayout from "@/components/PageLayout";
import QuizSection from "@/components/QuizSection";

const characteristics = [
  {
    label: "Compliance Sensitivity",
    badge: "Lower",
    badgeColor: "bg-green-600",
    badgeShadow: "shadow-[0_0_10px_rgba(22,163,74,0.25)]",
    body: "No wirehouse non-solicitation concerns. The advisor owns their book and client relationships. Client communication is generally unrestricted.",
  },
  {
    label: "ADV-W Required",
    badge: "Within 90 Days",
    badgeColor: "bg-teal",
    badgeShadow: "shadow-[0_0_10px_rgba(78,112,130,0.25)]",
    body: "The advisor must file Form ADV-W (withdrawal of investment adviser registration) within 90 days of joining Farther. This formally dissolves their independent RIA registration with the SEC or state regulator.",
  },
  {
    label: "Dual vs. Non-Dual Registration",
    badge: "State-Dependent",
    badgeColor: "bg-violet-600",
    badgeShadow: "shadow-[0_0_10px_rgba(124,58,237,0.25)]",
    body: "Some states require dual registration (both SEC and state). The compliance requirements and ADV-W process differ based on the advisor's registration type and the states where their clients reside.",
  },
  {
    label: "Book Ownership",
    badge: "Advisor-Owned",
    badgeColor: "bg-sky-700",
    badgeShadow: "shadow-[0_0_10px_rgba(3,105,161,0.25)]",
    body: "Since the advisor owns their client relationships, the transition of clients to Farther is typically smoother than Breakaway. No protocol constraints apply.",
  },
];

const transitionConsiderations = [
  "Clients follow the advisor to Farther — inform clients of the move to Farther and the new custodian/account structure",
  "No protocol restrictions on client communication",
  "LPOA or Repaper/ACAT are the most common transition methods for Independent RIAs",
  "Master Merge is rare but possible depending on prior custodian arrangements",
];

export default function IndependentRIAPage() {
  return (
    <PageLayout
      step={5}
      totalSteps={13}
      title="Independent RIA"
      subtitle="Advisor Pathway — Independent Registered Investment Advisers"
      backHref="/breakaway"
      backLabel="Breakaway"
      nextHref="/ma"
      nextLabel="M&A"
    >
      <div className="max-w-[900px] mx-auto">
        {/* Intro */}
        <p className="text-cream-muted text-base leading-[1.75] mb-10 border-l-[3px] border-teal pl-4">
          The Independent RIA pathway applies to advisors who are already
          operating as registered independent investment advisers — meaning they
          own their own book of business and have their own SEC or state RIA
          registration. This is typically the{" "}
          <strong className="text-cream">
            lowest-risk pathway
          </strong>{" "}
          from a legal standpoint, but it has unique regulatory requirements
          that must be addressed promptly.
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

        {/* ADV-W Filing Callout */}
        <section className="mb-10">
          <h2 className="font-sans text-xl font-bold text-cream mb-5 tracking-[0.01em]">
            ADV-W Filing Requirements
          </h2>
          <div className="bg-blue-500/[0.15] border border-blue-500 border-l-4 rounded-lg px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[1.1rem] text-blue-500">&#8505;</span>
              <span className="text-[0.8rem] font-bold tracking-[0.07em] uppercase text-blue-400">
                90-Day Regulatory Deadline
              </span>
            </div>
            <p className="text-sm text-blue-400 leading-[1.7] m-0">
              Form ADV-W must be filed within{" "}
              <strong>90 days of the advisor&rsquo;s Go Live date</strong> on
              Farther. Failure to file creates a regulatory gap where the
              advisor is simultaneously registered as an independent RIA and
              affiliated with Farther. The AXM must track this deadline and
              confirm filing with the advisor and Compliance.
            </p>
          </div>
        </section>

        {/* Dual vs Non-Dual */}
        <section className="mb-10">
          <h2 className="font-sans text-xl font-bold text-cream mb-5 tracking-[0.01em]">
            Dual vs. Non-Dual Registration
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
            {/* Dual */}
            <div className="glass-card rounded-[10px] p-5 transition-all duration-200 hover:shadow-[0_0_16px_rgba(29,118,130,0.15)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-600 shrink-0 shadow-[0_0_12px_rgba(78,112,130,0.4)]" />
                <span className="font-bold text-[0.95rem] text-cream">
                  Dual Registration States
                </span>
              </div>
              <p className="text-sm text-cream-muted leading-[1.65] m-0">
                States like New York and California may require separate
                state-level registration in addition to SEC registration. ADV-W
                must be filed with both the SEC (via IARD) and the applicable
                state regulator.
              </p>
            </div>
            {/* Non-Dual */}
            <div className="glass-card rounded-[10px] p-5 transition-all duration-200 hover:shadow-[0_0_16px_rgba(29,118,130,0.15)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-600 shrink-0 shadow-[0_0_12px_rgba(78,112,130,0.4)]" />
                <span className="font-bold text-[0.95rem] text-cream">
                  Non-Dual Registration States
                </span>
              </div>
              <p className="text-sm text-cream-muted leading-[1.65] m-0">
                SEC-registered RIAs in these states only need to file with the
                SEC via IARD. State-level ADV-W is not required.
              </p>
            </div>
          </div>
        </section>

        {/* Transition Considerations */}
        <section className="mb-4">
          <h2 className="font-sans text-xl font-bold text-cream mb-5 tracking-[0.01em]">
            Transition Considerations
          </h2>
          <div className="glass-card rounded-[10px] px-6 py-5 transition-all duration-200 hover:shadow-[0_0_16px_rgba(29,118,130,0.15)]">
            <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
              {transitionConsiderations.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-cream-muted leading-[1.6]"
                >
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-teal mt-[0.55rem] shadow-[0_0_12px_rgba(78,112,130,0.4)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <QuizSection topicSlug="independent-ria" topicTitle="Independent RIA" />
      </div>
    </PageLayout>
  );
}
