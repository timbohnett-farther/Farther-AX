'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useTheme } from '@/lib/theme-provider';
import { Section } from './shared';
import { ComplexityData } from './types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface ComplexityPanelProps {
  dealId: string;
}

export function ComplexityPanel({ dealId }: ComplexityPanelProps) {
  const { THEME } = useTheme();
  const { data, isLoading } = useSWR<ComplexityData>(
    dealId ? `/api/command-center/complexity?dealId=${dealId}` : null, fetcher
  );
  const [expanded, setExpanded] = useState(false);

  if (isLoading || !data || !data.score) return null;

  const { score, tier, tierColor, factors, staffingRec, estimatedDays } = data;

  return (
    <Section title="Transition Complexity" highlight icon="◉">
      <div onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: `${tierColor}18`, border: `1px solid ${tierColor}30` }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: tierColor, fontFamily: "'Inter', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums' }}>{score}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: tierColor }}>{tier}</span>
          </div>
          <div style={{ width: 80, height: 6, background: 'rgba(91,106,113,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min((score / 105) * 100, 100)}%`, background: tierColor, borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: THEME.colors.textMuted }}>Est. {estimatedDays} days</span>
          <span style={{ fontSize: 14, color: THEME.colors.textMuted }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {expanded && (
        <>
          <div style={{ padding: '10px 14px', borderRadius: 6, marginBottom: 16, background: `${tierColor}08`, border: `1px solid ${tierColor}15` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: tierColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Staffing Recommendation</p>
            <p style={{ fontSize: 13, color: THEME.colors.text, lineHeight: 1.5 }}>{staffingRec}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {factors.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: i < factors.length - 1 ? `1px solid ${THEME.colors.border}` : 'none' }}>
                <div style={{ width: 90, fontSize: 10, fontWeight: 600, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.category}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: THEME.colors.text }}>{f.factor}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: f.points > 0 ? tierColor : THEME.colors.textMuted }}>{f.points}/{f.maxPoints}</span>
                  </div>
                  <p style={{ fontSize: 11, color: THEME.colors.textMuted, lineHeight: 1.4 }}>{f.detail}</p>
                </div>
                <div style={{ width: 50, height: 4, background: 'rgba(91,106,113,0.08)', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ height: '100%', borderRadius: 2, width: f.maxPoints > 0 ? `${(f.points / f.maxPoints) * 100}%` : '0%', background: f.points > 0 ? tierColor : 'transparent' }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}
