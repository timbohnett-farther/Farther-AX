'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ProgressBar } from './StatusPill';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const C = {
  dark: '#FAF7F2', slate: 'rgba(250,247,242,0.5)',
  teal: '#2bb8c4', green: '#4ade80', amber: '#fbbf24', red: '#f87171',
  cardBg: '#2f2f2f', border: 'rgba(250,247,242,0.08)',
};

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
  const { data, isLoading } = useSWR('/api/command-center/transitions/executive-summary', fetcher, { revalidateOnFocus: false });
  const [sortCol, setSortCol] = useState<string>('advisor_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  if (isLoading) return <div style={{ padding: 40, color: C.slate, textAlign: 'center' }}>Loading executive summary...</div>;

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
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {cols.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    padding: '12px 14px', textAlign: 'left', color: C.slate, fontSize: 11,
                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
                    width: col.width,
                  }}
                >
                  {col.label} {sortCol === col.key ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((adv, i) => (
              <tr
                key={adv.advisor_name}
                style={{
                  borderBottom: `1px solid ${C.border}`,
                  background: i % 2 === 0 ? C.cardBg : 'rgba(250,247,242,0.03)',
                  cursor: onAdvisorClick ? 'pointer' : 'default',
                  transition: 'background 120ms ease',
                }}
                onClick={() => onAdvisorClick?.(adv.advisor_name)}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(29,118,130,0.06)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? C.cardBg : 'rgba(250,247,242,0.03)'; }}
              >
                <td style={{ padding: '12px 14px', fontWeight: 600, color: C.teal }}>{adv.advisor_name}</td>
                <td style={{ padding: '12px 14px', color: C.dark }}>{adv.total_accounts}</td>
                <td style={{ padding: '12px 14px', color: C.dark }}>{adv.total_households}</td>
                <td style={{ padding: '12px 14px', minWidth: 120 }}>
                  <ProgressBar pct={adv.iaa_pct} />
                </td>
                <td style={{ padding: '12px 14px', minWidth: 120 }}>
                  <ProgressBar pct={adv.paperwork_pct} />
                </td>
                <td style={{ padding: '12px 14px', minWidth: 120 }}>
                  <ProgressBar pct={adv.portal_pct} />
                </td>
                <td style={{ padding: '12px 14px', minWidth: 120 }}>
                  <ProgressBar pct={adv.overall_pct} color={adv.overall_pct >= 80 ? C.green : adv.overall_pct >= 40 ? C.amber : C.red} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
