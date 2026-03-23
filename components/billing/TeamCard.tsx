'use client';

import Link from 'next/link';
import { TierBadge } from './TierBadge';
import { MoMDelta } from './MoMDelta';
import { MiniSparkline } from './MiniSparkline';
import { formatCompactCurrency } from '@/lib/design-tokens';

export interface TeamCardData {
  team: string;
  rank: number;
  rankChange: number;
  tier: string;
  aum: number;
  aumChangePct: number;
  revenue: number;
  revenueChangePct: number;
  bps: number;
  bpsChange: number;
  relationships: number;
  relChange: number;
  accounts: number;
  zeroBpsAum: number;
  pctOfFirmAUM: number;
  aumSeries: number[];
}

interface TeamCardProps {
  data: TeamCardData;
  period: string;
}

export const TeamCard: React.FC<TeamCardProps> = ({ data, period }) => {
  const rankArrow =
    data.rankChange > 0
      ? `\u2191${data.rankChange}`
      : data.rankChange < 0
        ? `\u2193${Math.abs(data.rankChange)}`
        : '--';

  return (
    <Link
      href={`/command-center/billing/teams/${encodeURIComponent(data.team)}?period=${period}`}
      className="block glass-card p-5 transition-smooth hover:transform hover:-translate-y-1 hover:border-teal/30"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <TierBadge tier={data.tier} />
          <h3 className="text-base font-semibold text-white truncate max-w-[240px]">
            {data.team}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs text-white/40">Rank #{data.rank}</span>
          <span className={`ml-1 text-xs ${data.rankChange > 0 ? 'text-emerald-400' : data.rankChange < 0 ? 'text-red-400' : 'text-white/30'}`}>
            ({rankArrow})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <p className="text-xs text-white/40 mb-0.5">AUM</p>
          <p className="text-sm font-semibold text-white">{formatCompactCurrency(data.aum)}</p>
          <MoMDelta value={data.aumChangePct} />
        </div>
        <div>
          <p className="text-xs text-white/40 mb-0.5">Revenue</p>
          <p className="text-sm font-semibold text-white">{formatCompactCurrency(data.revenue)}</p>
          <MoMDelta value={data.revenueChangePct} />
        </div>
        <div>
          <p className="text-xs text-white/40 mb-0.5">BPS</p>
          <p className="text-sm font-semibold text-white">{data.bps.toFixed(1)}</p>
          <MoMDelta value={data.bpsChange} format="bps" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex gap-4 text-xs text-white/50">
          <span>Rels: {data.relationships} <MoMDelta value={data.relChange} format="number" /></span>
          <span>Accts: {data.accounts}</span>
          {data.zeroBpsAum > 0 && (
            <span className="text-amber-400">
              0-BPS: {formatCompactCurrency(data.zeroBpsAum)}
            </span>
          )}
        </div>
        <MiniSparkline data={data.aumSeries} />
      </div>
    </Link>
  );
};

export default TeamCard;
