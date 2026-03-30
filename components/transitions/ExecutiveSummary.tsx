'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useTheme } from '@/lib/theme-provider';
import { ProgressBar } from './StatusPill';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface AdvisorSummary {
  advisor_name: string;
  total_accounts: number;
  total_households: number;
  iaa_complete: number;
  iaa_pct: number;
  paperwork_complete: number;
  paperwork_pct: number;
  portal_complete: number;
  portal_pct: number;
  overall_pct: number;
}

interface ExecutiveSummaryProps {
  onAdvisorClick?: (advisor: string) => void;
}

export function ExecutiveSummary({ onAdvisorClick }: ExecutiveSummaryProps) {
  const { THEME } = useTheme();
  const { data, isLoading } = useSWR('/api/command-center/transitions/executive-summary', fetcher, { revalidateOnFocus: false });
  const [sortCol, setSortCol] = useState<string>('advisor_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  if (isLoading) return (
    <div style={{ padding: 40, textAlign: 'center', color: THEME.colors.textSecondary }}>
      Loading executive summary...
    </div>
  );

  const advisors: AdvisorSummary[] = data?.advisors ?? [];

  const sorted = [...advisors].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const va = (a as unknown as Record<string, unknown>)[sortCol];
    const vb = (b as unknown as Record<string, unknown>)[sortCol];
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
    return String(va ?? '').localeCompare(String(vb ?? '')) * dir;
  });

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const cols = [
    { key: 'advisor_name', label: 'Advisor', width: 180 },
    { key: 'total_accounts', label: 'Accounts' },
    { key: 'total_households', label: 'Households' },
    { key: 'iaa_pct', label: 'IAA %' },
    { key: 'paperwork_pct', label: 'Paperwork %' },
    { key: 'portal_pct', label: 'Portal %' },
    { key: 'overall_pct', label: 'Overall %' },
  ];

  return (
    <div style={{ background: THEME.colors.surface, border: `1px solid ${THEME.colors.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: THEME.shadows.md }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${THEME.colors.border}` }}>
              {cols.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    padding: '14px', textAlign: 'left', fontSize: 11, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
                    userSelect: 'none', whiteSpace: 'nowrap', color: THEME.colors.textSecondary,
                    width: col.width,
                  }}
                >
                  {col.label} {sortCol === col.key ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((adv) => (
              <tr
                key={adv.advisor_name}
                style={{
                  borderBottom: `1px solid ${THEME.colors.border}`,
                  transition: 'background-color 120ms ease',
                  cursor: onAdvisorClick ? 'pointer' : 'default',
                }}
                onClick={() => onAdvisorClick?.(adv.advisor_name)}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'rgba(59,90,105,0.06)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ''; }}
              >
                <td style={{ padding: '14px', fontWeight: 600, color: THEME.colors.teal }}>{adv.advisor_name}</td>
                <td style={{ padding: '14px', color: THEME.colors.text }}>{adv.total_accounts}</td>
                <td style={{ padding: '14px', color: THEME.colors.text }}>{adv.total_households}</td>
                <td style={{ padding: '14px', minWidth: 120 }}>
                  <ProgressBar pct={adv.iaa_pct} />
                </td>
                <td style={{ padding: '14px', minWidth: 120 }}>
                  <ProgressBar pct={adv.paperwork_pct} />
                </td>
                <td style={{ padding: '14px', minWidth: 120 }}>
                  <ProgressBar pct={adv.portal_pct} />
                </td>
                <td style={{ padding: '14px', minWidth: 120 }}>
                  <ProgressBar
                    pct={adv.overall_pct}
                    color={adv.overall_pct >= 80 ? THEME.colors.success : adv.overall_pct >= 40 ? THEME.colors.warning : THEME.colors.error}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
