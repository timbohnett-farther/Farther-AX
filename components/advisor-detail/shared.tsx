'use client';

import { useTheme } from '@/lib/theme-provider';
import { STAGE_LABELS } from './types';

export function Section({ title, children, highlight, icon }: { title: string; children: React.ReactNode; highlight?: boolean; icon?: string }) {
  const { THEME } = useTheme();
  return (
    <div style={{
      background: THEME.colors.surface, border: `1px solid ${highlight ? THEME.colors.teal : THEME.colors.border}`,
      borderRadius: 10, marginBottom: 20, overflow: 'hidden',
      boxShadow: highlight ? '0 0 0 1px rgba(29,118,130,0.2)' : undefined,
    }}>
      <div style={{
        padding: '12px 20px', borderBottom: `1px solid ${highlight ? 'rgba(29,118,130,0.15)' : THEME.colors.border}`,
        background: highlight ? 'rgba(29,118,130,0.05)' : '#2a2a2a',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <h3 style={{ fontSize: 12, fontWeight: 700, color: highlight ? THEME.colors.teal : THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title}
        </h3>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

export function Field({ label, value, wide, highlight }: { label: string; value: React.ReactNode; wide?: boolean; highlight?: boolean }) {
  const { THEME } = useTheme();
  if (!value || value === '—' || value === 'null') return null;
  return (
    <div style={{ marginBottom: 12, gridColumn: wide ? 'span 2' : undefined }}>
      <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 14, color: highlight ? THEME.colors.teal : THEME.colors.text, fontWeight: highlight ? 600 : 400, lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}

export function Grid({ children, cols = 3 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0 24px' }}>
      {children}
    </div>
  );
}

export function Badge({ label, color }: { label: string; color?: string }) {
  const { THEME } = useTheme();
  const c = color ?? THEME.colors.teal;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 6,
      background: `${c}28`, color: c, fontSize: 12, fontWeight: 600,
      marginRight: 6, marginBottom: 6, border: `1px solid ${c}40`,
    }}>{label}</span>
  );
}

export function StageBadge({ stageId }: { stageId: string }) {
  const { THEME } = useTheme();
  const isLate = ['2496936', '100411705'].includes(stageId);
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: 20,
      background: isLate ? 'rgba(29,118,130,0.22)' : 'rgba(91,106,113,0.18)',
      color: isLate ? '#5ec4cf' : THEME.colors.text, fontSize: 12, fontWeight: 600,
      border: `1px solid ${isLate ? 'rgba(29,118,130,0.35)' : 'rgba(91,106,113,0.25)'}`,
    }}>
      {STAGE_LABELS[stageId] ?? stageId}
    </span>
  );
}

export function IntelCard({ label, items, color, icon }: { label: string; items: string[]; color: string; icon: string }) {
  const { THEME } = useTheme();
  if (!items || items.length === 0) return null;
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 8, border: `1px solid ${color}22`,
      background: `${color}08`, marginBottom: 12,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {icon} {label}
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 13, color: THEME.colors.text, lineHeight: 1.6, marginBottom: 4 }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  const { THEME } = useTheme();
  return <p style={{ fontSize: 13, color: THEME.colors.textMuted, textAlign: 'center', padding: '24px 0' }}>{message}</p>;
}

export function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const { THEME } = useTheme();
  return (
    <div style={{
      padding: '16px 20px', borderRadius: 8, background: 'rgba(91,106,113,0.04)',
      border: `1px solid ${THEME.colors.border}`, textAlign: 'center',
    }}>
      <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color: color ?? THEME.colors.text, fontFamily: "'Inter', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums' }}>{value}</p>
    </div>
  );
}
