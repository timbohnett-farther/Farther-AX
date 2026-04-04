'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-provider';
import { AcquisitionsDeal, AcquisitionsStage } from './types';
import { fetcher, formatAUM, formatDate, getNameColor } from './utils';
import { SummaryCard } from './SummaryCard';
import { StageBadge } from './StageBadge';
import { SWR_OPTS } from './constants';

export function AcquisitionsTab() {
  const { THEME } = useTheme();
  const { data, error, isLoading } = useSWR('/api/command-center/acquisitions', fetcher, SWR_OPTS);

  if (isLoading) return <div style={{ padding: '60px 0', color: THEME.colors.textSecondary }}>Loading acquisitions…</div>;
  if (error || data?.error) return <div style={{ padding: '60px 0', color: THEME.colors.error }}>Failed to load acquisitions data.</div>;

  const deals: AcquisitionsDeal[] = data?.deals ?? [];
  const stages: AcquisitionsStage[] = data?.stages ?? [];
  const activeDeals = deals.filter(d => !d.isTerminal);
  const terminalDeals = deals.filter(d => d.isTerminal);
  const totalAUM = activeDeals.reduce((acc, d) => acc + (parseFloat(d.transferable_aum ?? '0') || 0), 0);

  return (
    <>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <SummaryCard label="Total M&A Pipeline" value={formatAUM(totalAUM)} sub={`${activeDeals.length} active deals`} accent icon="◈" iconColor="#7CA4B4" />
        <SummaryCard label="Total Deals" value={String(deals.length)} sub={`${activeDeals.length} active · ${terminalDeals.length} closed`} icon="▸" iconColor="#3b82f6" />
        <SummaryCard label="Active Stages" value={String(stages.filter(s => !s.isTerminal && s.count > 0).length)} sub="in progress" icon="▲" iconColor="#8b5cf6" />
        <SummaryCard
          label="Avg Deal Size"
          value={activeDeals.length ? formatAUM(totalAUM / activeDeals.length) : '—'}
          sub="transferable AUM" icon="✦" iconColor="#c8a951"
        />
      </div>

      {/* Stage Funnel Pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
        {stages.filter(s => s.count > 0).map(stage => (
          <div key={stage.id} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: stage.isTerminal ? THEME.colors.errorBg : 'rgba(91,106,113,0.08)',
            color: stage.isTerminal ? THEME.colors.error : THEME.colors.textSecondary,
          }}>
            {stage.label} · {stage.count}
          </div>
        ))}
      </div>

      {/* Deals Table */}
      <div style={{ background: THEME.colors.surface, border: `1px solid ${THEME.colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${THEME.colors.border}`, background: THEME.colors.surfaceSubtle }}>
                {['Deal Name', 'Prior Firm', 'Type', 'Stage', 'Exp. AUM', 'Households', 'Target Date', 'Owner'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: THEME.colors.textSecondary, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map((deal, i) => {
                const rowOpacity = deal.isTerminal ? 0.6 : 1;
                return (
                  <tr key={deal.id} style={{
                    borderBottom: `1px solid ${THEME.colors.border}`,
                    background: deal.isTerminal ? 'rgba(192,57,43,0.03)' : i % 2 === 0 ? THEME.colors.surface : 'rgba(248,244,240,0.03)',
                    opacity: rowOpacity,
                    transition: 'background 120ms ease',
                  }}
                    onMouseEnter={e => { if (!deal.isTerminal) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(29,118,130,0.06)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = deal.isTerminal ? 'rgba(192,57,43,0.03)' : i % 2 === 0 ? THEME.colors.surface : 'rgba(248,244,240,0.03)'; }}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <Link
                        href={`/command-center/advisor/${deal.id}`}
                        style={{ fontWeight: 600, color: deal.isTerminal ? THEME.colors.textSecondary : THEME.colors.teal, textDecoration: deal.isTerminal ? 'line-through' : 'none' }}
                      >
                        {deal.dealname}
                      </Link>
                    </td>
                    <td style={{ padding: '10px 14px', color: THEME.colors.textSecondary }}>{deal.current_firm__cloned_ ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: THEME.colors.textSecondary }}>{deal.firm_type ? deal.firm_type.replace(/_/g, ' ') : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <StageBadge stageId={deal.dealstage} label={deal.stageLabel} isTerminal={deal.isTerminal} />
                    </td>
                    <td style={{ padding: '10px 14px', color: deal.isTerminal ? THEME.colors.textSecondary : THEME.colors.teal, fontWeight: 600 }}>
                      {formatAUM(parseFloat(deal.transferable_aum ?? '0'))}
                    </td>
                    <td style={{ padding: '10px 14px', color: THEME.colors.textSecondary }}>{deal.client_households ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: THEME.colors.textSecondary }}>
                      {formatDate(deal.desired_start_date)}
                    </td>
                    <td style={{ padding: '10px 14px', color: deal.ownerName ? getNameColor(deal.ownerName, THEME.colors.textSecondary) : THEME.colors.textSecondary, fontWeight: deal.ownerName ? 600 : 400 }}>{deal.ownerName ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
