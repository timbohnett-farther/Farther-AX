'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatCompactCurrency } from '@/lib/theme';

interface TrendDataPoint {
  period: string;
  aum: number;
  revenue: number;
  contribution: number;
}

interface AdvisorTrendChartProps {
  data: TrendDataPoint[];
}

export function AdvisorTrendChart({ data }: AdvisorTrendChartProps) {
  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="aumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="contributionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

          <XAxis
            dataKey="period"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />

          {/* Left Y-axis for AUM */}
          <YAxis
            yAxisId="left"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={(v) => formatCompactCurrency(v)}
            label={{ value: 'AUM', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
          />

          {/* Right Y-axis for Revenue & Contribution */}
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={(v) => formatCompactCurrency(v)}
            label={{ value: 'Revenue / Contribution', angle: 90, position: 'insideRight', fill: '#9ca3af', fontSize: 12 }}
          />

          <Tooltip
            cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '5 5' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
                  <p className="text-xs text-gray-400 mb-2">{payload[0].payload.period}</p>
                  <div className="space-y-1">
                    <p className="text-sm text-white tabular-nums">
                      <span className="text-blue-400">●</span> AUM: <span className="font-semibold">{formatCurrency(payload[0].payload.aum)}</span>
                    </p>
                    <p className="text-sm text-white tabular-nums">
                      <span className="text-green-400">●</span> Revenue: <span className="font-semibold">{formatCurrency(payload[0].payload.revenue)}</span>
                    </p>
                    <p className="text-sm text-white tabular-nums">
                      <span className="text-amber-400">●</span> Contribution: <span className="font-semibold">{formatCurrency(payload[0].payload.contribution)}</span>
                    </p>
                  </div>
                </div>
              );
            }}
          />

          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="line"
            formatter={(value) => <span className="text-sm text-gray-300">{value}</span>}
          />

          <Area
            yAxisId="left"
            type="monotone"
            dataKey="aum"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#aumGradient)"
            name="AUM"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            name="Revenue"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="contribution"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#contributionGradient)"
            name="Contribution"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
