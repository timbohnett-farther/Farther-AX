'use client';

import { Select, SelectItem } from '@tremor/react';

interface PeriodSelectorProps {
  periods: string[];
  selected: string;
  onChange: (period: string) => void;
  className?: string;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  periods,
  selected,
  onChange,
  className = '',
}) => {
  const formatLabel = (p: string) => {
    const d = new Date(p + 'T12:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <Select
      value={selected}
      onValueChange={onChange}
      placeholder="Select period"
      className={`w-56 ${className}`}
    >
      {periods.map((p) => (
        <SelectItem key={p} value={p}>
          {formatLabel(p)}
        </SelectItem>
      ))}
    </Select>
  );
};

export default PeriodSelector;
