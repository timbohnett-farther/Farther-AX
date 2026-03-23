'use client';

interface MoMDeltaProps {
  value: number;
  format?: 'percent' | 'currency' | 'number' | 'bps';
  className?: string;
}

export const MoMDelta: React.FC<MoMDeltaProps> = ({
  value,
  format = 'percent',
  className = '',
}) => {
  if (value === 0 || isNaN(value) || !isFinite(value)) {
    return <span className={`text-xs text-white/30 ${className}`}>--</span>;
  }

  const isPositive = value > 0;
  const arrow = isPositive ? '\u2191' : '\u2193';
  const color = isPositive ? 'text-emerald-400' : 'text-red-400';

  let display: string;
  switch (format) {
    case 'currency':
      display = `${arrow}$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      break;
    case 'bps':
      display = `${arrow}${Math.abs(value).toFixed(1)} bps`;
      break;
    case 'number':
      display = `${arrow}${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      break;
    case 'percent':
    default:
      display = `${arrow}${Math.abs(value).toFixed(1)}%`;
      break;
  }

  return (
    <span className={`text-xs font-medium ${color} ${className}`}>
      {display}
    </span>
  );
};

export default MoMDelta;
