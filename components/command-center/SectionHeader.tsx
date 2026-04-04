'use client';

import { useTheme } from '@/lib/theme-provider';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  const { THEME } = useTheme();
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: THEME.colors.text, fontFamily: "'Inter', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums', marginBottom: subtitle ? 4 : 0 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 12, color: THEME.colors.textSecondary }}>{subtitle}</p>}
    </div>
  );
}
