'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Select, SelectItem } from '@tremor/react';
import { StatCard, FilterBar } from '@/components/ui';
import { PeriodSelector, TeamCard, TierBadge } from '@/components/billing';
import type { TeamCardData } from '@/components/billing';
import { formatCompactCurrency } from '@/lib/design-tokens';
import { UserGroupIcon, CurrencyDollarIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SWR_OPTS = {
  refreshInterval: 24 * 60 * 60 * 1000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60 * 60 * 1000,
  keepPreviousData: true,
  errorRetryCount: 2,
} as const;

const TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'Principal', label: 'Principal' },
  { value: 'Managing Director', label: 'Managing Director' },
  { value: 'SVP', label: 'SVP' },
  { value: 'VP', label: 'VP' },
  { value: 'Associate', label: 'Associate' },
];

export default function TeamLeaderboardPage() {
  const [period, setPeriod] = useState('');
  const [sort, setSort] = useState('aum');
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  // Fetch periods from overview
  const { data: overviewData } = useSWR('/api/command-center/billing/overview', fetcher, SWR_OPTS);
  const periods = overviewData?.periods || [];

  const activePeriod = period || overviewData?.selectedPeriod || '';

  const { data, error, isLoading } = useSWR(
    activePeriod ? `/api/command-center/billing/teams?period=${activePeriod}&sort=${sort}` : null,
    fetcher,
    SWR_OPTS,
  );

  const filteredTeams = useMemo(() => {
    if (!data?.teams) return [];
    return data.teams.filter((t: TeamCardData) => {
      const matchSearch = !search || t.team.toLowerCase().includes(search.toLowerCase());
      const matchTier = tierFilter === 'all' || t.tier === tierFilter;
      return matchSearch && matchTier;
    });
  }, [data?.teams, search, tierFilter]);

  if (isLoading) {
    return (
      <div className="px-10 py-8">
        <div className="shimmer h-10 w-64 rounded-xl mb-8" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => <div key={i} className="shimmer h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="shimmer h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="px-10 py-16 text-red-400">Error loading team data</div>;
  }

  const { summary } = data;

  return (
    <div className="px-10 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif mb-1">Team Leaderboard</h1>
          <p className="text-sm text-white/50">Ranked by performance across all billing teams</p>
        </div>
        {periods.length > 0 && (
          <PeriodSelector
            periods={periods}
            selected={activePeriod}
            onChange={setPeriod}
          />
        )}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Teams"
          value={summary.totalTeams}
          icon={<UserGroupIcon className="w-5 h-5 text-teal" />}
        />
        <StatCard
          title="Avg AUM / Team"
          value={formatCompactCurrency(summary.avgAumPerTeam)}
          icon={<BuildingOffice2Icon className="w-5 h-5 text-teal" />}
        />
        <StatCard
          title="Avg Revenue / Team"
          value={formatCompactCurrency(summary.avgRevenuePerTeam)}
          icon={<CurrencyDollarIcon className="w-5 h-5 text-teal" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search teams..."
          className="flex-1"
        />
        <div className="flex gap-3">
          <Select value={sort} onValueChange={setSort} placeholder="Sort by" className="w-40">
            <SelectItem value="aum">AUM</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="bps">BPS</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
          </Select>
          <Select value={tierFilter} onValueChange={setTierFilter} placeholder="Tier" className="w-44">
            {TIER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Tier Summary Badges */}
      <div className="flex gap-3 mb-6">
        {['Principal', 'Managing Director', 'SVP', 'VP', 'Associate'].map((tier) => {
          const count = data.teams.filter((t: TeamCardData) => t.tier === tier).length;
          if (count === 0) return null;
          return (
            <button
              key={tier}
              onClick={() => setTierFilter(tierFilter === tier ? 'all' : tier)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-smooth ${
                tierFilter === tier ? 'bg-teal/20 ring-1 ring-teal' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <TierBadge tier={tier} />
              <span className="text-white/50">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTeams.map((team: TeamCardData) => (
          <TeamCard key={team.team} data={team} period={activePeriod} />
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-16 text-white/30">
          No teams match your search criteria
        </div>
      )}
    </div>
  );
}
