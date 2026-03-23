'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { MoMDelta } from './MoMDelta';
import { formatCompactCurrency, formatCurrency } from '@/lib/design-tokens';

export interface AccountDetail {
  account_name: string;
  account_number: string;
  account_value: number;
  billed_value: number;
  rate_bps: number;
  fee_schedule: string;
  total_period_fee: number;
  cash_available: number;
  cash_difference: number;
  custodian: string;
  warnings: string | null;
  model_portfolio: string | null;
  trading_status: string | null;
}

export interface RelationshipData {
  relationship: string;
  aum: number;
  aumChange: number;
  revenue: number;
  accounts: number;
  bps: number;
  zeroBpsAum: number;
  cashShortfall: number;
  custodians: string[];
  billingStartDate: string | null;
  isNew: boolean;
  accountDetails?: AccountDetail[];
}

interface RelationshipRowProps {
  data: RelationshipData;
  onExpand?: (relationship: string) => void;
  isExpanded?: boolean;
  isLoading?: boolean;
}

export const RelationshipRow: React.FC<RelationshipRowProps> = ({
  data,
  onExpand,
  isExpanded = false,
  isLoading = false,
}) => {
  const [open, setOpen] = useState(isExpanded);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && onExpand && !data.accountDetails) {
      onExpand(data.relationship);
    }
  };

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-smooth"
      >
        <span className="text-white/40 shrink-0">
          {open ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronRightIcon className="w-4 h-4" />
          )}
        </span>
        <div className="flex-1 grid grid-cols-6 gap-3 items-center text-sm">
          <div className="col-span-2 flex items-center gap-2">
            <span className="text-white font-medium truncate">{data.relationship}</span>
            {data.isNew && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 rounded">
                NEW
              </span>
            )}
          </div>
          <div>
            <span className="text-white">{formatCompactCurrency(data.aum)}</span>
            {data.aumChange !== 0 && (
              <span className="ml-1">
                <MoMDelta value={data.aumChange} />
              </span>
            )}
          </div>
          <div className="text-white">{formatCompactCurrency(data.revenue)}</div>
          <div className="text-white">{data.bps.toFixed(1)} bps</div>
          <div className="flex gap-3 text-xs text-white/50">
            <span>{data.accounts} accts</span>
            {data.zeroBpsAum > 0 && (
              <span className="text-amber-400">0-BPS: {formatCompactCurrency(data.zeroBpsAum)}</span>
            )}
            {data.cashShortfall < 0 && (
              <span className="text-red-400">Short: {formatCompactCurrency(Math.abs(data.cashShortfall))}</span>
            )}
          </div>
        </div>
      </button>

      {open && (
        <div className="pl-11 pr-4 pb-3">
          {isLoading ? (
            <div className="shimmer h-20 rounded-lg" />
          ) : data.accountDetails && data.accountDetails.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/40 border-b border-white/5">
                  <th className="text-left py-2 pr-3 font-medium">Account</th>
                  <th className="text-right py-2 px-3 font-medium">Value</th>
                  <th className="text-right py-2 px-3 font-medium">Billed</th>
                  <th className="text-right py-2 px-3 font-medium">BPS</th>
                  <th className="text-right py-2 px-3 font-medium">Fee</th>
                  <th className="text-left py-2 px-3 font-medium">Schedule</th>
                  <th className="text-left py-2 px-3 font-medium">Custodian</th>
                  <th className="text-left py-2 px-3 font-medium">Model</th>
                  <th className="text-left py-2 pl-3 font-medium">Warnings</th>
                </tr>
              </thead>
              <tbody>
                {data.accountDetails.map((acct) => (
                  <tr
                    key={acct.account_number}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02]"
                  >
                    <td className="py-2 pr-3 text-white/70">{acct.account_name}</td>
                    <td className="py-2 px-3 text-right text-white/70">{formatCurrency(acct.account_value)}</td>
                    <td className="py-2 px-3 text-right text-white/70">{formatCurrency(acct.billed_value)}</td>
                    <td className={`py-2 px-3 text-right ${acct.rate_bps === 0 ? 'text-amber-400' : 'text-white/70'}`}>
                      {acct.rate_bps.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 text-right text-white/70">{formatCurrency(acct.total_period_fee)}</td>
                    <td className="py-2 px-3 text-white/50 truncate max-w-[120px]">{acct.fee_schedule}</td>
                    <td className="py-2 px-3 text-white/50">{acct.custodian}</td>
                    <td className="py-2 px-3 text-white/50 truncate max-w-[100px]">{acct.model_portfolio || '--'}</td>
                    <td className="py-2 pl-3 text-amber-400 truncate max-w-[120px]">{acct.warnings || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-white/30 py-2">No account details available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RelationshipRow;
