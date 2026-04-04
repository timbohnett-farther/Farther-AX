'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency, formatCompactCurrency } from '@/lib/theme';

interface WaterfallStep {
  name: string;
  value: number;
  type: 'add' | 'subtract' | 'total';
}

interface CommissionWaterfallProps {
  steps: WaterfallStep[];
}

export function CommissionWaterfall({ steps }: CommissionWaterfallProps) {
  const chartData = useMemo(() => {
    let cumulative = 0;
    return steps.map((step, idx) => {
      const base = cumulative;
      if (step.type === 'total') {
        cumulative = step.value;
        return {
          name: step.name,
          value: step.value,
          base: 0,
          displayValue: step.value,
          type: step.type
        };
      } else {
        const delta = step.type === 'add' ? step.value : -step.value;
        cumulative += delta;
        return {
          name: step.name,
          value: Math.abs(delta),
          base: step.type === 'add' ? base : cumulative,
          displayValue: step.value,
          type: step.type
        };
      }
    });
  }, [steps]);

  const getBarColor = (type: string) => {
    switch (type) {
      case 'add': return '#10b981'; // green
      case 'subtract': return '#ef4444'; // red
      case 'total': return '#3b82f6'; // blue (steel)
      default: return '#6b7280'; // gray
    }
  };

  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="name"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={(v) => formatCompactCurrency(v)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
                  <p className="text-xs text-gray-400 mb-1">{data.name}</p>
                  <p className="text-sm font-semibold text-white tabular-nums">
                    {formatCurrency(data.displayValue)}
                  </p>
                  {data.type !== 'total' && (
                    <p className="text-xs text-gray-500 mt-1">
                      {data.type === 'add' ? '+' : '-'} {formatCurrency(Math.abs(data.displayValue))}
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Bar dataKey="value" stackId="a">
            {chartData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={getBarColor(entry.type)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
