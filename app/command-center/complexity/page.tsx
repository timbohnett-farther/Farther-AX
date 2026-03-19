"use client";

export default function ComplexityEducationPage() {
  return (
    <main
      className="min-h-screen py-12 px-4"
      style={{ background: "#FAF7F2", fontFamily: "'Fakt', system-ui, sans-serif" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#1d7682" }}>
            Command Center — Education
          </p>
          <h1
            className="text-3xl font-light mb-3"
            style={{ color: "#333", fontFamily: "'ABC Arizona Text', Georgia, serif" }}
          >
            Transition Complexity Scoring
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
            The complexity score is an objective, data-driven rating that helps us staff transitions
            appropriately, set realistic timelines, and ensure every advisor gets the right resources
            from day one. Scores range from 0 to 105 and are computed automatically from HubSpot
            deal data, team records, and engagement notes.
          </p>
        </div>

        {/* Tiers */}
        <section className="mb-10">
          <h2
            className="text-lg font-medium mb-4"
            style={{ color: "#333", fontFamily: "'ABC Arizona Text', Georgia, serif" }}
          >
            Score Tiers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                tier: "Low",
                range: "0 – 25",
                color: "#27ae60",
                days: 45,
                desc: "Standard transition with minimal complexity. Any available AXM can manage. Standard process and timeline apply.",
              },
              {
                tier: "Moderate",
                range: "26 – 50",
                color: "#b27d2e",
                days: 45,
                desc: "Some complexities detected — plan accordingly. Standard AXM assignment with CTM support. Monitor for escalation triggers.",
              },
              {
                tier: "High",
                range: "51 – 75",
                color: "#c0392b",
                days: 60,
                desc: "Significant complexity. Senior AXM recommended with dedicated CTM and bi-weekly progress reviews. Flag for leadership visibility.",
              },
              {
                tier: "Critical",
                range: "76 – 105",
                color: "#8e44ad",
                days: 75,
                desc: "Maximum complexity. Dedicated senior AXM + AXA pair, CTM lead, extended weekly check-ins. Consider dual-CTM for asset transfer.",
              },
            ].map((t) => (
              <div
                key={t.tier}
                className="rounded-lg p-5"
                style={{ background: "white", border: `2px solid ${t.color}20` }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ background: t.color }}
                  />
                  <span className="text-sm font-semibold" style={{ color: t.color }}>
                    {t.tier}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: "#999" }}>
                    {t.range} pts
                  </span>
                </div>
                <p className="text-xs leading-relaxed mb-2" style={{ color: "#555" }}>
                  {t.desc}
                </p>
                <p className="text-xs" style={{ color: "#999" }}>
                  Estimated graduation: {t.days} days
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Scoring Factors */}
        <section className="mb-10">
          <h2
            className="text-lg font-medium mb-4"
            style={{ color: "#333", fontFamily: "'ABC Arizona Text', Georgia, serif" }}
          >
            Scoring Factors
          </h2>
          <p className="text-sm mb-6" style={{ color: "#666" }}>
            The score is additive — each factor contributes independently. The final score is the
            sum of all nine factors.
          </p>
          <div className="space-y-4">
            {[
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
            ].map((factor) => (
              <div
                key={factor.name}
                className="rounded-lg p-5"
                style={{ background: "white", border: "1px solid #e5e0d8" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-semibold" style={{ color: "#333" }}>
                    {factor.name}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: "#f0ede8", color: "#888" }}
                  >
                    {factor.category}
                  </span>
                  <span className="text-xs ml-auto font-mono" style={{ color: "#1d7682" }}>
                    0 – {factor.max} pts
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#555" }}>
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How It's Used */}
        <section className="mb-10">
          <h2
            className="text-lg font-medium mb-4"
            style={{ color: "#333", fontFamily: "'ABC Arizona Text', Georgia, serif" }}
          >
            How Complexity Scores Are Used
          </h2>
          <div
            className="rounded-lg p-6"
            style={{ background: "white", border: "1px solid #e5e0d8" }}
          >
            <div className="space-y-4 text-sm" style={{ color: "#555" }}>
              <p>
                <span className="font-semibold" style={{ color: "#333" }}>Staffing Decisions</span>{" "}
                — The tier directly informs which AXM, CTM, and support staff should be assigned.
                Critical transitions get senior staff and dedicated pairs; Low complexity can be
                handled by any available team member.
              </p>
              <p>
                <span className="font-semibold" style={{ color: "#333" }}>Timeline Planning</span>{" "}
                — Each tier has a recommended graduation timeline. Low/Moderate transitions target
                45 days. High complexity extends to 60 days. Critical transitions plan for 75 days.
                The launch timer on the pipeline dashboard reflects these extended targets.
              </p>
              <p>
                <span className="font-semibold" style={{ color: "#333" }}>Pipeline Visibility</span>{" "}
                — The complexity badge appears in the pipeline table so leadership can spot
                high-complexity deals at a glance. The advisor detail page shows a full factor
                breakdown so AXMs understand exactly what&apos;s driving the score.
              </p>
              <p>
                <span className="font-semibold" style={{ color: "#333" }}>Recalculation</span>{" "}
                — Scores are recalculated whenever the pipeline data refreshes. As new information is
                added to a deal in HubSpot — new notes, updated properties, team data — the score
                automatically adjusts. There is no manual scoring; the system reads directly from
                HubSpot.
              </p>
            </div>
          </div>
        </section>

        {/* Keywords Reference */}
        <section className="mb-10">
          <h2
            className="text-lg font-medium mb-4"
            style={{ color: "#333", fontFamily: "'ABC Arizona Text', Georgia, serif" }}
          >
            Note Keywords Reference
          </h2>
          <p className="text-sm mb-4" style={{ color: "#666" }}>
            The following keywords in deal notes, transition notes, and descriptions trigger
            qualitative complexity signals:
          </p>
          <div
            className="rounded-lg p-5"
            style={{ background: "white", border: "1px solid #e5e0d8" }}
          >
            <div className="flex flex-wrap gap-2">
              {[
                "complex", "complicated", "high-touch", "vip", "sensitive",
                "litigation", "divorce", "estate", "trust", "multiple custodian",
                "held away", "outside business", "non-compete", "restrictive covenant",
                "protocol", "non-protocol", "manual", "custom", "529",
                "alternative", "annuity", "insurance", "illiquid", "option",
                "private placement", "reit", "limited partner",
              ].map((kw) => (
                <span
                  key={kw}
                  className="text-xs px-2 py-1 rounded font-mono"
                  style={{ background: "#f5f0ea", color: "#666", border: "1px solid #e5e0d8" }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-6 border-t" style={{ borderColor: "#e5e0d8" }}>
          <p className="text-xs" style={{ color: "#999" }}>
            Complexity scoring is an evolving system. As we refine the algorithm based on real
            transition outcomes, weights and thresholds may be adjusted.
          </p>
        </div>
      </div>
    </main>
  );
}
