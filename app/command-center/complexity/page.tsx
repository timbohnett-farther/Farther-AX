"use client";

import { DataCard } from '@/components/ui';

/**
 * Complexity Education Page - Transition complexity scoring guide
 *
 * Migrated to Tailwind utilities and DataCard components
 */
export default function ComplexityEducationPage() {
  const tiers = [
    {
      tier: "Low",
      range: "0 – 25",
      color: "emerald",
      borderColor: "border-emerald-200",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      days: 45,
      desc: "Standard transition with minimal complexity. Any available AXM can manage. Standard process and timeline apply.",
    },
    {
      tier: "Moderate",
      range: "26 – 50",
      color: "amber",
      borderColor: "border-amber-200",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      days: 45,
      desc: "Some complexities detected — plan accordingly. Standard AXM assignment with CTM support. Monitor for escalation triggers.",
    },
    {
      tier: "High",
      range: "51 – 75",
      color: "red",
      borderColor: "border-red-200",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      days: 60,
      desc: "Significant complexity. Senior AXM recommended with dedicated CTM and bi-weekly progress reviews. Flag for leadership visibility.",
    },
    {
      tier: "Critical",
      range: "76 – 105",
      color: "purple",
      borderColor: "border-purple-200",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      days: 75,
      desc: "Maximum complexity. Dedicated senior AXM + AXA pair, CTM lead, extended weekly check-ins. Consider dual-CTM for asset transfer.",
    },
  ];

  const factors = [
    {
      name: "Transition Type",
      max: 15,
      category: "Transition",
      description:
        "How is the advisor moving their book? LPOA transitions (5 pts) are simplest. ACAT transfers (10 pts) involve automated account movement. Repaper (12 pts) requires re-documenting all accounts. Master Merge (15 pts) is the most complex — a full custodian-to-custodian migration.",
    },
    {
      name: "Transferable AUM",
      max: 20,
      category: "Scale",
      description:
        "Larger books require more coordination, more careful planning, and higher-touch service. Under $10M scores 2 pts; $10–50M scores 5 pts; $50–100M scores 10 pts; $100–250M scores 15 pts; $250M+ scores the full 20 pts.",
    },
    {
      name: "Households",
      max: 15,
      category: "Scale",
      description:
        "More households means more paperwork, more client communications, and longer timelines. Under 25 households (2 pts), 25–75 (5 pts), 75–150 (10 pts), 150+ (15 pts).",
    },
    {
      name: "Complex Asset Types",
      max: 20,
      category: "Assets",
      description:
        "Certain asset types require specialized handling. Each adds 5 points (capped at 20): 401(k) plans (plan-level coordination), Insurance/Annuities (carrier transfers, surrender schedules), Broker-Dealer assets (BD licensing complexities), and Alternative investments (illiquid holdings, special procedures).",
    },
    {
      name: "Firm Type & Covenants",
      max: 10,
      category: "Firm",
      description:
        "Where the advisor is departing from matters. Wirehouse departures (10 pts) carry non-compete risk and protocol considerations. IBDs (7 pts) have BD transfer complexities. RIA Owner (5 pts) involves business dissolution. RIA Employee (3 pts) is generally straightforward. Restrictive covenants add up to 3 additional points.",
    },
    {
      name: "Team Size & OBAs",
      max: 10,
      category: "Team",
      description:
        "Multi-advisor teams and outside business activities add coordination complexity. Solo advisors start at 0. Small teams (2 members) add 3 pts. Multi-advisor teams (2+ partners or 3+ total) add 7 pts. Large teams (3+ partners or 6+ total) add 10 pts. Active OBAs add up to 3 more points.",
    },
    {
      name: "Tech Stack",
      max: 5,
      category: "Technology",
      description:
        "More platforms mean more data migration work. We look at CRM, financial planning, performance reporting, TAMP, and other technology. 1 platform (1 pt), 2–3 platforms (3 pts), 4+ platforms (5 pts).",
    },
    {
      name: "Deal Velocity",
      max: 5,
      category: "Velocity",
      description:
        "How long has this deal been in the pipeline? Extended timelines may signal advisor hesitation, complex negotiations, or deep underlying complexity. Under 90 days (0 pts), 90–180 days (1 pt), 180–365 days (3 pts), 365+ days (5 pts).",
    },
    {
      name: "Notes & Qualitative Signals",
      max: 5,
      category: "Qualitative",
      description:
        "The system scans deal notes, transition notes, and descriptions for 30+ keywords indicating complexity: trust accounts, litigation, divorce, non-compete clauses, manual processing, VIP clients, held-away assets, and more. 1 signal (1 pt), 2–3 signals (3 pts), 4+ signals (5 pts). Prior transitions also add up to 2 points.",
    },
  ];

  const keywords = [
    "complex", "complicated", "high-touch", "vip", "sensitive",
    "litigation", "divorce", "estate", "trust", "multiple custodian",
    "held away", "outside business", "non-compete", "restrictive covenant",
    "protocol", "non-protocol", "manual", "custom", "529",
    "alternative", "annuity", "insurance", "illiquid", "option",
    "private placement", "reit", "limited partner",
  ];

  return (
    <main className="min-h-screen py-12 px-4 bg-cream font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase mb-2 text-teal">
            Command Center — Education
          </p>
          <h1 className="text-3xl font-light mb-3 text-charcoal font-serif">
            Transition Complexity Scoring
          </h1>
          <p className="text-sm leading-relaxed text-gray-600">
            The complexity score is an objective, data-driven rating that helps us staff transitions
            appropriately, set realistic timelines, and ensure every advisor gets the right resources
            from day one. Scores range from 0 to 105 and are computed automatically from HubSpot
            deal data, team records, and engagement notes.
          </p>
        </div>

        {/* Tiers */}
        <section className="mb-10">
          <h2 className="text-lg font-medium mb-4 text-charcoal font-serif">
            Score Tiers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tiers.map((t) => (
              <DataCard
                key={t.tier}
                className={`border-2 ${t.borderColor}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${t.bgColor}`} />
                  <span className={`text-sm font-semibold ${t.textColor}`}>
                    {t.tier}
                  </span>
                  <span className="text-xs ml-auto text-gray-500">
                    {t.range} pts
                  </span>
                </div>
                <p className="text-xs leading-relaxed mb-2 text-gray-700">
                  {t.desc}
                </p>
                <p className="text-xs text-gray-500">
                  Estimated graduation: {t.days} days
                </p>
              </DataCard>
            ))}
          </div>
        </section>

        {/* Scoring Factors */}
        <section className="mb-10">
          <h2 className="text-lg font-medium mb-4 text-charcoal font-serif">
            Scoring Factors
          </h2>
          <p className="text-sm mb-6 text-gray-600">
            The score is additive — each factor contributes independently. The final score is the
            sum of all nine factors.
          </p>
          <div className="space-y-4">
            {factors.map((factor) => (
              <DataCard key={factor.name}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-semibold text-charcoal">
                    {factor.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-cream-dark text-gray-600">
                    {factor.category}
                  </span>
                  <span className="text-xs ml-auto font-mono text-teal">
                    0 – {factor.max} pts
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-gray-700">
                  {factor.description}
                </p>
              </DataCard>
            ))}
          </div>
        </section>

        {/* How It's Used */}
        <section className="mb-10">
          <h2 className="text-lg font-medium mb-4 text-charcoal font-serif">
            How Complexity Scores Are Used
          </h2>
          <DataCard>
            <div className="space-y-4 text-sm text-gray-700">
              <p>
                <span className="font-semibold text-charcoal">Staffing Decisions</span>{" "}
                — The tier directly informs which AXM, CTM, and support staff should be assigned.
                Critical transitions get senior staff and dedicated pairs; Low complexity can be
                handled by any available team member.
              </p>
              <p>
                <span className="font-semibold text-charcoal">Timeline Planning</span>{" "}
                — Each tier has a recommended graduation timeline. Low/Moderate transitions target
                45 days. High complexity extends to 60 days. Critical transitions plan for 75 days.
                The launch timer on the pipeline dashboard reflects these extended targets.
              </p>
              <p>
                <span className="font-semibold text-charcoal">Pipeline Visibility</span>{" "}
                — The complexity badge appears in the pipeline table so leadership can spot
                high-complexity deals at a glance. The advisor detail page shows a full factor
                breakdown so AXMs understand exactly what&apos;s driving the score.
              </p>
              <p>
                <span className="font-semibold text-charcoal">Recalculation</span>{" "}
                — Scores are recalculated whenever the pipeline data refreshes. As new information is
                added to a deal in HubSpot — new notes, updated properties, team data — the score
                automatically adjusts. There is no manual scoring; the system reads directly from
                HubSpot.
              </p>
            </div>
          </DataCard>
        </section>

        {/* Keywords Reference */}
        <section className="mb-10">
          <h2 className="text-lg font-medium mb-4 text-charcoal font-serif">
            Note Keywords Reference
          </h2>
          <p className="text-sm mb-4 text-gray-600">
            The following keywords in deal notes, transition notes, and descriptions trigger
            qualitative complexity signals:
          </p>
          <DataCard>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-xs px-2 py-1 rounded font-mono bg-cream-dark text-gray-600 border border-cream-border"
                >
                  {kw}
                </span>
              ))}
            </div>
          </DataCard>
        </section>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-cream-border">
          <p className="text-xs text-gray-500">
            Complexity scoring is an evolving system. As we refine the algorithm based on real
            transition outcomes, weights and thresholds may be adjusted.
          </p>
        </div>
      </div>
    </main>
  );
}
