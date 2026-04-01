'use client';

import PageLayout from '@/components/PageLayout';
export default function IndependentRIAPage() {

  return (
    <PageLayout
      step={5}
      title="Independent RIA"
      subtitle="Advisor Pathway — Independent Registered Investment Advisers"
      backHref="/breakaway"
      nextHref="/ma"
      nextLabel="Next: M&A"
    >
      <div className="max-w-5xl mx-auto">
        {/* Intro */}
        <p
          className="text-base leading-relaxed mb-12"
        >
          The Independent RIA pathway applies to advisors who are already operating as registered
          independent investment advisers — meaning they own their own book of business and have their own
          SEC or state RIA registration. This is typically the <strong>lowest-risk pathway</strong> from a
          legal standpoint, but it has unique regulatory requirements that must be addressed promptly.
        </p>

        {/* ADV-W Filing */}
        <div
          className="rounded-xl p-8 mb-12"
          style={{
            border: `1px solid ${THEME.colors.teal}`,
            borderLeft: `4px solid ${THEME.colors.teal}`,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">ℹ️</span>
            <span
              className="text-xs uppercase tracking-wider font-bold"
              className="text-[#3B5A69]"
            >
              90-Day Regulatory Deadline
            </span>
          </div>
          <p className="text-sm leading-relaxed" className="text-[var(--color-text)]">
            Form ADV-W must be filed within <strong>90 days of the advisor's Go Live date</strong> on
            Farther. Failure to file creates a regulatory gap where the advisor is simultaneously
            registered as an independent RIA and affiliated with Farther. The AXM must track this deadline
            and confirm filing with the advisor and Compliance.
          </p>
        </div>

        {/* Dual vs Non-Dual */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8" className="text-[var(--color-text)]">
            Dual vs. Non-Dual Registration
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div
              className="rounded-xl p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: THEME.colors.gold }}
                />
                <h3 className="text-lg font-bold" className="text-[var(--color-text)]">
                  Dual Registration States
                </h3>
              </div>
              <p className="text-sm leading-relaxed" className="text-[var(--color-text-secondary)]">
                States like New York and California may require separate state-level registration in
                addition to SEC registration. ADV-W must be filed with both the SEC (via IARD) and the
                applicable state regulator.
              </p>
            </div>

            <div
              className="rounded-xl p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: THEME.colors.teal }}
                />
                <h3 className="text-lg font-bold" className="text-[var(--color-text)]">
                  Non-Dual Registration States
                </h3>
              </div>
              <p className="text-sm leading-relaxed" className="text-[var(--color-text-secondary)]">
                SEC-registered RIAs in these states only need to file with the SEC via IARD. State-level
                ADV-W is not required.
              </p>
            </div>
          </div>
        </div>

        {/* Transition Considerations */}
        <div
          className="rounded-xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold mb-6" className="text-[var(--color-text)]">
            Transition Considerations
          </h2>
          <ul className="space-y-3">
            {[
              'Clients follow the advisor to Farther — inform clients of the move to Farther and the new custodian/account structure',
              'No protocol restrictions on client communication',
              'LPOA or Repaper/ACAT are the most common transition methods for Independent RIAs',
              'Master Merge is rare but possible depending on prior custodian arrangements',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-relaxed" className="text-[var(--color-text)]">
                <span className="text-[#3B5A69]">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </PageLayout>
  );
}
