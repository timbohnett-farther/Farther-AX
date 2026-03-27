'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const C = {
  dark: '#FFFEF4', slate: 'rgba(212,223,229,0.5)',
  teal: '#4E7082', green: '#4ade80', amber: '#fbbf24', red: '#f87171', blue: '#60a5fa',
  cardBg: '#171f27', border: 'rgba(212,223,229,0.08)',
};

interface StatsCardsProps {
  filterParams: string;
}

export function StatsCards({ filterParams }: StatsCardsProps) {
  const { data } = useSWR(`/api/command-center/transitions/stats?${filterParams}`, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const cards = [
    { label: 'Total Advisors', value: data?.total_advisors ?? '--', color: C.teal },
    { label: 'Total Accounts', value: data?.total_accounts ?? '--', color: C.dark },
    { label: 'Households', value: data?.total_households ?? '--', color: C.blue },
    { label: 'IAA Signed', value: data?.iaa_signed ?? '--', color: C.green },
    { label: 'Paperwork Signed', value: data?.paperwork_signed ?? '--', color: C.green },
    { label: 'Portal Complete', value: data?.portal_complete ?? '--', color: C.teal },
    { label: 'Pending Docs', value: data?.pending_documents ?? '--', color: C.amber },
    { label: 'Completion', value: data?.completion_pct != null ? `${data.completion_pct}%` : '--', color: data?.completion_pct >= 70 ? C.green : data?.completion_pct >= 40 ? C.amber : C.red },
  ];

  return (
    <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
      {cards.map(card => (
        <div key={card.label} style={{
          background: C.cardBg, borderRadius: 10, padding: '16px 18px',
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 11, color: C.slate, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {card.label}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: card.color, fontFamily: "'Inter', system-ui, sans-serif" }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
