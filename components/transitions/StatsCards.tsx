'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { getThemeColors } from '@/lib/design-tokens';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface StatsCardsProps {
  filterParams: string;
}

export function StatsCards({ filterParams }: StatsCardsProps) {
  const { theme } = useTheme();
  const C = useMemo(() => getThemeColors(theme === 'dark'), [theme]);
  const blue = '#60a5fa';

  const { data } = useSWR(`/api/command-center/transitions/stats?${filterParams}`, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const cards = [
    { label: 'Total Advisors', value: data?.total_advisors ?? '--', color: C.teal },
    { label: 'Total Accounts', value: data?.total_accounts ?? '--', color: C.dark },
    { label: 'Households', value: data?.total_households ?? '--', color: blue },
    { label: 'IAA Signed', value: data?.iaa_signed ?? '--', color: C.green },
    { label: 'Paperwork Signed', value: data?.paperwork_signed ?? '--', color: C.green },
    { label: 'Portal Complete', value: data?.portal_complete ?? '--', color: C.teal },
    { label: 'Pending Docs', value: data?.pending_documents ?? '--', color: C.amber },
    { label: 'Completion', value: data?.completion_pct != null ? `${data.completion_pct}%` : '--', color: data?.completion_pct >= 70 ? C.green : data?.completion_pct >= 40 ? C.amber : C.red },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
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
