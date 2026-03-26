import PageLayout from "@/components/PageLayout";

export default function MasterMergePage() {
  return (
    <PageLayout
      step={8}
      title="Master Merge"
      subtitle="Transition Method — Fastest Option (4–6 Weeks)"
      backHref="/no-to-low-aum"
      nextHref="/lpoa"
    >
      <div className="max-w-3xl">
        {/* At a glance */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Timeline", value: "4–6 Weeks" },
            { label: "Method", value: "Custodian-Level Merge" },
            { label: "Complexity", value: "High" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg p-5 border text-center"
              style={{ borderColor: "rgba(250,247,242,0.08)", backgroundColor: "#2f2f2f" }}
            >
              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "#155961" }}>
                {stat.label}
              </p>
              <p
                className="text-xl font-bold"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  color: "#FAF7F2",
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Coming Soon Banner */}
        <div
          className="rounded-xl p-8 border mb-8 text-center"
          style={{ backgroundColor: "#2a2a2a", borderColor: "rgba(250,247,242,0.08)" }}
        >
          <div className="text-5xl mb-4" style={{ color: "#1d7682" }}>◆</div>
          <h2
            className="text-2xl font-bold mb-3"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              color: "#FAF7F2",
            }}
          >
            Detailed Content Coming Soon
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "rgba(250,247,242,0.5)" }}>
            The Master Merge section will provide a complete step-by-step guide to
            executing the fastest available transition method, including custodian
            requirements, eligibility criteria, and the full workflow.
          </p>
        </div>

        {/* Preview */}
        <div
          className="rounded-lg p-6 border"
          style={{ borderColor: "rgba(250,247,242,0.08)", backgroundColor: "#2f2f2f" }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              color: "#FAF7F2",
            }}
          >
            What This Section Will Cover
          </h3>
          <ul className="space-y-3">
            {[
              "Eligibility criteria for Master Merge (custodian and account type requirements)",
              "Step-by-step custodian coordination process",
              "Account type considerations and exclusions",
              "Timeline milestones and dependency mapping",
              "Common failure points and how to resolve them",
              "Post-merge verification and reconciliation",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span style={{ color: "#1d7682", marginTop: "2px" }}>▸</span>
                <span className="text-sm" style={{ color: "#FAF7F2" }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageLayout>
  );
}
