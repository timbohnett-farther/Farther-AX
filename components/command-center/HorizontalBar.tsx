'use client';

import { useTheme } from '@/lib/theme-provider';

interface HorizontalBarItem {
  label: string;
  value: number;
  color: string;
  sub?: string;
  display?: string;
  onClick?: () => void;
}

interface HorizontalBarProps {
  items: HorizontalBarItem[];
  maxValue: number;
  perItemMax?: number[];
}

export function HorizontalBar({ items, maxValue, perItemMax }: HorizontalBarProps) {
  const { THEME } = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => {
        const cap = perItemMax?.[i] ?? maxValue;
        return (
          <div
            key={i}
            onClick={item.onClick}
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: item.onClick ? 'pointer' : 'default', borderRadius: 4, transition: 'background 150ms ease' }}
            onMouseEnter={e => { if (item.onClick) (e.currentTarget as HTMLDivElement).style.background = 'rgba(248,244,240,0.04)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            <div style={{ width: 130, fontSize: 12, color: THEME.colors.textSecondary, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.label}
            </div>
            <div style={{ flex: 1, height: 22, background: 'rgba(91,106,113,0.06)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${cap > 0 ? Math.max((item.value / cap) * 100, 2) : 0}%`,
                background: item.color, transition: 'width 0.4s ease',
              }} />
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 600, color: THEME.colors.text }}>
                {item.display ?? item.value}{item.sub ? ` · ${item.sub}` : ''}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
