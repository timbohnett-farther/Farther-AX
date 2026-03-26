'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { StatusPill, ProgressBar } from './StatusPill';
import { EnvelopeCard } from './EnvelopeCard';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const C = {
  dark: '#FFFEF4', slate: 'rgba(212,223,229,0.5)',
  teal: '#4E7082', green: '#4ade80', amber: '#fbbf24', red: '#f87171',
  purple: '#a78bfa', purpleBg: 'rgba(167,139,250,0.15)', purpleBorder: 'rgba(167,139,250,0.35)',
  cardBg: '#171f27', border: 'rgba(212,223,229,0.08)',
};

interface HouseholdGroup {
  household_name: string;
  advisor_name: string;
  account_count: number;
  household_status: string;
  completion_pct: number;
  iaa_complete: number;
  paperwork_complete: number;
  portal_complete: number;
}

interface DocuSignDashboardProps {
  advisorFilter?: string;
}

export function DocuSignDashboard({ advisorFilter }: DocuSignDashboardProps) {
  const url = advisorFilter
    ? `/api/command-center/transitions/households?advisor=${encodeURIComponent(advisorFilter)}`
    : '/api/command-center/transitions/households';
  const { data, isLoading } = useSWR(url, fetcher, { revalidateOnFocus: false });
  const [expandedHH, setExpandedHH] = useState<string | null>(null);

  if (isLoading) return <div style={{ padding: 40, color: C.slate, textAlign: 'center' }}>Loading household data...</div>;

  const households: HouseholdGroup[] = data?.households ?? [];

  if (households.length === 0) {
    return <div style={{ padding: 40, color: C.slate, textAlign: 'center' }}>No household data available. Sync transition data first.</div>;
  }

  // Group by advisor
  const byAdvisor: Record<string, HouseholdGroup[]> = {};
  for (const hh of households) {
    const key = hh.advisor_name || 'Unknown';
    if (!byAdvisor[key]) byAdvisor[key] = [];
    byAdvisor[key].push(hh);
  }

  const advisors = Object.entries(byAdvisor).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Households', value: households.length, color: C.teal },
          { label: 'Complete', value: households.filter(h => h.household_status === 'Complete').length, color: C.green },
          { label: 'In Progress', value: households.filter(h => h.household_status !== 'Complete' && h.household_status !== 'Not Ready').length, color: C.amber },
          { label: 'Not Ready', value: households.filter(h => h.household_status === 'Not Ready').length, color: C.red },
        ].map(card => (
          <div key={card.label} style={{ background: C.cardBg, borderRadius: 10, padding: '16px 18px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: card.color, fontFamily: "'Inter', system-ui, sans-serif" }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Per-advisor household groups */}
      {advisors.map(([advisorName, hhList]) => {
        const avgCompletion = Math.round(hhList.reduce((s, h) => s + h.completion_pct, 0) / hhList.length);
        return (
          <div key={advisorName} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
            {/* Advisor header */}
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.teal }}>{advisorName}</div>
                <div style={{ fontSize: 12, color: C.slate }}>{hhList.length} household{hhList.length !== 1 ? 's' : ''} · {hhList.reduce((s, h) => s + h.account_count, 0)} accounts</div>
              </div>
              <div style={{ width: 120 }}>
                <ProgressBar pct={avgCompletion} />
              </div>
            </div>

            {/* Household rows */}
            {hhList.map(hh => {
              const hhKey = `${advisorName}|${hh.household_name}`;
              return (
                <div
                  key={hhKey}
                  style={{
                    padding: '10px 18px', borderBottom: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    cursor: 'pointer',
                    background: expandedHH === hhKey ? 'rgba(43,184,196,0.04)' : 'transparent',
                  }}
                  onClick={() => setExpandedHH(expandedHH === hhKey ? null : hhKey)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.dark }}>{hh.household_name || 'Unknown'}</div>
                    <div style={{ fontSize: 11, color: C.slate }}>{hh.account_count} account{hh.account_count !== 1 ? 's' : ''}</div>
                  </div>
                  <StatusPill status={hh.household_status} />
                  <div style={{ width: 100 }}>
                    <ProgressBar pct={hh.completion_pct} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 11, color: hh.iaa_complete === hh.account_count ? C.green : C.slate }}>IAA {hh.iaa_complete}/{hh.account_count}</span>
                    <span style={{ fontSize: 11, color: hh.paperwork_complete === hh.account_count ? C.green : C.slate }}>PW {hh.paperwork_complete}/{hh.account_count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
