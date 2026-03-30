'use client';

import useSWR from 'swr';
import { useTheme } from '@/lib/theme-provider';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface StatsCardsProps {
  filterParams: string;
}

export function StatsCards({ filterParams }: StatsCardsProps) {
  const { THEME } = useTheme();

  const { data } = useSWR(`/api/command-center/transitions/stats?${filterParams}`, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const cards = [
    { label: 'Total Advisors', value: data?.total_advisors ?? '--', color: THEME.colors.teal },
    { label: 'Total Accounts', value: data?.total_accounts ?? '--', color: THEME.colors.text },
    { label: 'Households', value: data?.total_households ?? '--', color: THEME.colors.steelBlue400 },
    { label: 'IAA Signed', value: data?.iaa_signed ?? '--', color: THEME.colors.success },
    { label: 'Paperwork Signed', value: data?.paperwork_signed ?? '--', color: THEME.colors.success },
    { label: 'Portal Complete', value: data?.portal_complete ?? '--', color: THEME.colors.teal },
    { label: 'Pending Docs', value: data?.pending_documents ?? '--', color: THEME.colors.warning },
    { label: 'Completion', value: data?.completion_pct != null ? `${data.completion_pct}%` : '--', color: data?.completion_pct >= 70 ? THEME.colors.success : data?.completion_pct >= 40 ? THEME.colors.warning : THEME.colors.error },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
      {cards.map(card => (
        <div key={card.label} style={{
          background: THEME.colors.surface, borderRadius: 10, padding: '16px 18px',
          border: `1px solid ${THEME.colors.border}`,
        }}>
          <div style={{ fontSize: 11, color: THEME.colors.textSecondary, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
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
