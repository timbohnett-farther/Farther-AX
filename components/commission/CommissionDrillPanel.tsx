'use client';

import { useEffect } from 'react';
import { formatCurrency } from '@/lib/theme';

interface DrillDataRow {
  label: string;
  value: number;
  pct?: number;
}

interface CommissionDrillPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  data: DrillDataRow[];
  metric?: string;
}

export function CommissionDrillPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  data,
  metric = 'value'
}: CommissionDrillPanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-gray-900 shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Close panel"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Data Rows */}
        <div className="px-6 py-4 space-y-3">
          {data.map((row, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-gray-300 font-medium">{row.label}</span>
                <span className="text-white font-semibold tabular-nums">
                  {formatCurrency(row.value)}
                </span>
              </div>

              {/* Bar */}
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(row.value / maxValue) * 100}%` }}
                />
              </div>

              {/* Optional Percentage */}
              {row.pct !== undefined && (
                <div className="text-xs text-gray-500 tabular-nums">
                  {row.pct.toFixed(1)}% of total
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Summary */}
        {metric && (
          <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total {metric}</span>
              <span className="text-white font-semibold tabular-nums">
                {formatCurrency(data.reduce((sum, row) => sum + row.value, 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
