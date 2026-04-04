'use client';

import { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { useTheme } from '@/lib/theme-provider';
import { AdvisorFilters } from '@/components/advisor-hub/AdvisorFilters';
import { AdvisorTable } from '@/components/advisor-hub/AdvisorTable';
import { AumTrackerTab } from '@/components/advisor-hub/AumTrackerTab';
import { AdvisorTasksTab } from '@/components/advisor-hub/AdvisorTasksTab';
import type {
  Deal,
  SentimentScore,
  AumAdvisor,
  TaskSummary,
  TabKey,
} from '@/components/advisor-hub/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const SWR_OPTS = {
  refreshInterval: 8 * 60 * 60 * 1000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60 * 60 * 1000,
  keepPreviousData: true,
  errorRetryCount: 2,
} as const;

const EARLY_STAGE_IDS = ['2496931', '2496932', '2496934', '100409509'];
const LAUNCH_STAGE_IDS = ['2496935', '2496936', '100411705'];
const LAUNCHED_STAGE_ID = '100411705';
const GRADUATION_DAYS = 90;

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'launch', label: 'Launch to Graduation', icon: '▲' },
  { key: 'early', label: 'Early Deals', icon: '◈' },
  { key: 'completed', label: 'Completed Transitions', icon: '✓' },
  { key: 'aum', label: 'AUM Tracker', icon: '◎' },
  { key: 'advisor-tasks', label: 'Advisor Tasks', icon: '✦' },
];

// ── Stage config ─────────────────────────────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  '2496931': 'Step 1 – First Meeting',
  '2496932': 'Step 2 – Financial Model',
  '2496934': 'Step 3 – Advisor Demo',
  '100409509': 'Step 4 – Discovery Day',
  '2496935': 'Step 5 – Offer Review',
  '2496936': 'Step 6 – Offer Accepted',
  '100411705': 'Step 7 – Launched',
};

// ── Helper Functions ──────────────────────────────────────────────────────────
function getLastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1] || '').toLowerCase();
}

function formatAUM(n: number | null | undefined): string {
  if (!n || isNaN(n)) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function sortByLastName(deals: Deal[]): Deal[] {
  return [...deals].sort((a, b) =>
    getLastName(a.dealname).localeCompare(getLastName(b.dealname))
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdvisorHubPage() {
  const { THEME } = useTheme();
  const { data, isLoading, error } = useSWR('/api/command-center/pipeline', fetcher, SWR_OPTS);
  const { data: sentimentData, mutate: mutateSentiment } = useSWR(
    '/api/command-center/sentiment/scores',
    fetcher,
    SWR_OPTS
  );
  const { data: aumData, isLoading: aumLoading } = useSWR(
    '/api/command-center/aum-tracker',
    fetcher,
    SWR_OPTS
  );
  const { data: taskSummaryData } = useSWR(
    '/api/command-center/tasks/summary',
    fetcher,
    SWR_OPTS
  );
  const { data: alertsData } = useSWR('/api/command-center/alerts', fetcher, SWR_OPTS);
  const { data: graduationsData } = useSWR('/api/command-center/graduations', fetcher, SWR_OPTS);
  const [activeTab, setActiveTab] = useState<TabKey>('launch');
  const [search, setSearch] = useState('');
  const [scoring, setScoring] = useState<Record<string, boolean>>({});
  const [sortCol, setSortCol] = useState<string>('dealname');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [transitionFilter, setTransitionFilter] = useState('all');
  const [aumTierFilter, setAumTierFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [taskPhaseFilter, setTaskPhaseFilter] = useState('all');
  const [alertFilter, setAlertFilter] = useState('all');

  // Build maps for task summary + alerts per deal
  const taskMap = useMemo(() => {
    return (taskSummaryData?.summary ?? {}) as Record<string, TaskSummary>;
  }, [taskSummaryData]);

  const alertMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (alertsData?.alerts) {
      for (const a of alertsData.alerts) {
        if (a.deal_id) map[a.deal_id] = (map[a.deal_id] ?? 0) + 1;
      }
    }
    return map;
  }, [alertsData]);

  // Build a map of deal_id → sentiment score
  const sentimentMap = useMemo(() => {
    const map: Record<string, SentimentScore> = {};
    if (sentimentData?.scores) {
      for (const s of sentimentData.scores) {
        map[s.deal_id] = s;
      }
    }
    return map;
  }, [sentimentData]);

  // Set of deal IDs that have been graduated early
  const graduatedSet = useMemo(() => {
    const set = new Set<string>();
    if (graduationsData?.dealIds) {
      for (const id of graduationsData.dealIds) set.add(id);
    }
    return set;
  }, [graduationsData]);

  const { launchDeals, earlyDeals, completedDeals } = useMemo(() => {
    if (!data?.deals) return { launchDeals: [], earlyDeals: [], completedDeals: [] };
    const deals = (data.deals as Deal[]).filter(d => !d.dealname?.toLowerCase().includes('test'));

    const early = deals.filter(d => EARLY_STAGE_IDS.includes(d.dealstage));

    // Launch to Graduation: Steps 5-6 (all), Step 7 only if launched within 90 days AND not graduated
    const launch = deals.filter(d => {
      if (!LAUNCH_STAGE_IDS.includes(d.dealstage)) return false;
      if (d.dealstage === LAUNCHED_STAGE_ID) {
        if (graduatedSet.has(d.id)) return false; // graduated → goes to completed
        return d.daysSinceLaunch !== null && d.daysSinceLaunch <= GRADUATION_DAYS;
      }
      return true;
    });

    // Completed Transitions: Launched advisors > 90 days, launched with no date set, OR graduated early
    const completed = deals.filter(d => {
      if (d.dealstage !== LAUNCHED_STAGE_ID) return false;
      if (graduatedSet.has(d.id)) return true; // graduated early → always completed
      if (d.daysSinceLaunch === null) return true;
      return d.daysSinceLaunch > GRADUATION_DAYS;
    });

    return {
      launchDeals: sortByLastName(launch),
      earlyDeals: sortByLastName(early),
      completedDeals: sortByLastName(completed),
    };
  }, [data, graduatedSet]);

  const currentDeals = useMemo(() => {
    if (activeTab === 'aum') return [];
    let pool = activeTab === 'launch' ? launchDeals : activeTab === 'early' ? earlyDeals : completedDeals;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      pool = pool.filter(
        d =>
          d.dealname?.toLowerCase().includes(q) ||
          d.current_firm__cloned_?.toLowerCase().includes(q) ||
          d.ownerName?.toLowerCase().includes(q)
      );
    }

    // Transition type filter
    if (transitionFilter !== 'all') {
      pool = pool.filter(d => d.transition_type === transitionFilter);
    }

    // AUM tier filter
    if (aumTierFilter !== 'all') {
      pool = pool.filter(d => {
        const aum = parseFloat(d.transferable_aum ?? '0') || 0;
        if (aumTierFilter === '0-50') return aum < 50_000_000;
        if (aumTierFilter === '50-100') return aum >= 50_000_000 && aum < 100_000_000;
        if (aumTierFilter === '100-200') return aum >= 100_000_000 && aum < 200_000_000;
        if (aumTierFilter === '200+') return aum >= 200_000_000;
        return true;
      });
    }

    // Sentiment filter
    if (sentimentFilter !== 'all') {
      pool = pool.filter(d => {
        const s = sentimentMap[d.id];
        if (sentimentFilter === 'unscored') return !s;
        return s?.tier === sentimentFilter;
      });
    }

    // Task phase filter
    if (taskPhaseFilter !== 'all') {
      pool = pool.filter(d => taskMap[d.id]?.current_phase === taskPhaseFilter);
    }

    // Alert filter
    if (alertFilter !== 'all') {
      pool = pool.filter(d => {
        const count = alertMap[d.id] ?? 0;
        return alertFilter === 'has_alerts' ? count > 0 : count === 0;
      });
    }

    // Sort
    return [...pool].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortCol === 'dealname') return (a.dealname ?? '').localeCompare(b.dealname ?? '') * dir;
      if (sortCol === 'firm')
        return (a.current_firm__cloned_ ?? '').localeCompare(b.current_firm__cloned_ ?? '') * dir;
      if (sortCol === 'aum')
        return (
          ((parseFloat(a.transferable_aum ?? '0') || 0) -
            (parseFloat(b.transferable_aum ?? '0') || 0)) *
          dir
        );
      if (sortCol === 'stage')
        return (STAGE_LABELS[a.dealstage] ?? '').localeCompare(STAGE_LABELS[b.dealstage] ?? '') * dir;
      if (sortCol === 'sentiment') {
        const sa = sentimentMap[a.id]?.composite_score ?? -1;
        const sb = sentimentMap[b.id]?.composite_score ?? -1;
        return (sa - sb) * dir;
      }
      if (sortCol === 'date') {
        const da = a.desired_start_date ?? a.actual_launch_date ?? '';
        const db = b.desired_start_date ?? b.actual_launch_date ?? '';
        return da.localeCompare(db) * dir;
      }
      if (sortCol === 'tasks')
        return ((taskMap[a.id]?.open_tasks ?? 0) - (taskMap[b.id]?.open_tasks ?? 0)) * dir;
      if (sortCol === 'alerts') return ((alertMap[a.id] ?? 0) - (alertMap[b.id] ?? 0)) * dir;
      if (sortCol === 'recruiter') return (a.ownerName ?? '').localeCompare(b.ownerName ?? '') * dir;
      return 0;
    });
  }, [
    activeTab,
    launchDeals,
    earlyDeals,
    completedDeals,
    search,
    transitionFilter,
    aumTierFilter,
    sentimentFilter,
    sentimentMap,
    sortCol,
    sortDir,
    taskPhaseFilter,
    taskMap,
    alertFilter,
    alertMap,
  ]);

  // Filtered AUM advisors
  const filteredAumAdvisors = useMemo(() => {
    if (!aumData?.advisors) return [];
    const advisors = (aumData.advisors as AumAdvisor[]).filter(
      a => !a.advisor_name?.toLowerCase().includes('test')
    );
    if (!search.trim()) return advisors;
    const q = search.toLowerCase();
    return advisors.filter(
      a =>
        a.advisor_name?.toLowerCase().includes(q) || a.prior_firm?.toLowerCase().includes(q)
    );
  }, [aumData, search]);

  // Score a single advisor
  const scoreAdvisor = useCallback(
    async (dealId: string) => {
      setScoring(prev => ({ ...prev, [dealId]: true }));
      try {
        await fetch('/api/command-center/sentiment/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dealId }),
        });
        mutateSentiment();
      } catch (err) {
        console.error('Scoring failed:', err);
      } finally {
        setScoring(prev => ({ ...prev, [dealId]: false }));
      }
    },
    [mutateSentiment]
  );

  // Score all advisors in current tab
  const [batchScoring, setBatchScoring] = useState(false);
  const scoreAll = useCallback(async () => {
    const deals = activeTab === 'launch' ? launchDeals : completedDeals;
    if (deals.length === 0) return;
    setBatchScoring(true);
    try {
      // Score sequentially to avoid rate limits
      for (const deal of deals) {
        setScoring(prev => ({ ...prev, [deal.id]: true }));
        try {
          await fetch('/api/command-center/sentiment/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dealId: deal.id }),
          });
        } catch {
          // Continue scoring others even if one fails
        }
        setScoring(prev => ({ ...prev, [deal.id]: false }));
      }
      mutateSentiment();
    } finally {
      setBatchScoring(false);
    }
  }, [activeTab, launchDeals, completedDeals, mutateSentiment]);

  // Show sentiment column for launch and completed tabs
  const showSentiment = activeTab === 'launch' || activeTab === 'completed';

  // Get the pool of deals for filters
  const filterDeals = activeTab === 'launch' ? launchDeals : activeTab === 'early' ? earlyDeals : completedDeals;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '40px 48px', maxWidth: '100vw', overflowX: 'hidden', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-light.png"
          alt=""
          className="hidden dark:block"
          style={{ position: 'absolute', top: 0, right: 0, opacity: 0.5, width: '120px', height: 'auto' }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-dark.png"
          alt=""
          className="block dark:hidden"
          style={{ position: 'absolute', top: 0, right: 0, opacity: 0.5, width: '120px', height: 'auto' }}
        />
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: 'var(--color-text)',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontVariantNumeric: 'tabular-nums',
              marginBottom: 6,
            }}
          >
            Advisor Hub
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Full directory of advisors across all pipeline stages
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        {[
          {
            label: 'Launch to Graduation',
            value: String(launchDeals.length),
            sub: undefined,
            color: '#3B5A69',
            icon: '▲',
          },
          {
            label: 'Early Deals',
            value: String(earlyDeals.length),
            sub: undefined,
            color: '#4383b4',
            icon: '◈',
          },
          {
            label: 'Completed Transitions',
            value: String(completedDeals.length),
            sub: undefined,
            color: THEME.colors.success,
            icon: '✓',
          },
        ].map(card => (
          <div
            key={card.label}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '20px 24px',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 16,
                right: 18,
                fontSize: 20,
                opacity: 0.25,
                color: card.color,
              }}
            >
              {card.icon}
            </span>
            <p
              style={{
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              {card.label}
            </p>
            <p
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--color-text)',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {card.value}
            </p>
            {card.sub && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{card.sub}</p>}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {(() => {
          const advisors = (aumData?.advisors ?? []) as AumAdvisor[];
          let totalExpectedRevenue = 0;
          for (const adv of advisors) {
            if (adv.expected_aum && adv.fee_rate_bps && adv.fee_rate_bps > 0) {
              totalExpectedRevenue += adv.expected_aum * (adv.fee_rate_bps / 10000);
            }
          }
          const realizedPct =
            totalExpectedRevenue > 0 && aumData?.summary?.total_current_revenue
              ? Math.round((aumData.summary.total_current_revenue / totalExpectedRevenue) * 100)
              : null;
          return [
            {
              label: 'AUM Transfer Rate',
              value:
                aumData?.summary?.overall_transfer_pct != null
                  ? `${aumData.summary.overall_transfer_pct}%`
                  : '—',
              sub: aumData?.summary
                ? `${formatAUM(aumData.summary.total_actual_aum)} of ${formatAUM(aumData.summary.total_expected_aum)}`
                : undefined,
              color: THEME.colors.bronze400,
              icon: '◎',
            },
            {
              label: 'On Book Revenue',
              value: aumData?.summary?.total_current_revenue
                ? formatAUM(aumData.summary.total_current_revenue)
                : '—',
              sub: aumData?.summary?.advisors_with_actual
                ? `${aumData.summary.advisors_with_actual} advisor${aumData.summary.advisors_with_actual > 1 ? 's' : ''} reporting`
                : undefined,
              color: THEME.colors.success,
              icon: '$',
            },
            {
              label: 'Expected Revenue',
              value: totalExpectedRevenue > 0 ? formatAUM(Math.round(totalExpectedRevenue)) : '—',
              sub: realizedPct != null ? `${realizedPct}% realized` : 'At full AUM transfer',
              color: THEME.colors.bronze400,
              icon: '★',
            },
          ];
        })().map(card => (
          <div
            key={card.label}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '20px 24px',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 16,
                right: 18,
                fontSize: 20,
                opacity: 0.25,
                color: card.color,
              }}
            >
              {card.icon}
            </span>
            <p
              style={{
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              {card.label}
            </p>
            <p
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--color-text)',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {card.value}
            </p>
            {card.sub && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs + Search + Score All */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--color-border)' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === 'launch'
                ? launchDeals.length
                : tab.key === 'early'
                ? earlyDeals.length
                : tab.key === 'completed'
                ? completedDeals.length
                : tab.key === 'aum'
                ? aumData?.total ?? 0
                : 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '12px 24px',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#3B5A69' : 'var(--color-text-secondary)',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #3B5A69' : '2px solid transparent',
                  marginBottom: -2,
                  cursor: 'pointer',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'color 150ms ease, border-color 150ms ease',
                }}
              >
                <span style={{ marginRight: 6, fontSize: 11 }}>{tab.icon}</span>
                {tab.label}
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: isActive ? 'rgba(78,112,130,0.1)' : 'rgba(91,106,113,0.08)',
                    color: isActive ? '#3B5A69' : 'var(--color-text-secondary)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {showSentiment && (
            <button
              onClick={scoreAll}
              disabled={batchScoring}
              style={{
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                background: batchScoring ? 'var(--color-border)' : '#3B5A69',
                color: '#FFFFFF',
                border: 'none',
                cursor: batchScoring ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontVariantNumeric: 'tabular-nums',
                transition: 'background 150ms ease',
              }}
            >
              {batchScoring ? 'Scoring...' : '✦ Score All Sentiment'}
            </button>
          )}
          <input
            type="text"
            placeholder="Search advisors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: 240,
              padding: '10px 16px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontVariantNumeric: 'tabular-nums',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* ── Filter Dropdowns ───────────────────────────────────────────────── */}
      {activeTab !== 'aum' && activeTab !== 'advisor-tasks' && (
        <AdvisorFilters
          activeTab={activeTab}
          transitionFilter={transitionFilter}
          setTransitionFilter={setTransitionFilter}
          aumTierFilter={aumTierFilter}
          setAumTierFilter={setAumTierFilter}
          sentimentFilter={sentimentFilter}
          setSentimentFilter={setSentimentFilter}
          taskPhaseFilter={taskPhaseFilter}
          setTaskPhaseFilter={setTaskPhaseFilter}
          alertFilter={alertFilter}
          setAlertFilter={setAlertFilter}
          deals={filterDeals}
          resultCount={currentDeals.length}
        />
      )}

      {/* Loading / Error */}
      {isLoading && activeTab !== 'aum' && activeTab !== 'advisor-tasks' && (
        <div className="px-4 py-4 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="shimmer h-16 rounded-lg" />
          ))}
        </div>
      )}
      {error && activeTab !== 'aum' && activeTab !== 'advisor-tasks' && (
        <div style={{ textAlign: 'center', padding: 60, color: THEME.colors.error, fontSize: 14 }}>
          Failed to load pipeline data
        </div>
      )}

      {/* ═══════ AUM TRACKER TAB ═══════ */}
      {activeTab === 'aum' && (
        <AumTrackerTab advisors={filteredAumAdvisors} loading={aumLoading} search={search} />
      )}

      {/* ═══════ ADVISOR TASKS TAB ═══════ */}
      {activeTab === 'advisor-tasks' && <AdvisorTasksTab />}

      {/* ═══════ PIPELINE TABS (Launch / Early / Completed) ═══════ */}
      {activeTab !== 'aum' && activeTab !== 'advisor-tasks' && !isLoading && !error && (
        <AdvisorTable
          deals={currentDeals}
          activeTab={activeTab}
          sentimentMap={sentimentMap}
          taskMap={taskMap}
          alertMap={alertMap}
          scoreAdvisor={scoreAdvisor}
          scoring={scoring}
          sortCol={sortCol}
          setSortCol={setSortCol}
          sortDir={sortDir}
          setSortDir={setSortDir}
        />
      )}

      {/* Total footer */}
      {activeTab !== 'aum' && activeTab !== 'advisor-tasks' && !isLoading && !error && data?.deals && (
        <div
          style={{
            marginTop: 24,
            padding: '12px 20px',
            fontSize: 12,
            color: 'var(--color-text-secondary)',
            textAlign: 'right',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {data.deals.length} total advisors across all stages
        </div>
      )}
    </div>
  );
}
