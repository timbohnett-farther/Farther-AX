'use client';

import PageLayout from '@/components/PageLayout';
import { useTheme } from '@/lib/theme-provider';

export default function LPOAPage() {
  const { THEME } = useTheme();

  return (
    <PageLayout
      step={9}
      title="LPOA"
      subtitle="Transition Method — Limited Power of Attorney (6-8 Weeks)"
      backHref="/master-merge"
      nextHref="/repaper-acat"
      nextLabel="Next: Repaper / ACAT"
    >
      <div className="max-w-5xl mx-auto">

        {/* Intro */}
        <p
          className="text-base leading-relaxed mb-12"
          style={{
            color: THEME.colors.text,
            borderLeft: `3px solid ${THEME.colors.teal}`,
            paddingLeft: '1.5rem',
          }}
        >
          The LPOA (Limited Power of Attorney) transition method allows Farther to transfer client
          assets without requiring individual client signatures on new paperwork. Instead, the advisor
          signs a single LPOA document granting Farther authority to act on behalf of clients. This is
          a mid-range timeline method — faster than Repaper/ACAT but slower than Master Merge.
        </p>

        {/* At a Glance */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6" style={{ color: THEME.colors.text }}>
            At a Glance
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Timeline', value: '6-8 Weeks' },
              { label: 'Who Signs', value: 'Advisor (not clients)' },
              { label: 'Available At', value: 'Schwab, Fidelity IWS, Pershing PAS' },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl p-6 text-center"
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `1px solid ${THEME.colors.border}`,
                }}
              >
                <p
                  className="text-xs uppercase tracking-wider mb-3"
                  style={{ color: THEME.colors.textSecondary }}
                >
                  {card.label}
                </p>
                <p className="text-xl leading-snug" style={{ color: THEME.colors.teal }}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How LPOA Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6" style={{ color: THEME.colors.text }}>
            How LPOA Works
          </h2>
          <div className="space-y-0">
            {[
              'Advisor and AXM confirm LPOA eligibility at the advisor\'s current custodian(s)',
              'Transitions team (CTM) prepares the LPOA document package',
              'Advisor signs the LPOA document',
              'CTM submits LPOA authorization to custodian',
              'Custodian reviews and approves the LPOA (typically 5-10 business days)',
              'Asset transfers begin systematically, batch by batch',
              'Accounts are monitored daily; discrepancies flagged and resolved',
              'All accounts confirmed transferred — transitions closes out',
            ].map((step, i, arr) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: i === arr.length - 1 ? THEME.colors.teal : THEME.colors.text,
                      color: '#FFFFFF',
                    }}
                  >
                    {i + 1}
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className="w-px flex-1 min-h-8"
                      style={{ backgroundColor: THEME.colors.border }}
                    />
                  )}
                </div>
                <div className="pb-8">
                  <p className="text-sm leading-relaxed pt-1" style={{ color: THEME.colors.text }}>
                    {step}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custodian Availability */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6" style={{ color: THEME.colors.text }}>
            Custodian Availability
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Schwab', icon: 'S', body: 'Full LPOA support. Most common for Breakaway advisors with Schwab accounts.' },
              { name: 'Fidelity IWS', icon: 'F', body: 'Fidelity Institutional Wealth Services supports LPOA. Requires specific form submission through Fidelity\'s advisor portal.' },
              { name: 'Pershing PAS', icon: 'P', body: 'Pershing Portfolio Advisory Service supports LPOA through NetX360.' },
            ].map((c) => (
              <div
                key={c.name}
                className="rounded-xl p-6"
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `1px solid ${THEME.colors.border}`,
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                    style={{
                      backgroundColor: THEME.colors.teal,
                      color: '#FFFFFF',
                    }}
                  >
                    {c.icon}
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: THEME.colors.text }}>
                    {c.name}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: THEME.colors.textSecondary }}>
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Considerations */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6" style={{ color: THEME.colors.text }}>
            Key Considerations
          </h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: THEME.colors.surface,
              border: `1px solid ${THEME.colors.border}`,
            }}
          >
            <div
              className="px-8 py-4"
              style={{ borderBottom: `1px solid ${THEME.colors.border}` }}
            >
              <span
                className="text-xs uppercase tracking-wider font-semibold"
                style={{ color: THEME.colors.teal }}
              >
                Important Notes
              </span>
            </div>
            <ul className="px-8 py-6 space-y-3">
              {[
                'LPOA does NOT require client notification of the transfer (although best practice is to notify)',
                'Some account types cannot transfer via LPOA (e.g., 401k, certain annuities) — these may require Repaper',
                'ACATs may still be needed for non-LPOA-eligible accounts within an otherwise LPOA transition',
                'The LPOA document must be stored in the client file and Transition Tracker',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                  <span style={{ color: THEME.colors.teal }}>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
