'use client';

import { formatCurrency, formatPercent } from '@/lib/theme';

interface TierRow {
  tier: string;
  threshold: number;
  rate: number;
  revenueInTier: number;
  commissionPerTier: number;
}

interface TierTotal {
  revenue: number;
  commission: number;
  effectiveRate: number;
}

interface TierCalculationTableProps {
  tiers: TierRow[];
  total: TierTotal;
}

export function TierCalculationTable({ tiers, total }: TierCalculationTableProps) {
  return (
    <div className="w-full overflow-x-auto bg-gray-900 rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Tier
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Threshold
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Rate
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Revenue in Tier
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Commission
            </th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier, idx) => (
            <tr
              key={idx}
              className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
            >
              <td className="py-3 px-4 text-gray-100 font-medium">{tier.tier}</td>
              <td className="py-3 px-4 text-gray-300 text-right tabular-nums">
                {formatCurrency(tier.threshold)}
              </td>
              <td className="py-3 px-4 text-gray-300 text-right tabular-nums">
                {formatPercent(tier.rate / 100)}
              </td>
              <td className="py-3 px-4 text-gray-300 text-right tabular-nums">
                {formatCurrency(tier.revenueInTier)}
              </td>
              <td className="py-3 px-4 text-white text-right tabular-nums font-semibold">
                {formatCurrency(tier.commissionPerTier)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-700 bg-gray-800/50">
            <td className="py-4 px-4 text-white font-bold">Total</td>
            <td className="py-4 px-4"></td>
            <td className="py-4 px-4 text-right text-gray-300 tabular-nums font-semibold">
              {formatPercent(total.effectiveRate / 100)}
            </td>
            <td className="py-4 px-4 text-white text-right tabular-nums font-bold">
              {formatCurrency(total.revenue)}
            </td>
            <td className="py-4 px-4 text-white text-right tabular-nums font-bold">
              {formatCurrency(total.commission)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
