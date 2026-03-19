import PageLayout from "@/components/PageLayout";

const COLORS = {
  charcoal: "#333333",
  charcoalMuted: "#5b6a71",
  gold: "#1d7682",
  cream: "#ffffff",
  creamDark: "#f0f5f9",
  creamBorder: "#dde8f0",
  blueBg: "#EFF6FF",
  blueBorder: "#3B82F6",
  blueText: "#1E40AF",
};

const characteristics = [
  {
    label: "Compliance Sensitivity",
    badge: "Lower",
    badgeColor: "#16A34A",
    body: "No wirehouse non-solicitation concerns. The advisor owns their book and client relationships. Client communication is generally unrestricted.",
  },
  {
    label: "ADV-W Required",
    badge: "Within 90 Days",
    badgeColor: "#1d7682",
    body: "The advisor must file Form ADV-W (withdrawal of investment adviser registration) within 90 days of joining Farther. This formally dissolves their independent RIA registration with the SEC or state regulator.",
  },
  {
    label: "Dual vs. Non-Dual Registration",
    badge: "State-Dependent",
    badgeColor: "#7C3AED",
    body: "Some states require dual registration (both SEC and state). The compliance requirements and ADV-W process differ based on the advisor's registration type and the states where their clients reside.",
  },
  {
    label: "Book Ownership",
    badge: "Advisor-Owned",
    badgeColor: "#0369A1",
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
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Intro */}
        <p
          style={{
            color: COLORS.charcoalMuted,
            fontSize: "1rem",
            lineHeight: "1.75",
            marginBottom: "2.5rem",
            borderLeft: `3px solid ${COLORS.gold}`,
            paddingLeft: "1rem",
          }}
        >
          The Independent RIA pathway applies to advisors who are already
          operating as registered independent investment advisers — meaning they
          own their own book of business and have their own SEC or state RIA
          registration. This is typically the{" "}
          <strong style={{ color: COLORS.charcoal }}>
            lowest-risk pathway
          </strong>{" "}
          from a legal standpoint, but it has unique regulatory requirements
          that must be addressed promptly.
        </p>

        {/* Key Characteristics */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: COLORS.charcoal,
              marginBottom: "1.25rem",
              letterSpacing: "0.01em",
            }}
          >
            Key Characteristics
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {characteristics.map((c) => (
              <div
                key={c.label}
                style={{
                  backgroundColor: "#fff",
                  border: `1px solid ${COLORS.creamBorder}`,
                  borderRadius: "10px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: COLORS.charcoalMuted,
                    }}
                  >
                    {c.label}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#fff",
                      backgroundColor: c.badgeColor,
                      borderRadius: "4px",
                      padding: "2px 8px",
                      alignSelf: "flex-start",
                    }}
                  >
                    {c.badge}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: COLORS.charcoalMuted,
                    lineHeight: "1.6",
                    margin: 0,
                  }}
                >
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ADV-W Filing Callout */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: COLORS.charcoal,
              marginBottom: "1.25rem",
              letterSpacing: "0.01em",
            }}
          >
            ADV-W Filing Requirements
          </h2>
          <div
            style={{
              backgroundColor: COLORS.blueBg,
              border: `1px solid ${COLORS.blueBorder}`,
              borderLeft: `4px solid ${COLORS.blueBorder}`,
              borderRadius: "8px",
              padding: "1.25rem 1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <span style={{ fontSize: "1.1rem", color: COLORS.blueBorder }}>&#8505;</span>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: COLORS.blueText,
                }}
              >
                90-Day Regulatory Deadline
              </span>
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                color: COLORS.blueText,
                lineHeight: "1.7",
                margin: 0,
              }}
            >
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
        <section style={{ marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: COLORS.charcoal,
              marginBottom: "1.25rem",
              letterSpacing: "0.01em",
            }}
          >
            Dual vs. Non-Dual Registration
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {/* Dual */}
            <div
              style={{
                backgroundColor: "#fff",
                border: `1px solid ${COLORS.creamBorder}`,
                borderRadius: "10px",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: "#7C3AED",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: COLORS.charcoal,
                  }}
                >
                  Dual Registration States
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: COLORS.charcoalMuted,
                  lineHeight: "1.65",
                  margin: 0,
                }}
              >
                States like New York and California may require separate
                state-level registration in addition to SEC registration. ADV-W
                must be filed with both the SEC (via IARD) and the applicable
                state regulator.
              </p>
            </div>
            {/* Non-Dual */}
            <div
              style={{
                backgroundColor: "#fff",
                border: `1px solid ${COLORS.creamBorder}`,
                borderRadius: "10px",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: "#16A34A",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: COLORS.charcoal,
                  }}
                >
                  Non-Dual Registration States
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: COLORS.charcoalMuted,
                  lineHeight: "1.65",
                  margin: 0,
                }}
              >
                SEC-registered RIAs in these states only need to file with the
                SEC via IARD. State-level ADV-W is not required.
              </p>
            </div>
          </div>
        </section>

        {/* Transition Considerations */}
        <section style={{ marginBottom: "1rem" }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: COLORS.charcoal,
              marginBottom: "1.25rem",
              letterSpacing: "0.01em",
            }}
          >
            Transition Considerations
          </h2>
          <div
            style={{
              backgroundColor: "#fff",
              border: `1px solid ${COLORS.creamBorder}`,
              borderRadius: "10px",
              padding: "1.25rem 1.5rem",
            }}
          >
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
              }}
            >
              {transitionConsiderations.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.625rem",
                    fontSize: "0.875rem",
                    color: COLORS.charcoalMuted,
                    lineHeight: "1.6",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: COLORS.gold,
                      marginTop: "0.55rem",
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
