'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatCompactCurrency } from '@/lib/theme';

interface RevenueSource {
  name: string;
  assets: number;
  revenue: number;
  color: string;
}

interface RevenueBreakdownProps {
  sources: RevenueSource[];
}

export function RevenueBreakdown({ sources }: RevenueBreakdownProps) {
  const chartData = sources.map(s => ({
    name: s.name,
    Assets: s.assets,
    Revenue: s.revenue,
    color: s.color
  }));

  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="name"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            yAxisId="left"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={(v) => formatCompactCurrency(v)}
            label={{ value: 'Assets', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={(v) => formatCompactCurrency(v)}
            label={{ value: 'Revenue', angle: 90, position: 'insideRight', fill: '#9ca3af', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
                  <p className="text-xs text-gray-400 mb-2">{data.name}</p>
                  <p className="text-sm text-white tabular-nums">
                    Assets: <span className="font-semibold">{formatCurrency(data.Assets)}</span>
                  </p>
                  <p className="text-sm text-white tabular-nums mt-1">
                    Revenue: <span className="font-semibold">{formatCurrency(data.Revenue)}</span>
                  </p>
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
            formatter={(value) => <span className="text-sm text-gray-300">{value}</span>}
          />
          <Bar yAxisId="left" dataKey="Assets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
