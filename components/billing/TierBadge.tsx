'use client';

const TIER_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  Principal: { label: 'Principal', bg: 'bg-amber-500/20', text: 'text-amber-400' },
  'Managing Director': { label: 'MD', bg: 'bg-teal/20', text: 'text-teal' },
  SVP: { label: 'SVP', bg: 'bg-blue-400/20', text: 'text-blue-300' },
  VP: { label: 'VP', bg: 'bg-slate/20', text: 'text-slate' },
  Associate: { label: 'Associate', bg: 'bg-white/10', text: 'text-white/50' },
};

interface TierBadgeProps {
  tier: string;
  className?: string;
}

export function getTierFromRevenue(annualizedRevenue: number): string {
  if (annualizedRevenue >= 1_000_000) return 'Principal';
  if (annualizedRevenue >= 750_000) return 'Managing Director';
  if (annualizedRevenue >= 300_000) return 'SVP';
  if (annualizedRevenue >= 150_000) return 'VP';
  return 'Associate';
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, className = '' }) => {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.Associate;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default TierBadge;
