import PageLayout from "@/components/PageLayout";

const phases = [
  { num: "1", name: "Initial Assessment", lead: "M&A Strategist", question: "Is this a strategic fit? Go/No-Go for full diligence?" },
  { num: "2", name: "Financial Deep Dive", lead: "Financial Due Diligence", question: "Is the revenue real, sustainable, and clean?" },
  { num: "3", name: "Regulatory & Compliance Review", lead: "Regulatory Architect", question: "Any legal landmines? ADV issues? Exam history?" },
  { num: "4", name: "Operations & Technology", lead: "Tech & Ops Analyst", question: "How hard is the tech migration? What does it cost?" },
  { num: "5", name: "Client & Advisor Analysis", lead: "Client Relationship Strategist", question: "Will clients and advisors stay?" },
  { num: "6", name: "Integration Planning", lead: "Project Manager", question: "What does Day 1 through Month 12 look like?" },
];

const complianceTimeline = [
  { days: "Days 0\u20135", title: "Pre-Onboarding", items: "Prior registrations, licenses, CRD review, U4 preparation, background checks" },
  { days: "Days 5\u201310", title: "Conflicts & Disclosures", items: "OBA disclosures, personal trading accounts, Code of Ethics acknowledgment" },
  { days: "Days 10\u201320", title: "Mandatory Training", items: "Cybersecurity, compliance fundamentals, email/social media rules \u2014 with timestamped completion records" },
  { days: "Days 20\u201325", title: "Policy Attestations", items: "Handbook, cybersecurity policy, BCP, advertising rules" },
  { days: "Days 25\u201330", title: "Supervisory Sign-Off", items: "Supervisor approval, full archive of onboarding file for exam review" },
];

const fartherCompliance = [
  { issue: "Marketing Rule Compliance", detail: "Acquired advisors may have used testimonials, hypothetical performance, or social media in ways that don\u2019t comply with SEC Marketing Rule requirements" },
  { issue: "Cybersecurity & Data Transfer", detail: "Farther\u2019s platform is a closed-loop encrypted ecosystem. Client data from acquired firms must be migrated into this ecosystem \u2014 not held in third-party systems" },
  { issue: "Custody Rule", detail: "Confirm the acquired RIA\u2019s custody arrangements are properly disclosed and structured before migration begins" },
  { issue: "Fiduciary Standard Alignment", detail: "Any acquired firm with commission-based compensation structures requires careful review to ensure alignment with Farther\u2019s fiduciary model" },
];

const regFlags = [
  "Unresolved SEC exam deficiencies \u2014 must be remediated before closing or on a defined timeline",
  "Client complaint or arbitration history \u2014 pattern complaints suggest systemic service issues",
  "State registration complexity \u2014 multi-state RIAs have layered filing requirements beyond SEC mandates",
  "Insurance coverage gaps \u2014 E&O, Cyber, and Fiduciary coverage must be confirmed and transitioned",
];

const techAdvantages = [
  { label: "Home-built platform", desc: "No stitched-together vendor stack \u2014 fewer breaking points during migration" },
  { label: "AI Proposal tool", desc: "Acquired advisors can generate personalized client proposals in under 10 minutes" },
  { label: "Closed-loop data", desc: "All client data stays within Farther\u2019s encrypted infrastructure; no third-party re-entry required" },
  { label: "3x efficiency", desc: "Advisors can manage books 3x larger than industry average due to workflow gains" },
];

const techRisks = [
  "Vendor lock-in at the acquired firm \u2014 legacy CRM or portfolio management contracts may have expensive breakage clauses",
  "Data integrity during migration \u2014 account history, client notes, and preferences must transfer cleanly",
  "Cybersecurity posture \u2014 past breaches or vulnerabilities discovered post-close become Farther\u2019s liability",
  "Custodian transitions are among the highest-risk moments for client attrition",
];

const financialFlags = [
  "Advisors claiming higher AUM, revenue, or client count than disclosed in due diligence",
  "Unusual billing arrangements or fee structures that don\u2019t align with the disclosed fee schedule",
  "Clients expressing surprise at fees or services they say they were never told about",
];

const complianceFlags = [
  "Advisors referencing undisclosed activities (outside business activities, side arrangements)",
  "Marketing materials, testimonials, or social media posts that weren\u2019t reviewed pre-deal",
  "Any mention of client complaints, disputes, or informal settlements not disclosed pre-close",
];

const culturalFlags = [
  "Advisor dissatisfaction with Farther\u2019s fiduciary model or technology requirements",
  "Key person dependencies \u2014 if one advisor holds 80%+ of client relationships, disengagement is catastrophic",
  "Client relationships that appear transactional rather than advisory \u2014 higher attrition risk",
];

const glossary = [
  { term: "AUM", def: "Assets Under Management \u2014 the primary value driver of any RIA book" },
  { term: "Form ADV", def: "RIA registration document; contains disclosure of services, fees, conflicts, and exam history" },
  { term: "Form CRS", def: "Client Relationship Summary \u2014 required for SEC-registered RIAs serving retail investors" },
  { term: "Earnout", def: "Deferred purchase price contingent on post-close performance metrics like AUM and client retention" },
  { term: "OBA", def: "Outside Business Activity \u2014 any activity outside the advisor\u2019s primary registration that must be disclosed" },
  { term: "U4", def: "FINRA registration form for individual advisors \u2014 must be filed and clean before activation" },
  { term: "Warm Handoff", def: "Transition model where selling advisor introduces successor advisor directly to clients over time" },
  { term: "CRD", def: "Central Registration Depository \u2014 FINRA\u2019s database of advisor registration and disciplinary history" },
  { term: "Fiduciary Standard", def: "Legal obligation to act in the client\u2019s best interest \u2014 Farther\u2019s non-negotiable baseline" },
  { term: "IARD", def: "Investment Adviser Registration Depository \u2014 the SEC/state filing system for RIA registration" },
];

function SectionHeader({ part, title }: { part: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 mt-12 first:mt-0">
      <span className="inline-flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-teal text-white text-xs font-bold shadow-[0_0_12px_rgba(29,118,130,0.4)]">
        {part}
      </span>
      <h2 className="font-serif text-xl text-cream font-bold tracking-tight">{title}</h2>
    </div>
  );
}

function Callout({ children, color = "teal" }: { children: React.ReactNode; color?: "teal" | "amber" | "red" }) {
  const colors = {
    teal: { bg: "rgba(29,118,130,0.08)", border: "rgba(29,118,130,0.4)", text: "text-teal", glow: "rgba(29,118,130,0.15)" },
    amber: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.4)", text: "text-amber-400", glow: "rgba(245,158,11,0.15)" },
    red: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", text: "text-red-400", glow: "rgba(239,68,68,0.12)" },
  };
  const c = colors[color];
  return (
    <div
      className="rounded-lg px-5 py-4 mb-6"
      style={{ backgroundColor: c.bg, borderLeft: `4px solid ${c.border}`, boxShadow: `0 0 12px ${c.glow}` }}
    >
      <p className={`text-sm leading-relaxed ${c.text}`}>{children}</p>
    </div>
  );
}

function FlagList({ title, badge, badgeColor, items }: { title: string; badge: string; badgeColor: string; items: string[] }) {
  return (
    <div className="glass-card rounded-xl p-6 transition-all duration-200 hover:shadow-[0_0_20px_rgba(29,118,130,0.2)]">
      <div className="flex items-center gap-3 mb-4">
        <h4 className="font-serif text-base text-cream font-semibold">{title}</h4>
        <span
          className="text-[10px] font-semibold tracking-wider uppercase text-white px-3 py-1 rounded-full"
          style={{ backgroundColor: badgeColor, boxShadow: `0 0 10px ${badgeColor}50` }}
        >
          {badge}
        </span>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-cream-muted leading-relaxed">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: badgeColor }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MAPage() {
  return (
    <PageLayout
      step={6}
      title="M&A"
      subtitle="Advisor Pathway \u2014 Mergers & Acquisitions"
      backHref="/independent-ria"
      nextHref="/no-to-low-aum"
    >
      <div className="max-w-4xl mx-auto">
        {/* Hero / Why This Matters */}
        <div className="glass-card rounded-2xl px-8 py-8 mb-8">
          <h2 className="font-serif text-2xl text-cream mb-4">
            Why This Matters at <span className="text-gold">Farther</span>
          </h2>
          <p className="text-sm text-cream-muted leading-7">
            Farther&rsquo;s growth strategy is built on combining top-tier advisor talent with proprietary
            technology &mdash; and RIA acquisitions are a meaningful accelerant to that mission. When Farther
            brings on an acquired book of business, the Advisor Experience and Onboarding team sits at the
            intersection of every workstream: compliance, technology migration, client retention, and cultural
            integration. Understanding the fundamentals of RIA acquisitions isn&rsquo;t optional &mdash;
            it&rsquo;s how this team protects the firm, the advisors, and most importantly, the clients.
          </p>
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* Part 1: How Farther Evaluates an RIA */}
        <SectionHeader part="1" title="How Farther Evaluates an RIA Before We Buy" />
        <p className="text-sm text-cream-muted leading-7 mb-6">
          Before our team touches a deal, it has already gone through a rigorous six-phase evaluation process.
          Knowing where a deal stands in this pipeline helps the Onboarding team anticipate what&rsquo;s coming
          and prepare accordingly.
        </p>

        {/* Phase cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {phases.map((p) => (
            <div
              key={p.num}
              className="glass-card rounded-xl p-5 transition-all duration-200 hover:shadow-[0_0_20px_rgba(29,118,130,0.2)] hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal text-white text-xs font-bold shadow-[0_0_10px_rgba(29,118,130,0.3)]">
                  {p.num}
                </span>
                <h4 className="font-serif text-sm text-cream font-semibold leading-snug">{p.name}</h4>
              </div>
              <p className="text-[11px] text-gold-dark uppercase tracking-wider font-medium mb-1.5">{p.lead}</p>
              <p className="text-xs text-cream-muted leading-relaxed">{p.question}</p>
            </div>
          ))}
        </div>

        <Callout>
          By the time the Advisor Experience team is activated, Phases 1&ndash;5 are largely complete.{" "}
          <strong className="text-cream">Your work begins in earnest at Phase 6</strong> &mdash; and everything
          you do either validates or undermines the thesis built in Phases 1&ndash;5.
        </Callout>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* Part 2: Deal Structure */}
        <SectionHeader part="2" title="Understanding the Deal Structure" />

        <div className="glass-card rounded-xl p-6 mb-6">
          <h3 className="font-serif text-base text-cream font-semibold mb-3">How RIA Acquisitions Are Valued</h3>
          <p className="text-sm text-cream-muted leading-7">
            RIA books of business are typically valued as a multiple of recurring revenue or seller&rsquo;s
            discretionary earnings. A proper valuation accounts for revenue quality, client demographics, tenure,
            attrition risk, and numerous other factors. No two books are identical &mdash; context matters enormously.
          </p>
        </div>

        <h3 className="font-serif text-base text-cream font-semibold mb-4">
          Earnouts: The Deal Structure You&rsquo;ll Encounter Most
        </h3>
        <p className="text-sm text-cream-muted leading-7 mb-5">
          Nearly every RIA acquisition at scale includes an <strong className="text-cream">earnout</strong>, where
          a portion of the purchase price is deferred and paid based on post-close performance. This is critically
          important for the Onboarding team to understand because{" "}
          <strong className="text-cream">how we handle the transition directly affects whether earnout targets are met.</strong>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            { label: "20\u201335%", sub: "of total purchase price now structured as earnout" },
            { label: "1\u20133 years", sub: "typical earnout period; beyond 3 years creates strain" },
            { label: "AUM + Revenue", sub: "common performance triggers alongside client retention" },
            { label: "Buyer obligation", sub: "failure to deliver promised support can legally impair earnout" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-lg p-4 transition-all duration-200 hover:shadow-[0_0_16px_rgba(29,118,130,0.15)]">
              <p className="font-serif text-lg text-teal font-bold mb-1">{s.label}</p>
              <p className="text-xs text-cream-muted leading-relaxed">{s.sub}</p>
            </div>
          ))}
        </div>

        <Callout color="amber">
          <strong className="text-amber-300">Onboarding team takeaway:</strong> A delayed technology migration,
          a poor client communication rollout, or a rocky first 90 days can directly reduce earnout payments &mdash;
          and damage Farther&rsquo;s reputation as an acquirer.
        </Callout>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* Part 3: Compliance */}
        <SectionHeader part="3" title="Compliance \u2014 What the Onboarding Team Must Know" />
        <p className="text-sm text-cream-muted leading-7 mb-6">
          Compliance is the highest-stakes area for any RIA acquisition. Errors here have regulatory, financial,
          and reputational consequences.
        </p>

        {/* Form ADV */}
        <div className="glass-card rounded-xl p-6 mb-6 transition-all duration-200 hover:shadow-[0_0_16px_rgba(29,118,130,0.15)]">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="font-serif text-base text-cream font-semibold">Form ADV &mdash; The Foundation</h3>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-white bg-teal px-3 py-1 rounded-full shadow-[0_0_10px_rgba(29,118,130,0.3)]">
              Core Document
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { part: "Part 1", desc: "Statistical firm data \u2014 AUM, structure, investment strategies, examination history" },
              { part: "Part 2A", desc: "Brochure \u2014 narrative disclosure of services, fees, conflicts of interest, and personnel" },
              { part: "Part 2B", desc: "Brochure Supplement \u2014 background on key advisory personnel" },
              { part: "Part 3 / CRS", desc: "Client Relationship Summary for SEC-registered firms serving retail investors" },
            ].map((a) => (
              <div key={a.part} className="flex items-start gap-3 bg-white/[0.03] rounded-lg px-4 py-3">
                <span className="text-[10px] font-bold tracking-wider uppercase text-teal bg-teal/15 px-2.5 py-1 rounded-full shrink-0 shadow-[0_0_6px_rgba(29,118,130,0.2)]">
                  {a.part}
                </span>
                <p className="text-xs text-cream-muted leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-cream-muted leading-relaxed">
            <strong className="text-cream">Why it matters for onboarding:</strong> When Farther acquires an RIA,
            the acquired firm&rsquo;s ADV must be updated or superseded. Clients must receive updated disclosure
            documents. Any material changes trigger re-disclosure obligations.
          </p>
        </div>

        {/* Regulatory Red Flags */}
        <h3 className="font-serif text-base text-cream font-semibold mb-4">Regulatory Red Flags to Know Before Day 1</h3>
        <div className="space-y-2.5 mb-6">
          {regFlags.map((f, i) => (
            <div key={i} className="flex items-start gap-3 glass-card rounded-lg px-5 py-3">
              <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold shadow-[0_0_6px_rgba(239,68,68,0.2)]">
                !
              </span>
              <p className="text-sm text-cream-muted leading-relaxed">{f}</p>
            </div>
          ))}
        </div>

        {/* 30-Day Timeline */}
        <h3 className="font-serif text-base text-cream font-semibold mb-4">The 30-Day Advisor Onboarding Compliance Standard</h3>
        <p className="text-sm text-cream-muted leading-7 mb-5">
          Documentation must be complete, accessible, and defensible before the advisor is deployed. SEC and state
          examiners do not accept partial onboarding as a defense.
        </p>
        <div className="space-y-0 mb-6">
          {complianceTimeline.map((step, i) => (
            <div key={step.days} className="flex gap-4 relative">
              {/* Left: dot + line */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center text-[10px] font-bold z-10 shadow-[0_0_12px_rgba(29,118,130,0.4)]"
                >
                  {i + 1}
                </div>
                {i < complianceTimeline.length - 1 && (
                  <div className="w-px flex-1 min-h-[1rem]" style={{ backgroundColor: "rgba(29,118,130,0.2)" }} />
                )}
              </div>
              {/* Right: content */}
              <div className="pb-5 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-teal bg-teal/15 px-2.5 py-0.5 rounded-full shadow-[0_0_6px_rgba(29,118,130,0.2)]">
                    {step.days}
                  </span>
                  <span className="text-sm font-semibold text-cream">{step.title}</span>
                </div>
                <p className="text-xs text-cream-muted leading-relaxed">{step.items}</p>
              </div>
            </div>
          ))}
        </div>

        <Callout color="red">
          <strong className="text-red-300">Slow onboarding is not an operational nuisance</strong> &mdash;
          it is a compliance failure vector.
        </Callout>

        {/* Farther-Specific Compliance */}
        <h3 className="font-serif text-base text-cream font-semibold mb-4">Special Compliance Concerns at Farther</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {fartherCompliance.map((c) => (
            <div key={c.issue} className="glass-card rounded-xl p-5 transition-all duration-200 hover:shadow-[0_0_20px_rgba(29,118,130,0.2)] hover:-translate-y-0.5">
              <h4 className="text-sm text-cream font-semibold mb-2">{c.issue}</h4>
              <p className="text-xs text-cream-muted leading-relaxed">{c.detail}</p>
            </div>
          ))}
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* Part 4: Client Retention */}
        <SectionHeader part="4" title="Client Retention \u2014 The Metric That Drives Everything" />
        <p className="text-sm text-cream-muted leading-7 mb-6">
          Client retention is the single most important post-acquisition metric. Earnout payments depend on it.
          Farther&rsquo;s reputation as an acquirer depends on it.
        </p>

        {/* Retention stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { value: "86\u201394%+", label: "Well-executed transition retention" },
            { value: "97%", label: "5-year RIA client retention baseline" },
            { value: "19%", label: "Avg attrition from poor custodian transitions" },
            { value: "6\u20139 mo", label: "Pivotal retention window post-acquisition" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-lg p-4 text-center transition-all duration-200 hover:shadow-[0_0_16px_rgba(29,118,130,0.15)]">
              <p className="font-serif text-xl text-teal font-bold mb-1">{s.value}</p>
              <p className="text-[10px] text-cream-muted leading-snug uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* What drives retention */}
        <h3 className="font-serif text-base text-cream font-semibold mb-4">What Actually Drives Retention</h3>
        <div className="space-y-2.5 mb-6">
          {[
            "Communicate with clients before anyone else does \u2014 don\u2019t let news travel through the grapevine",
            "Keep messaging consistent across all clients \u2014 every touchpoint reinforces the same narrative",
            "Frame the transition around client benefit \u2014 better technology, more personalized planning, stronger support",
            "Get clients into Farther\u2019s service rhythm (reviews, communications, events) as fast as possible",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 glass-card rounded-lg px-5 py-3">
              <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold shadow-[0_0_6px_rgba(16,185,129,0.2)]">
                {i + 1}
              </span>
              <p className="text-sm text-cream-muted leading-relaxed">{item}</p>
            </div>
          ))}
        </div>

        {/* Warm Handoff */}
        <div className="glass-card rounded-xl p-6 mb-6 transition-all duration-200 hover:shadow-[0_0_20px_rgba(29,118,130,0.2)]">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-serif text-base text-cream font-semibold">The Warm Handoff Standard</h3>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-white bg-emerald-600 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              Gold Standard
            </span>
          </div>
          <ul className="space-y-2.5 mb-4">
            {[
              "Joint meetings with the seller during the transition period build trust before the seller steps back",
              "Negotiate seller participation in the transition as part of deal terms \u2014 this directly protects retention and earnout performance",
              "Use Farther\u2019s technology \u2014 CRM tracking, automated follow-up workflows, and the AI-powered proposal tool \u2014 to ensure no client is overlooked",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-cream-muted leading-relaxed">
                <span className="text-emerald-400 mt-0.5 shrink-0">&#9670;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Callout>
          <strong className="text-cream">The client doesn&rsquo;t follow the firm &mdash; they follow the mechanic.</strong>{" "}
          The job is to make sure they understand Farther&rsquo;s team <em>is</em> their mechanic going forward.
        </Callout>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* Part 5: Technology */}
        <SectionHeader part="5" title="Technology Integration \u2014 Farther\u2019s Competitive Advantage" />

        <h3 className="font-serif text-base text-cream font-semibold mb-4">What Makes Farther&rsquo;s Tech Stack Different</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {techAdvantages.map((t) => (
            <div key={t.label} className="glass-card rounded-xl p-5 transition-all duration-200 hover:shadow-[0_0_20px_rgba(29,118,130,0.2)] hover:-translate-y-0.5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-teal shadow-[0_0_6px_rgba(29,118,130,0.4)]" />
                <h4 className="text-sm text-cream font-semibold">{t.label}</h4>
              </div>
              <p className="text-xs text-cream-muted leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>

        <h3 className="font-serif text-base text-cream font-semibold mb-4">Technology Migration Risks to Manage</h3>
        <div className="space-y-2.5 mb-8">
          {techRisks.map((r, i) => (
            <div key={i} className="flex items-start gap-3 glass-card rounded-lg px-5 py-3">
              <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold shadow-[0_0_6px_rgba(245,158,11,0.2)]">
                !
              </span>
              <p className="text-sm text-cream-muted leading-relaxed">{r}</p>
            </div>
          ))}
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* Part 6: Red Flags */}
        <SectionHeader part="6" title="Red Flags Onboarding Should Escalate Immediately" />
        <p className="text-sm text-cream-muted leading-7 mb-6">
          The onboarding team is often the first to interact with acquired advisors and clients at a human level.
          This gives the team unique visibility into issues that due diligence may not have surfaced.{" "}
          <strong className="text-cream">Escalate immediately if you observe:</strong>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <FlagList title="Financial" badge="Escalate" badgeColor="#DC2626" items={financialFlags} />
          <FlagList title="Compliance" badge="Escalate" badgeColor="#D97706" items={complianceFlags} />
          <FlagList title="Cultural" badge="Monitor" badgeColor="#7C3AED" items={culturalFlags} />
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* Quick Reference: Key Terms */}
        <div className="border-t border-cream-border pt-8 mt-8 mb-8">
          <h2 className="font-serif text-xl text-cream font-bold mb-6">Quick Reference: Key Terms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {glossary.map((g) => (
              <div key={g.term} className="flex items-start gap-3 bg-white/[0.03] rounded-lg px-4 py-3">
                <span className="text-[10px] font-bold tracking-wider uppercase text-teal bg-teal/15 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap shadow-[0_0_6px_rgba(29,118,130,0.2)]">
                  {g.term}
                </span>
                <p className="text-xs text-cream-muted leading-relaxed">{g.def}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* North Star */}
        <div className="glass-card-dark rounded-2xl px-8 py-8 text-center">
          <p className="text-[10px] text-gold-dark uppercase tracking-[0.2em] font-semibold mb-3">
            The Onboarding Team&rsquo;s North Star
          </p>
          <p className="font-serif text-lg text-cream leading-relaxed max-w-3xl mx-auto mb-4">
            Making the transition so seamless for clients and advisors that they never question
            their decision to be part of <span className="text-gold">Farther</span>.
          </p>
          <p className="text-sm text-cream-muted leading-7 max-w-3xl mx-auto">
            That means compliance documentation that holds up under exam scrutiny, technology that works from
            Day 1, communication that is personal and proactive, and a culture introduction that makes advisors
            feel they&rsquo;ve upgraded &mdash; not just changed firms.
          </p>
          <div className="mt-5 h-px w-24 mx-auto bg-gold opacity-40" />
          <p className="mt-4 text-xs text-gold font-medium tracking-wide">
            The deals are won in due diligence. The value is created &mdash; or destroyed &mdash; in onboarding.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
