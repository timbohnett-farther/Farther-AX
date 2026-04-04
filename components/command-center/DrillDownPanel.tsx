'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme-provider';
import { Deal } from './types';
import { formatAUM, formatDate } from './utils';
import { StageBadge } from './StageBadge';
import { STAGE_LABELS } from './constants';

interface DrillDownPanelProps {
  title: string;
  deals: Deal[];
  onClose: () => void;
}

export function DrillDownPanel({ title, deals, onClose }: DrillDownPanelProps) {
  const { THEME } = useTheme();
  const getAUM = (d: Deal) => parseFloat(d.transferable_aum ?? '0') || 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: 720, height: '100vh',
          background: '#1a1a1a', borderLeft: `1px solid ${THEME.colors.border}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'slideInRight 200ms ease',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${THEME.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: THEME.colors.text, fontFamily: "'Inter', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums', marginBottom: 2 }}>{title}</h3>
            <p style={{ fontSize: 12, color: THEME.colors.textSecondary }}>{deals.length} deals · {formatAUM(deals.reduce((s, d) => s + getAUM(d), 0))} total AUM</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: THEME.colors.textSecondary, fontSize: 20, cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}>✕</button>
        </div>
        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${THEME.colors.border}`, position: 'sticky', top: 0, background: '#1a1a1a', zIndex: 1 }}>
                {['Advisor', 'Stage', 'Exp. AUM', 'Launch Date'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Advisor' ? 'left' : 'right', color: THEME.colors.textSecondary, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map((deal, i) => (
                <tr key={deal.id} style={{ borderBottom: `1px solid ${THEME.colors.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(248,244,240,0.02)', transition: 'background 120ms ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(29,118,130,0.06)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(248,244,240,0.02)'; }}
                >
                  <td style={{ padding: '8px 10px' }}>
                    <Link href={`/command-center/advisor/${deal.id}`} style={{ color: THEME.colors.teal, fontWeight: 600, textDecoration: 'none' }}>{deal.dealname}</Link>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    <StageBadge stageId={deal.dealstage} label={STAGE_LABELS[deal.dealstage] ?? deal.dealstage} />
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: THEME.colors.teal, fontWeight: 600 }}>{formatAUM(getAUM(deal))}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: THEME.colors.textSecondary }}>{formatDate(deal.desired_start_date ?? deal.actual_launch_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}
