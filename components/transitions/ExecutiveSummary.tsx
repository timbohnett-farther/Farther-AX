'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ProgressBar } from './StatusPill';
import { colors } from '@/lib/design-tokens';

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
  const { data, isLoading } = useSWR('/api/command-center/transitions/executive-summary', fetcher, { revalidateOnFocus: false });
  const [sortCol, setSortCol] = useState<string>('advisor_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  if (isLoading) return (
    <div className="p-10 text-center text-text-secondary">
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
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border">
              {cols.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3.5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] cursor-pointer select-none whitespace-nowrap text-text-secondary"
                  style={col.width ? { width: col.width } : undefined}
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
                className={`border-b border-border transition-colors duration-[120ms] ${onAdvisorClick ? 'cursor-pointer' : ''}`}
                onClick={() => onAdvisorClick?.(adv.advisor_name)}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'rgba(78,112,130,0.06)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ''; }}
              >
                <td className="px-3.5 py-3 font-semibold text-teal">{adv.advisor_name}</td>
                <td className="px-3.5 py-3">{adv.total_accounts}</td>
                <td className="px-3.5 py-3">{adv.total_households}</td>
                <td className="px-3.5 py-3 min-w-[120px]">
                  <ProgressBar pct={adv.iaa_pct} />
                </td>
                <td className="px-3.5 py-3 min-w-[120px]">
                  <ProgressBar pct={adv.paperwork_pct} />
                </td>
                <td className="px-3.5 py-3 min-w-[120px]">
                  <ProgressBar pct={adv.portal_pct} />
                </td>
                <td className="px-3.5 py-3 min-w-[120px]">
                  <ProgressBar
                    pct={adv.overall_pct}
                    color={adv.overall_pct >= 80 ? colors.success : adv.overall_pct >= 40 ? colors.warning : colors.danger}
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
