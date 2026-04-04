'use client';

import { formatCurrency, formatPercent } from '@/lib/theme';

interface Split {
  name: string;
  percentage: number;
  amount: number;
}

interface SplitsTableProps {
  splitsOut: Split[];
  splitsIn: Split[];
  netImpact: number;
}

export function SplitsTable({ splitsOut, splitsIn, netImpact }: SplitsTableProps) {
  const totalOut = splitsOut.reduce((sum, s) => sum + s.amount, 0);
  const totalIn = splitsIn.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="w-full space-y-6 bg-gray-900 rounded-lg p-4">
      {/* Splits Out Section */}
      {splitsOut.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Splits Out
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Name</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">Split %</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {splitsOut.map((split, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="py-2 px-2 text-gray-200">{split.name}</td>
                    <td className="py-2 px-2 text-right text-gray-300 tabular-nums">
                      {formatPercent(split.percentage / 100)}
                    </td>
                    <td className="py-2 px-2 text-right text-red-400 tabular-nums font-medium">
                      -{formatCurrency(split.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-700">
                  <td className="py-2 px-2 text-gray-400 font-semibold">Subtotal</td>
                  <td className="py-2 px-2"></td>
                  <td className="py-2 px-2 text-right text-red-400 tabular-nums font-bold">
                    -{formatCurrency(totalOut)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Splits In Section */}
      {splitsIn.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Splits In
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Name</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">Split %</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {splitsIn.map((split, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="py-2 px-2 text-gray-200">{split.name}</td>
                    <td className="py-2 px-2 text-right text-gray-300 tabular-nums">
                      {formatPercent(split.percentage / 100)}
                    </td>
                    <td className="py-2 px-2 text-right text-green-400 tabular-nums font-medium">
                      +{formatCurrency(split.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-700">
                  <td className="py-2 px-2 text-gray-400 font-semibold">Subtotal</td>
                  <td className="py-2 px-2"></td>
                  <td className="py-2 px-2 text-right text-green-400 tabular-nums font-bold">
                    +{formatCurrency(totalIn)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Net Impact Row */}
      <div className="border-t-2 border-gray-700 pt-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-base font-bold text-white">Net Impact</span>
          <span className={`text-lg font-bold tabular-nums ${
            netImpact >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {netImpact >= 0 ? '+' : ''}{formatCurrency(netImpact)}
          </span>
        </div>
      </div>
    </div>
  );
}
