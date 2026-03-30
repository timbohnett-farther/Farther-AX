'use client';

import { useState } from 'react';
import { StatusPill, statusStyle } from './StatusPill';
import { useTheme } from '@/lib/theme-provider';

interface Account {
  id: number;
  advisor_name?: string | null;
  household_name: string | null;
  account_type: string | null;
  primary_first_name: string | null;
  primary_last_name: string | null;
  primary_email: string | null;
  document_readiness: string | null;
  status_of_iaa: string | null;
  status_of_account_paperwork: string | null;
  docusign_iaa_status: string | null;
  docusign_paperwork_status: string | null;
  portal_status: string | null;
  contra_account_firm: string | null;
  new_account_number: string | null;
  fee_schedule: string | null;
  notes: string | null;
}

interface AccountsTableProps {
  accounts: Account[];
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  showAdvisorColumn?: boolean;
}

type SortKey = keyof Account | '';

export function AccountsTable({ accounts, total, page, perPage, onPageChange, showAdvisorColumn }: AccountsTableProps) {
  const { THEME } = useTheme();
  const [sortCol, setSortCol] = useState<SortKey>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const totalPages = Math.ceil(total / perPage);

  const sorted = [...accounts].sort((a, b) => {
    if (!sortCol) return 0;
    const dir = sortDir === 'asc' ? 1 : -1;
    const va = (a[sortCol] as string) ?? '';
    const vb = (b[sortCol] as string) ?? '';
    return va.localeCompare(vb) * dir;
  });

  const handleSort = (col: SortKey) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const columns: { key: SortKey; label: string; width?: number }[] = [
    ...(showAdvisorColumn ? [{ key: 'advisor_name' as SortKey, label: 'Advisor' }] : []),
    { key: 'household_name', label: 'Household' },
    { key: 'account_type', label: 'Account Type' },
    { key: 'primary_last_name', label: 'Primary Holder' },
    { key: 'document_readiness', label: 'Readiness' },
    { key: 'status_of_iaa', label: 'IAA' },
    { key: 'status_of_account_paperwork', label: 'Paperwork' },
    { key: 'docusign_iaa_status', label: 'DS IAA' },
    { key: 'docusign_paperwork_status', label: 'DS PW' },
    { key: 'portal_status', label: 'Portal' },
    { key: 'fee_schedule', label: 'Fee Schedule' },
  ];

  return (
    <div style={{ background: THEME.colors.surface, border: `1px solid ${THEME.colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${THEME.colors.border}`, background: THEME.colors.surface }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    padding: '10px 10px', textAlign: 'left', color: THEME.colors.textSecondary, fontSize: 11,
                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                    whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  {col.label} {sortCol === col.key ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((acc, i) => (
              <tr
                key={acc.id}
                style={{
                  borderBottom: `1px solid ${THEME.colors.border}`,
                  background: i % 2 === 0 ? THEME.colors.surface : 'rgba(248,244,240,0.03)',
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(59,90,105,0.06)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? THEME.colors.surface : 'rgba(248,244,240,0.03)'; }}
              >
                {showAdvisorColumn && <td style={{ padding: '10px 10px', color: THEME.colors.teal, fontWeight: 600 }}>{acc.advisor_name || '--'}</td>}
                <td style={{ padding: '10px 10px', fontWeight: 500, color: THEME.colors.text }}>{acc.household_name || '--'}</td>
                <td style={{ padding: '10px 10px', color: THEME.colors.text }}>{acc.account_type || '--'}</td>
                <td style={{ padding: '10px 10px', color: THEME.colors.text }}>
                  <div>{[acc.primary_first_name, acc.primary_last_name].filter(Boolean).join(' ') || '--'}</div>
                  {acc.primary_email && <div style={{ fontSize: 11, color: THEME.colors.textSecondary }}>{acc.primary_email}</div>}
                </td>
                <td style={{ padding: '10px 10px', ...statusStyle(acc.document_readiness) }}>{acc.document_readiness || '--'}</td>
                <td style={{ padding: '10px 10px', ...statusStyle(acc.status_of_iaa) }}>{acc.status_of_iaa || '--'}</td>
                <td style={{ padding: '10px 10px', ...statusStyle(acc.status_of_account_paperwork) }}>{acc.status_of_account_paperwork || '--'}</td>
                <td style={{ padding: '10px 10px' }}><StatusPill status={acc.docusign_iaa_status} /></td>
                <td style={{ padding: '10px 10px' }}><StatusPill status={acc.docusign_paperwork_status} /></td>
                <td style={{ padding: '10px 10px', ...statusStyle(acc.portal_status) }}>{acc.portal_status || '--'}</td>
                <td style={{ padding: '10px 10px', color: THEME.colors.text, fontSize: 12 }}>{acc.fee_schedule || '--'}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={columns.length} style={{ padding: 40, textAlign: 'center', color: THEME.colors.textSecondary }}>No accounts match your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: `1px solid ${THEME.colors.border}` }}>
          <span style={{ fontSize: 12, color: THEME.colors.textSecondary }}>
            Showing {(page - 1) * perPage + 1}--{Math.min(page * perPage, total)} of {total}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${THEME.colors.border}`, background: THEME.colors.surface, color: page <= 1 ? THEME.colors.textSecondary : THEME.colors.text, fontSize: 12, cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}
            >
              Prev
            </button>
            <span style={{ padding: '4px 8px', fontSize: 12, color: THEME.colors.text }}>{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${THEME.colors.border}`, background: THEME.colors.surface, color: page >= totalPages ? THEME.colors.textSecondary : THEME.colors.text, fontSize: 12, cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
