'use client';

import { useTheme } from '@/lib/theme-provider';

// Status colors are static and theme-independent (status meaning is consistent across themes)
const STATUS_COLORS = {
  dark: '#F8F4F0', slate: 'rgba(227,211,197,0.5)',
  green: '#4ade80', greenBg: 'rgba(74,222,128,0.2)', greenBorder: 'rgba(74,222,128,0.35)',
  amber: '#fbbf24', amberBg: 'rgba(251,191,36,0.2)', amberBorder: 'rgba(251,191,36,0.35)',
  red: '#f87171', redBg: 'rgba(248,113,113,0.2)', redBorder: 'rgba(248,113,113,0.35)',
  blue: '#7CA4B4', blueBg: 'rgba(124,164,180,0.2)', blueBorder: 'rgba(124,164,180,0.35)',
  teal: '#3B5A69', tealBg: 'rgba(59,90,105,0.2)', tealBorder: 'rgba(59,90,105,0.35)',
};

export function statusStyle(status: string | null): React.CSSProperties {
  if (!status) return { color: STATUS_COLORS.slate, fontStyle: 'italic' };
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'signed' || s === 'done') return { color: STATUS_COLORS.green, fontWeight: 600 };
  if (s === 'sent' || s === 'delivered' || s === 'in progress') return { color: STATUS_COLORS.amber, fontWeight: 500 };
  if (s === 'not sent' || s === 'not ready' || s === 'declined' || s === 'voided') return { color: STATUS_COLORS.red, fontWeight: 500 };
  if (s === 'ready to send documents' || s === 'ready') return { color: STATUS_COLORS.blue, fontWeight: 500 };
  return { color: STATUS_COLORS.dark };
}

export function StatusPill({ status }: { status: string | null }) {
  if (!status) return <span style={{ color: STATUS_COLORS.slate, fontSize: 12 }}>--</span>;
  const s = status.toLowerCase();
  let bg = STATUS_COLORS.amberBg, border = STATUS_COLORS.amberBorder, color = STATUS_COLORS.amber;
  if (s === 'completed' || s === 'signed') { bg = STATUS_COLORS.greenBg; border = STATUS_COLORS.greenBorder; color = STATUS_COLORS.green; }
  if (s === 'sent' || s === 'delivered') { bg = STATUS_COLORS.blueBg; border = STATUS_COLORS.blueBorder; color = STATUS_COLORS.blue; }
  if (s === 'voided' || s === 'declined') { bg = STATUS_COLORS.redBg; border = STATUS_COLORS.redBorder; color = STATUS_COLORS.red; }
  if (s === 'created') { bg = STATUS_COLORS.tealBg; border = STATUS_COLORS.tealBorder; color = STATUS_COLORS.teal; }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 12,
      fontSize: 11, fontWeight: 600, background: bg, border: `1px solid ${border}`, color,
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  );
}

export function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  const barColor = color || (pct >= 80 ? STATUS_COLORS.green : pct >= 40 ? STATUS_COLORS.amber : STATUS_COLORS.red);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(91,106,113,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 3, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: barColor, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}
