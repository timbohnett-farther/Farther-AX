import PageLayout from "@/components/PageLayout";

export default function RepaperAcatPage() {
  return (
    <PageLayout
      step={10}
      title="Repaper / ACAT"
      subtitle="Transition Method — Full Re-Documentation (8-12 Weeks)"
      backHref="/lpoa"
      nextHref="/breakaway-process"
    >
      <div className="max-w-3xl">
        {/* At a glance */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Timeline", value: "8-12 Weeks" },
            { label: "Client Action", value: "Required" },
            { label: "Use Case", value: "Universal" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-lg p-5 text-center"
            >
              <p className="text-xs tracking-widest uppercase mb-1 text-teal-dark">
                {stat.label}
              </p>
              <p className="text-xl font-bold font-sans text-cream">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Coming Soon Banner */}
        <div className="glass-card-dark rounded-xl p-8 mb-8 text-center">
          <div className="text-5xl mb-4 text-teal">&#9670;</div>
          <h2 className="text-2xl font-bold font-sans text-cream mb-3">
            Detailed Content Coming Soon
          </h2>
          <p className="text-base leading-relaxed text-cream-muted">
            The Repaper / ACAT section will provide complete guidance for executing
            the most comprehensive transition method — including client paperwork
            workflows, ACAT submission procedures, and timeline management.
          </p>
        </div>

        {/* Preview */}
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold font-sans text-cream mb-4">
            What This Section Will Cover
          </h3>
          <ul className="space-y-3">
            {[
              "New account opening and client re-papering requirements",
              "ACAT submission process and DTCC requirements",
              "Managing client communication throughout the 8-12 week window",
              "Handling ACAT rejections and re-submissions",
              "Account type specific considerations (IRAs, trusts, entities)",
              "Coordinating with custodians on transfer scheduling",
              "Post-transfer reconciliation and account verification",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-teal mt-0.5">&#9656;</span>
                <span className="text-sm text-cream">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageLayout>
  );
}
