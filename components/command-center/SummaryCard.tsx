'use client';

import { useTheme } from '@/lib/theme-provider';

interface SummaryCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  icon?: string;
  iconColor?: string;
  onClick?: () => void;
}

export function SummaryCard({ label, value, sub, accent, icon, iconColor, onClick }: SummaryCardProps) {
  const { THEME } = useTheme();
  return (
    <div
      onClick={onClick}
      style={{
        background: accent ? THEME.colors.teal : THEME.colors.surface,
        border: `1px solid ${accent ? THEME.colors.teal : THEME.colors.border}`,
        borderRadius: 8, padding: '20px 24px', position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
      }}
      onMouseEnter={e => { if (onClick) { (e.currentTarget as HTMLDivElement).style.borderColor = iconColor || THEME.colors.teal; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px ${iconColor || THEME.colors.teal}40`; } }}
      onMouseLeave={e => { if (onClick) { (e.currentTarget as HTMLDivElement).style.borderColor = accent ? THEME.colors.teal : THEME.colors.border; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; } }}
    >
      {icon && (
        <span style={{ position: 'absolute', top: 16, right: 18, fontSize: 20, opacity: 0.6, color: iconColor || (accent ? "#FFFFFF" : THEME.colors.textSecondary) }}>{icon}</span>
      )}
      <p style={{ fontSize: 11, color: accent ? 'rgba(255,255,255,0.7)' : THEME.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: accent ? THEME.colors.ivory : THEME.colors.text, fontFamily: "'Inter', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: accent ? 'rgba(255,255,255,0.6)' : THEME.colors.textSecondary, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}
