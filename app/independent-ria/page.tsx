'use client';

import { useTheme } from '@/lib/theme-provider';
import PageLayout from "@/components/PageLayout";
import QuizSection from "@/components/QuizSection";

// Badge colors will be applied from THEME in the component
const characteristics = [
  {
    label: "Compliance Sensitivity",
    badge: "Lower",
    colorKey: "teal" as const,
    body: "No wirehouse non-solicitation concerns. The advisor owns their book and client relationships. Client communication is generally unrestricted.",
  },
  {
    label: "ADV-W Required",
    badge: "Within 90 Days",
    colorKey: "steel" as const,
    body: "The advisor must file Form ADV-W (withdrawal of investment adviser registration) within 90 days of joining Farther. This formally dissolves their independent RIA registration with the SEC or state regulator.",
  },
  {
    label: "Dual vs. Non-Dual Registration",
    badge: "State-Dependent",
    colorKey: "gold" as const,
    body: "Some states require dual registration (both SEC and state). The compliance requirements and ADV-W process differ based on the advisor's registration type and the states where their clients reside.",
  },
  {
    label: "Book Ownership",
    badge: "Advisor-Owned",
    colorKey: "teal" as const,
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
  const { THEME } = useTheme();

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
            color: THEME.colors.textSecondary,
            fontSize: "1rem",
            lineHeight: "1.75",
            marginBottom: "2.5rem",
            borderLeft: `3px solid ${THEME.colors.teal}`,
            paddingLeft: "1rem",
          }}
        >
          The Independent RIA pathway applies to advisors who are already
          operating as registered independent investment advisers — meaning they
          own their own book of business and have their own SEC or state RIA
          registration. This is typically the{" "}
          <strong style={{ color: THEME.colors.text }}>
            lowest-risk pathway
          </strong>{" "}
          from a legal standpoint, but it has unique regulatory requirements
          that must be addressed promptly.
        </p>

        {/* Key Characteristics */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: THEME.colors.text,
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
                className="transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `1px solid ${THEME.colors.border}`,
                  borderRadius: "10px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                  boxShadow: `0 0 0 ${THEME.colors.teal}00`,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 20px ${THEME.colors.teal}33`}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = `0 0 0 ${THEME.colors.teal}00`}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: THEME.colors.textSecondary,
                    }}
                  >
                    {c.label}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "#fff",
                      backgroundColor: THEME.colors[c.colorKey],
                      borderRadius: "9999px",
                      padding: "3px 12px",
                      alignSelf: "flex-start",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {c.badge}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: THEME.colors.textSecondary,
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
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: THEME.colors.text,
              marginBottom: "1.25rem",
              letterSpacing: "0.01em",
            }}
          >
            ADV-W Filing Requirements
          </h2>
          <div
            style={{
              backgroundColor: THEME.colors.infoBg,
              border: `1px solid ${THEME.colors.info}`,
              borderLeft: `4px solid ${THEME.colors.info}`,
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
              <span style={{ fontSize: "1.1rem", color: THEME.colors.info }}>&#8505;</span>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: THEME.colors.sereneAqua400,
                }}
              >
                90-Day Regulatory Deadline
              </span>
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                color: THEME.colors.sereneAqua400,
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
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: THEME.colors.text,
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
              className="transition-all duration-200 hover:shadow-[0_0_16px_rgba(29,118,130,0.15)]"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
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
                    backgroundColor: THEME.colors.gold,
                    flexShrink: 0,
                    boxShadow: `0 0 12px ${THEME.colors.teal}66`,
                  }}
                />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: THEME.colors.text,
                  }}
                >
                  Dual Registration States
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: THEME.colors.textSecondary,
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
              className="transition-all duration-200 hover:shadow-[0_0_16px_rgba(29,118,130,0.15)]"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
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
                    backgroundColor: THEME.colors.teal,
                    flexShrink: 0,
                    boxShadow: `0 0 12px ${THEME.colors.teal}66`,
                  }}
                />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: THEME.colors.text,
                  }}
                >
                  Non-Dual Registration States
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: THEME.colors.textSecondary,
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
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: THEME.colors.text,
              marginBottom: "1.25rem",
              letterSpacing: "0.01em",
            }}
          >
            Transition Considerations
          </h2>
          <div
            className="transition-all duration-200 hover:shadow-[0_0_16px_rgba(29,118,130,0.15)]"
            style={{
              backgroundColor: THEME.colors.surface,
              border: `1px solid ${THEME.colors.border}`,
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
                    color: THEME.colors.textSecondary,
                    lineHeight: "1.6",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: THEME.colors.teal,
                      marginTop: "0.55rem",
                      boxShadow: "0 0 12px rgba(29, 118, 130, 0.4)",
                    }}
                  />
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
