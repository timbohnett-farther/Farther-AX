'use client';

import { useMemo } from 'react';

interface Period {
  date: string;
  advisorCount: number;
}

interface PeriodSelectorProps {
  periods: Period[];
  selected: string;
  onChange: (period: string) => void;
}

export function PeriodSelector({ periods, selected, onChange }: PeriodSelectorProps) {
  const formattedPeriods = useMemo(() => {
    return periods.map(p => ({
      value: p.date,
      label: formatPeriod(p.date),
      count: p.advisorCount
    }));
  }, [periods]);

  return (
    <div className="relative inline-block">
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-gray-900 border border-gray-700 text-gray-100 rounded-lg px-4 py-2 pr-10 text-sm font-medium hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        {formattedPeriods.map(p => (
          <option key={p.value} value={p.value}>
            {p.label} ({p.count} advisors)
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

function formatPeriod(date: string): string {
  const [year, month] = date.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}
