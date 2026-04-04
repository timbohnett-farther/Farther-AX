'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme-provider';
import { StageBadge } from './shared';
import { formatAUM, stageIndex, STAGE_ORDER } from './types';

interface AdvisorHeaderProps {
  id: string;
  deal: Record<string, any>;
  contact: Record<string, any> | null;
  pipelineData: { deals: any[] } | null;
}

export function AdvisorHeader({ id, deal, contact, pipelineData }: AdvisorHeaderProps) {
  const { THEME } = useTheme();
  const stageId = deal.dealstage ?? '';
  const si = stageIndex(stageId);

  const nextAdvisor = (() => {
    if (!pipelineData?.deals) return null;
    const sorted = [...pipelineData.deals]
      .filter((d: { dealname?: string }) => d.dealname && !d.dealname.toLowerCase().includes('test'))
      .sort((a: { dealname: string }, b: { dealname: string }) => a.dealname.localeCompare(b.dealname));
    const idx = sorted.findIndex((d: { id: string }) => d.id === id);
    const next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : sorted[0];
    if (!next || next.id === id) return null;
    return next;
  })();

  return (
    <>
      {/* Navigation: Back + Next Advisor */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Link href="/command-center/advisor-hub" style={{ fontSize: 13, color: THEME.colors.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          &larr; Back to Advisor Hub
        </Link>
        {nextAdvisor && (
          <Link href={`/command-center/advisor/${nextAdvisor.id}`} style={{ textDecoration: 'none', textAlign: 'right' }}>
            <span style={{ fontSize: 12, color: THEME.colors.textMuted, display: 'block' }}>Next Advisor &rarr;</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: THEME.colors.teal }}>{nextAdvisor.dealname}</span>
          </Link>
        )}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: THEME.colors.text, fontFamily: "'Inter', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>
            {deal.dealname ?? 'Advisor Profile'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <StageBadge stageId={stageId} />
            {deal.current_firm__cloned_ && <span style={{ fontSize: 13, color: THEME.colors.textMuted }}>from {deal.current_firm__cloned_}</span>}
            {deal.firm_type && <span style={{ fontSize: 13, color: THEME.colors.textMuted }}>· {deal.firm_type}</span>}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            {contact?.email && <a href={`mailto:${contact.email}`} style={{ fontSize: 13, color: THEME.colors.teal, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>✉ {contact.email}</a>}
            {(contact?.phone || contact?.mobilephone) && <a href={`tel:${contact.phone || contact.mobilephone}`} style={{ fontSize: 13, color: THEME.colors.teal, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>☎ {contact.phone || contact.mobilephone}</a>}
            {(contact?.city || contact?.state) && <span style={{ fontSize: 13, color: THEME.colors.textMuted }}>{[contact.city, contact.state].filter(Boolean).join(', ')}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: THEME.colors.teal, fontFamily: "'Inter', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums' }}>
            {formatAUM(deal.transferable_aum || deal.team?.transferable_aum)}
          </p>
          <p style={{ fontSize: 12, color: THEME.colors.textMuted }}>Transferable AUM</p>
        </div>
      </div>

      {/* Stage Progress */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {STAGE_ORDER.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= si ? THEME.colors.teal : THEME.colors.border, transition: 'background 0.3s' }} />
        ))}
      </div>
    </>
  );
}
