'use client';

interface ComplexityBadgeProps {
  score: number;
  tier: string;
  tierColor: string;
}

export function ComplexityBadge({ score, tier, tierColor }: ComplexityBadgeProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} title={`${tier} complexity — Score: ${score}/105`}>
      <span style={{
        fontSize: 12, fontWeight: 700, color: tierColor,
        fontFamily: "'Inter', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums',
      }}>
        {score}
      </span>
      <div style={{ width: 32, height: 4, background: 'rgba(91,106,113,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${Math.min((score / 105) * 100, 100)}%`,
          background: tierColor,
        }} />
      </div>
    </div>
  );
}
