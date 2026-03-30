'use client';

import { useTheme } from '@/lib/theme-provider';
import PageLayout from "@/components/PageLayout";
import QuizSection from "@/components/QuizSection";

const characteristics = [
  {
    label: "Compliance Sensitivity",
    badge: "High",
    colorKey: "gold" as const,
    body: "Non-solicitation and non-compete agreements are common. Advisors may face legal action from their prior firm if they contact clients before resignation. AXM and Legal must be briefed before any advisor communication goes out.",
  },
  {
    label: "U4 Timing",
    badge: "Hold Until Resignation",
    colorKey: "teal" as const,
    body: "The U4 registration form must NOT be submitted until after the advisor has formally resigned. Submitting early creates a trackable FINRA event that can alert the prior firm prematurely.",
  },
  {
    label: "Client Communication",
    badge: "Restricted Pre-Resignation",
    colorKey: "gold" as const,
    body: "Under the Protocol for Broker Recruitment, advisors may take only client names, addresses, phone numbers, email, and account titles. Any broader client data extraction is prohibited. Advisors should consult their prior firm's protocol membership status.",
  },
  {
    label: "Resignation Required",
    badge: "Mandatory First Step",
    colorKey: "steel" as const,
    body: "The advisor must formally resign before the Farther onboarding can fully proceed. The AXM coordinates timing with the advisor and Legal to minimize exposure and ensure the transition is clean.",
  },
];

const protocolItems = [
  "Client name",
  "Address",
  "Phone number",
  "Email address",
  "Account title",
];

const timelineSteps = [
  {
    num: "01",
    title: "Deal Signed",
    body: "AXM assigned. Legal briefed. NCL reviewed. No client contact yet.",
  },
  {
    num: "02",
    title: "Pre-Resignation Phase",
    body: "All Farther tech access and training completed in stealth. IAA and Exhibit B signed. U4 prepared but held.",
  },
  {
    num: "03",
    title: "Resignation Day",
    body: "Advisor formally resigns. U4 submitted immediately. Client notification letters prepared for same-day or next-day delivery.",
  },
  {
    num: "04",
    title: "Post-Resignation",
    body: "Client outreach begins per protocol. Transition method initiated. Custodian paperwork submitted.",
  },
  {
    num: "05",
    title: "Go Live",
    body: "Advisor is active on Farther platform. Transitions running in parallel.",
  },
];

const pitfalls = [
  "Submitting U4 before resignation — creates FINRA event, alerts prior firm",
  "Client outreach before resignation — non-solicitation violation risk",
  "Taking client data beyond protocol list — grounds for injunctive relief",
  "Failing to check prior firm's protocol membership status",
  "Not briefing Farther Legal before advisor communicates any transition plans",
];

export default function BreakawayPage() {
  const { THEME } = useTheme();

  return (
    <PageLayout
      step={4}
      totalSteps={13}
      title="Breakaway"
      subtitle="Advisor Pathway — Wirehouse & Captive Firm Departures"
      backHref="/key-documents"
      backLabel="Key Documents"
      nextHref="/independent-ria"
      nextLabel="Independent RIA"
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
          The Breakaway pathway applies to advisors departing a wirehouse
          (Merrill Lynch, Morgan Stanley, UBS, Wells Fargo, Raymond James, etc.)
          or other captive firm to join Farther. This pathway carries the{" "}
          <strong style={{ color: THEME.colors.text }}>
            highest compliance sensitivity
          </strong>{" "}
          of all four onboarding paths. Every step must be carefully sequenced
          to protect the advisor, protect Farther, and avoid triggering
          unnecessary legal action from the departing firm.
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
                className="transition-all duration-200"
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `1px solid ${THEME.colors.border}`,
                  borderRadius: "10px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                  boxShadow: '0 0 0 transparent',
                  transform: 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 20px ${THEME.colors.teal}33`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
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

        {/* Protocol Callout */}
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
            Protocol for Broker Recruitment
          </h2>
          <div
            style={{
              backgroundColor: THEME.colors.warningBg,
              border: `1px solid ${THEME.colors.warning}`,
              borderLeft: `4px solid ${THEME.colors.warning}`,
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
              <span style={{ fontSize: "1.1rem" }}>&#9888;</span>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: THEME.colors.warning,
                }}
              >
                Protocol-Permitted Data Only
              </span>
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                color: THEME.colors.warning,
                lineHeight: "1.65",
                marginBottom: "0.875rem",
              }}
            >
              Farther operates under the Protocol for Broker Recruitment.
              Advisors leaving a protocol member firm may bring{" "}
              <strong>only</strong> the following:
            </p>
            <ol
              style={{
                margin: 0,
                paddingLeft: "1.4rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
              }}
            >
              {protocolItems.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "0.875rem",
                    color: THEME.colors.warning,
                    fontWeight: 500,
                  }}
                >
                  {item}
                </li>
              ))}
            </ol>
            <p
              style={{
                fontSize: "0.85rem",
                color: THEME.colors.warning,
                lineHeight: "1.65",
                marginTop: "0.875rem",
                marginBottom: 0,
              }}
            >
              Advisors must verify their prior firm&rsquo;s protocol status
              before departure. Non-protocol situations require additional Legal
              review.
            </p>
          </div>
        </section>

        {/* Timeline */}
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
            Critical Timeline Sequencing
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {timelineSteps.map((step, i) => (
              <div
                key={step.num}
                style={{
                  display: "flex",
                  gap: "1.25rem",
                  position: "relative",
                }}
              >
                {/* Left column: number + line */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: "2.25rem",
                      height: "2.25rem",
                      borderRadius: "50%",
                      backgroundColor: THEME.colors.teal,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      flexShrink: 0,
                      zIndex: 1,
                      boxShadow: `0 0 12px ${THEME.colors.teal}66`,
                    }}
                  >
                    {step.num}
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div
                      style={{
                        width: "2px",
                        flex: 1,
                        minHeight: "1.5rem",
                        backgroundColor: THEME.colors.border,
                        margin: "0.25rem 0",
                      }}
                    />
                  )}
                </div>
                {/* Right column: content */}
                <div
                  style={{
                    paddingBottom: i < timelineSteps.length - 1 ? "1.25rem" : 0,
                    paddingTop: "0.25rem",
                  }}
                >
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: THEME.colors.text,
                      margin: "0 0 0.25rem 0",
                    }}
                  >
                    {step.title}
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: THEME.colors.textSecondary,
                      lineHeight: "1.6",
                      margin: 0,
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Common Pitfalls */}
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
            Common Pitfalls
          </h2>
          <div
            className="transition-all duration-200"
            style={{
              backgroundColor: THEME.colors.surface,
              border: `1px solid ${THEME.colors.border}`,
              borderRadius: "10px",
              padding: "1.25rem 1.5rem",
              boxShadow: '0 0 0 transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 16px ${THEME.colors.gold}1A`}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 transparent'}
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
              {pitfalls.map((p, i) => (
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
                      backgroundColor: THEME.colors.gold,
                      marginTop: "0.55rem",
                    }}
                  />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <QuizSection topicSlug="breakaway" topicTitle="Breakaway Pathway" />
      </div>
    </PageLayout>
  );
}
