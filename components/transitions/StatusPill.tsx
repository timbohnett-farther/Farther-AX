'use client';

// Status colors are static and theme-independent (status meaning is consistent across themes)
const C = {
  dark: '#F8F4F0', slate: 'rgba(227,211,197,0.5)',
  green: '#4ade80', greenBg: 'rgba(74,222,128,0.2)', greenBorder: 'rgba(74,222,128,0.35)',
  amber: '#fbbf24', amberBg: 'rgba(251,191,36,0.2)', amberBorder: 'rgba(251,191,36,0.35)',
  red: '#f87171', redBg: 'rgba(248,113,113,0.2)', redBorder: 'rgba(248,113,113,0.35)',
  blue: '#7CA4B4', blueBg: 'rgba(124,164,180,0.2)', blueBorder: 'rgba(124,164,180,0.35)',
  teal: '#3B5A69', tealBg: 'rgba(59,90,105,0.2)', tealBorder: 'rgba(59,90,105,0.35)',
};

export function statusStyle(status: string | null): React.CSSProperties {
  if (!status) return { color: C.slate, fontStyle: 'italic' };
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'signed' || s === 'done') return { color: C.green, fontWeight: 600 };
  if (s === 'sent' || s === 'delivered' || s === 'in progress') return { color: C.amber, fontWeight: 500 };
  if (s === 'not sent' || s === 'not ready' || s === 'declined' || s === 'voided') return { color: C.red, fontWeight: 500 };
  if (s === 'ready to send documents' || s === 'ready') return { color: C.blue, fontWeight: 500 };
  return { color: C.dark };
}

export function StatusPill({ status }: { status: string | null }) {
  if (!status) return <span style={{ color: C.slate, fontSize: 12 }}>--</span>;
  const s = status.toLowerCase();
  let bg = C.amberBg, border = C.amberBorder, color = C.amber;
  if (s === 'completed' || s === 'signed') { bg = C.greenBg; border = C.greenBorder; color = C.green; }
  if (s === 'sent' || s === 'delivered') { bg = C.blueBg; border = C.blueBorder; color = C.blue; }
  if (s === 'voided' || s === 'declined') { bg = C.redBg; border = C.redBorder; color = C.red; }
  if (s === 'created') { bg = C.tealBg; border = C.tealBorder; color = C.teal; }
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
  const barColor = color || (pct >= 80 ? C.green : pct >= 40 ? C.amber : C.red);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(91,106,113,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 3, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: barColor, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}
