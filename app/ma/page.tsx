'use client';

import PageLayout from '@/components/PageLayout';
export default function MAPage() {

  const phases = [
    { num: '1', name: 'Initial Assessment', lead: 'M&A Strategist', question: 'Is this a strategic fit? Go/No-Go for full diligence?' },
    { num: '2', name: 'Financial Deep Dive', lead: 'Financial Due Diligence', question: 'Is the revenue real, sustainable, and clean?' },
    { num: '3', name: 'Regulatory & Compliance Review', lead: 'Regulatory Architect', question: 'Any legal landmines? ADV issues? Exam history?' },
    { num: '4', name: 'Operations & Technology', lead: 'Tech & Ops Analyst', question: 'How hard is the tech migration? What does it cost?' },
    { num: '5', name: 'Client & Advisor Analysis', lead: 'Client Relationship Strategist', question: 'Will clients and advisors stay?' },
    { num: '6', name: 'Integration Planning', lead: 'Project Manager', question: 'What does Day 1 through Month 12 look like?' },
  ];

  const complianceTimeline = [
    { days: 'Days 0–5', title: 'Pre-Onboarding', items: 'Prior registrations, licenses, CRD review, U4 preparation, background checks' },
    { days: 'Days 5–10', title: 'Conflicts & Disclosures', items: 'OBA disclosures, personal trading accounts, Code of Ethics acknowledgment' },
    { days: 'Days 10–20', title: 'Mandatory Training', items: 'Cybersecurity, compliance fundamentals, email/social media rules — with timestamped completion records' },
    { days: 'Days 20–25', title: 'Policy Attestations', items: 'Handbook, cybersecurity policy, BCP, advertising rules' },
    { days: 'Days 25–30', title: 'Supervisory Sign-Off', items: 'Supervisor approval, full archive of onboarding file for exam review' },
  ];

  const retentionStats = [
    { value: '86–94%+', label: 'Well-executed transition retention' },
    { value: '97%', label: '5-year RIA client retention baseline' },
    { value: '19%', label: 'Avg attrition from poor custodian transitions' },
    { value: '6–9 mo', label: 'Pivotal retention window post-acquisition' },
  ];

  const glossary = [
    { term: 'AUM', def: 'Assets Under Management — the primary value driver of any RIA book' },
    { term: 'Form ADV', def: 'RIA registration document; contains disclosure of services, fees, conflicts, and exam history' },
    { term: 'Form CRS', def: 'Client Relationship Summary — required for SEC-registered RIAs serving retail investors' },
    { term: 'Earnout', def: 'Deferred purchase price contingent on post-close performance metrics like AUM and client retention' },
    { term: 'OBA', def: 'Outside Business Activity — any activity outside the advisor\'s primary registration that must be disclosed' },
    { term: 'U4', def: 'FINRA registration form for individual advisors — must be filed and clean before activation' },
    { term: 'Warm Handoff', def: 'Transition model where selling advisor introduces successor advisor directly to clients over time' },
    { term: 'CRD', def: 'Central Registration Depository — FINRA\'s database of advisor registration and disciplinary history' },
    { term: 'Fiduciary Standard', def: 'Legal obligation to act in the client\'s best interest — Farther\'s non-negotiable baseline' },
    { term: 'IARD', def: 'Investment Adviser Registration Depository — the SEC/state filing system for RIA registration' },
  ];

  return (
    <PageLayout
      step={6}
      title="M&A"
      subtitle="Advisor Pathway — Mergers & Acquisitions"
      backHref="/independent-ria"
      nextHref="/no-to-low-aum"
      nextLabel="Next: No to Low AUM"
    >
      <div className="max-w-5xl mx-auto">

        {/* Why This Matters */}
        <div
          className="rounded-xl p-8 mb-12"
          style={{
            backgroundColor: THEME.colors.surface,
            border: `1px solid ${THEME.colors.border}`,
          }}
        >
          <h2 className="text-2xl font-bold mb-4" style={{ color: THEME.colors.text }}>
            Why This Matters at <span style={{ color: THEME.colors.teal }}>Farther</span>
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
            Farther's growth strategy is built on combining top-tier advisor talent with proprietary
            technology — and RIA acquisitions are a meaningful accelerant to that mission. When Farther
            brings on an acquired book of business, the Advisor Experience and Onboarding team sits at the
            intersection of every workstream: compliance, technology migration, client retention, and cultural
            integration. Understanding the fundamentals of RIA acquisitions isn't optional —
            it's how this team protects the firm, the advisors, and most importantly, the clients.
          </p>
        </div>

        {/* Part 1: Evaluation Phases */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: THEME.colors.teal, color: '#FFFFFF' }}
            >
              1
            </div>
            <h2 className="text-2xl font-bold" style={{ color: THEME.colors.text }}>
              How Farther Evaluates an RIA Before We Buy
            </h2>
          </div>
          <p className="text-sm leading-relaxed mb-6" style={{ color: THEME.colors.textSecondary }}>
            Before our team touches a deal, it has already gone through a rigorous six-phase evaluation process.
            Knowing where a deal stands in this pipeline helps the Onboarding team anticipate what's coming
            and prepare accordingly.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {phases.map((p) => (
              <div
                key={p.num}
                className="rounded-xl p-6"
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `1px solid ${THEME.colors.border}`,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: THEME.colors.teal, color: '#FFFFFF' }}
                  >
                    {p.num}
                  </div>
                  <h4 className="text-sm font-semibold" style={{ color: THEME.colors.text }}>
                    {p.name}
                  </h4>
                </div>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: THEME.colors.gold }}>
                  {p.lead}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                  {p.question}
                </p>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: THEME.colors.surface,
              border: `1px solid ${THEME.colors.teal}`,
              borderLeft: `4px solid ${THEME.colors.teal}`,
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
              By the time the Advisor Experience team is activated, Phases 1–5 are largely complete.{' '}
              <strong>Your work begins in earnest at Phase 6</strong> — and everything
              you do either validates or undermines the thesis built in Phases 1–5.
            </p>
          </div>
        </div>

        {/* Part 2: Deal Structure */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: THEME.colors.teal, color: '#FFFFFF' }}
            >
              2
            </div>
            <h2 className="text-2xl font-bold" style={{ color: THEME.colors.text }}>
              Understanding the Deal Structure
            </h2>
          </div>

          <h3 className="text-lg font-bold mb-4" style={{ color: THEME.colors.text }}>
            Earnouts: The Deal Structure You'll Encounter Most
          </h3>
          <p className="text-sm leading-relaxed mb-6" style={{ color: THEME.colors.textSecondary }}>
            Nearly every RIA acquisition at scale includes an <strong>earnout</strong>, where
            a portion of the purchase price is deferred and paid based on post-close performance. This is critically
            important for the Onboarding team to understand because{' '}
            <strong>how we handle the transition directly affects whether earnout targets are met.</strong>
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              { label: '20–35%', sub: 'of total purchase price now structured as earnout' },
              { label: '1–3 years', sub: 'typical earnout period; beyond 3 years creates strain' },
              { label: 'AUM + Revenue', sub: 'common performance triggers alongside client retention' },
              { label: 'Buyer obligation', sub: 'failure to deliver promised support can legally impair earnout' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-6"
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `1px solid ${THEME.colors.border}`,
                }}
              >
                <p className="text-xl font-bold mb-1" style={{ color: THEME.colors.teal }}>
                  {s.label}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                  {s.sub}
                </p>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: THEME.colors.surface,
              border: `1px solid ${THEME.colors.gold}`,
              borderLeft: `4px solid ${THEME.colors.gold}`,
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
              <strong style={{ color: THEME.colors.gold }}>Onboarding team takeaway:</strong> A delayed technology migration,
              a poor client communication rollout, or a rocky first 90 days can directly reduce earnout payments —
              and damage Farther's reputation as an acquirer.
            </p>
          </div>
        </div>

        {/* Part 3: Compliance */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: THEME.colors.teal, color: '#FFFFFF' }}
            >
              3
            </div>
            <h2 className="text-2xl font-bold" style={{ color: THEME.colors.text }}>
              Compliance — What the Onboarding Team Must Know
            </h2>
          </div>
          <p className="text-sm leading-relaxed mb-6" style={{ color: THEME.colors.textSecondary }}>
            Compliance is the highest-stakes area for any RIA acquisition. Errors here have regulatory, financial,
            and reputational consequences.
          </p>

          <h3 className="text-lg font-bold mb-4" style={{ color: THEME.colors.text }}>
            The 30-Day Advisor Onboarding Compliance Standard
          </h3>
          <p className="text-sm leading-relaxed mb-6" style={{ color: THEME.colors.textSecondary }}>
            Documentation must be complete, accessible, and defensible before the advisor is deployed. SEC and state
            examiners do not accept partial onboarding as a defense.
          </p>

          <div className="space-y-0 mb-6">
            {complianceTimeline.map((step, i) => (
              <div key={step.days} className="flex gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: THEME.colors.teal, color: '#FFFFFF' }}
                  >
                    {i + 1}
                  </div>
                  {i < complianceTimeline.length - 1 && (
                    <div
                      className="w-px flex-1 min-h-8"
                      style={{ backgroundColor: THEME.colors.border }}
                    />
                  )}
                </div>
                <div className="pb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-bold uppercase px-3 py-1 rounded-full"
                      style={{ backgroundColor: THEME.colors.teal, color: '#FFFFFF' }}
                    >
                      {step.days}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: THEME.colors.text }}>
                      {step.title}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                    {step.items}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: THEME.colors.surface,
              border: `1px solid ${THEME.colors.gold}`,
              borderLeft: `4px solid ${THEME.colors.gold}`,
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
              <strong style={{ color: THEME.colors.gold }}>Slow onboarding is not an operational nuisance</strong> —
              it is a compliance failure vector.
            </p>
          </div>
        </div>

        {/* Part 4: Client Retention */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: THEME.colors.teal, color: '#FFFFFF' }}
            >
              4
            </div>
            <h2 className="text-2xl font-bold" style={{ color: THEME.colors.text }}>
              Client Retention — The Metric That Drives Everything
            </h2>
          </div>
          <p className="text-sm leading-relaxed mb-6" style={{ color: THEME.colors.textSecondary }}>
            Client retention is the single most important post-acquisition metric. Earnout payments depend on it.
            Farther's reputation as an acquirer depends on it.
          </p>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {retentionStats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-6 text-center"
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `1px solid ${THEME.colors.border}`,
                }}
              >
                <p className="text-2xl font-bold mb-2" style={{ color: THEME.colors.teal }}>
                  {s.value}
                </p>
                <p className="text-xs uppercase tracking-wide" style={{ color: THEME.colors.textSecondary }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold mb-4" style={{ color: THEME.colors.text }}>
            What Actually Drives Retention
          </h3>
          <ul className="space-y-3 mb-6">
            {[
              'Communicate with clients before anyone else does — don\'t let news travel through the grapevine',
              'Keep messaging consistent across all clients — every touchpoint reinforces the same narrative',
              'Frame the transition around client benefit — better technology, more personalized planning, stronger support',
              'Get clients into Farther\'s service rhythm (reviews, communications, events) as fast as possible',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                <span style={{ color: THEME.colors.teal }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: THEME.colors.surface,
              border: `1px solid ${THEME.colors.teal}`,
              borderLeft: `4px solid ${THEME.colors.teal}`,
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
              <strong>The client doesn't follow the firm — they follow the mechanic.</strong>{' '}
              The job is to make sure they understand Farther's team <em>is</em> their mechanic going forward.
            </p>
          </div>
        </div>

        {/* Part 5: Technology */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: THEME.colors.teal, color: '#FFFFFF' }}
            >
              5
            </div>
            <h2 className="text-2xl font-bold" style={{ color: THEME.colors.text }}>
              Technology Integration — Farther's Competitive Advantage
            </h2>
          </div>

          <h3 className="text-lg font-bold mb-4" style={{ color: THEME.colors.text }}>
            What Makes Farther's Tech Stack Different
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              { label: 'Home-built platform', desc: 'No stitched-together vendor stack — fewer breaking points during migration' },
              { label: 'AI Proposal tool', desc: 'Acquired advisors can generate personalized client proposals in under 10 minutes' },
              { label: 'Closed-loop data', desc: 'All client data stays within Farther\'s encrypted infrastructure; no third-party re-entry required' },
              { label: '3x efficiency', desc: 'Advisors can manage books 3x larger than industry average due to workflow gains' },
            ].map((t) => (
              <div
                key={t.label}
                className="rounded-xl p-6"
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `1px solid ${THEME.colors.border}`,
                }}
              >
                <h4 className="text-sm font-semibold mb-2" style={{ color: THEME.colors.text }}>
                  {t.label}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                  {t.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Part 6: Red Flags */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: THEME.colors.teal, color: '#FFFFFF' }}
            >
              6
            </div>
            <h2 className="text-2xl font-bold" style={{ color: THEME.colors.text }}>
              Red Flags Onboarding Should Escalate Immediately
            </h2>
          </div>
          <p className="text-sm leading-relaxed mb-6" style={{ color: THEME.colors.textSecondary }}>
            The onboarding team is often the first to interact with acquired advisors and clients at a human level.
            This gives the team unique visibility into issues that due diligence may not have surfaced.{' '}
            <strong>Escalate immediately if you observe:</strong>
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'Financial', items: [
                'Advisors claiming higher AUM, revenue, or client count than disclosed in due diligence',
                'Unusual billing arrangements or fee structures that don\'t align with the disclosed fee schedule',
                'Clients expressing surprise at fees or services they say they were never told about',
              ]},
              { title: 'Compliance', items: [
                'Advisors referencing undisclosed activities (outside business activities, side arrangements)',
                'Marketing materials, testimonials, or social media posts that weren\'t reviewed pre-deal',
                'Any mention of client complaints, disputes, or informal settlements not disclosed pre-close',
              ]},
              { title: 'Cultural', items: [
                'Advisor dissatisfaction with Farther\'s fiduciary model or technology requirements',
                'Key person dependencies — if one advisor holds 80%+ of client relationships, disengagement is catastrophic',
                'Client relationships that appear transactional rather than advisory — higher attrition risk',
              ]},
            ].map((section) => (
              <div
                key={section.title}
                className="rounded-xl p-6"
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `1px solid ${THEME.colors.border}`,
                }}
              >
                <h4 className="text-sm font-bold mb-4" style={{ color: THEME.colors.text }}>
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                      <span style={{ color: THEME.colors.gold }}>•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Glossary */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6" style={{ color: THEME.colors.text }}>
            Quick Reference: Key Terms
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {glossary.map((g) => (
              <div
                key={g.term}
                className="rounded-xl p-4"
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `1px solid ${THEME.colors.border}`,
                }}
              >
                <span
                  className="text-xs font-bold uppercase px-3 py-1 rounded-full"
                  style={{ backgroundColor: THEME.colors.teal, color: '#FFFFFF' }}
                >
                  {g.term}
                </span>
                <p className="text-xs leading-relaxed mt-2" style={{ color: THEME.colors.textSecondary }}>
                  {g.def}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* North Star */}
        <div
          className="rounded-xl p-8 text-center mb-12"
          style={{
            backgroundColor: THEME.colors.surface,
            border: `1px solid ${THEME.colors.border}`,
          }}
        >
          <p className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: THEME.colors.gold }}>
            The Onboarding Team's North Star
          </p>
          <p className="text-lg leading-relaxed mb-4" style={{ color: THEME.colors.text }}>
            Making the transition so seamless for clients and advisors that they never question
            their decision to be part of <span style={{ color: THEME.colors.teal }}>Farther</span>.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
            That means compliance documentation that holds up under exam scrutiny, technology that works from
            Day 1, communication that is personal and proactive, and a culture introduction that makes advisors
            feel they've upgraded — not just changed firms.
          </p>
          <div className="mt-6 h-px w-24 mx-auto" style={{ backgroundColor: THEME.colors.teal }} />
          <p className="mt-4 text-xs font-medium" style={{ color: THEME.colors.teal }}>
            The deals are won in due diligence. The value is created — or destroyed — in onboarding.
          </p>
        </div>

      </div>
    </PageLayout>
  );
}
