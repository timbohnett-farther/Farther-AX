import PageLayout from "@/components/PageLayout";

export default function RepaperAcatPage() {
  return (
    <PageLayout
      step={10}
      title="Repaper / ACAT"
      subtitle="Transition Method — Full Re-Documentation (8–12 Weeks)"
      backHref="/lpoa"
      nextHref="/breakaway-process"
    >
      <div className="max-w-3xl">
        {/* At a glance */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Timeline", value: "8–12 Weeks" },
            { label: "Client Action", value: "Required" },
            { label: "Use Case", value: "Universal" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg p-5 border text-center"
              style={{ borderColor: "#D8CFC4", backgroundColor: "rgba(255,255,255,0.5)" }}
            >
              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "#9A7A62" }}>
                {stat.label}
              </p>
              <p
                className="text-xl font-bold"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  color: "#2D2D2D",
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
          style={{ backgroundColor: "#EDE7DF", borderColor: "#D8CFC4" }}
        >
          <div className="text-5xl mb-4" style={{ color: "#B8977E" }}>◆</div>
          <h2
            className="text-2xl font-bold mb-3"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "#2D2D2D",
            }}
          >
            Detailed Content Coming Soon
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "#6B6B6B" }}>
            The Repaper / ACAT section will provide complete guidance for executing
            the most comprehensive transition method — including client paperwork
            workflows, ACAT submission procedures, and timeline management.
          </p>
        </div>

        {/* Preview */}
        <div
          className="rounded-lg p-6 border"
          style={{ borderColor: "#D8CFC4", backgroundColor: "rgba(255,255,255,0.5)" }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "#2D2D2D",
            }}
          >
            What This Section Will Cover
          </h3>
          <ul className="space-y-3">
            {[
              "New account opening and client re-papering requirements",
              "ACAT submission process and DTCC requirements",
              "Managing client communication throughout the 8–12 week window",
              "Handling ACAT rejections and re-submissions",
              "Account type specific considerations (IRAs, trusts, entities)",
              "Coordinating with custodians on transfer scheduling",
              "Post-transfer reconciliation and account verification",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span style={{ color: "#B8977E", marginTop: "2px" }}>▸</span>
                <span className="text-sm" style={{ color: "#4A4A4A" }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageLayout>
  );
}
