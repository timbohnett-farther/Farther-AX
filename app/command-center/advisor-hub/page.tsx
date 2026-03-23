'use client';

import { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  dark: '#FAF7F2', white: '#1a1a1a', slate: 'rgba(250,247,242,0.5)',
  teal: '#1d7682', bg: '#111111',
  cardBg: '#2f2f2f', border: 'rgba(250,247,242,0.08)',
  green: '#4ade80', greenBg: 'rgba(74,222,128,0.2)',
  amber: '#fbbf24', amberBg: 'rgba(251,191,36,0.2)', amberBorder: 'rgba(251,191,36,0.35)',
  red: '#f87171', redBg: 'rgba(248,113,113,0.2)', redBorder: 'rgba(248,113,113,0.35)',
  gold: '#fbbf24', goldBg: 'rgba(251,191,36,0.2)',
};

// ── Sentiment tier config (mirrors lib/sentiment.ts) ─────────────────────────
const TIER_CONFIG: Record<string, { color: string; bgColor: string; icon: string }> = {
  'Advocate':  { color: '#4ade80', bgColor: 'rgba(74,222,128,0.2)',   icon: '★' },
  'Positive':  { color: '#5ec4cf', bgColor: 'rgba(29,118,130,0.2)',  icon: '▲' },
  'Neutral':   { color: '#fbbf24', bgColor: 'rgba(251,191,36,0.18)', icon: '●' },
  'At Risk':   { color: '#fb923c', bgColor: 'rgba(251,146,60,0.2)', icon: '◈' },
  'High Risk': { color: '#f87171', bgColor: 'rgba(248,113,113,0.2)',  icon: '▼' },
};

// ── Stage config ─────────────────────────────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  '2496931':   'Step 1 – First Meeting',
  '2496932':   'Step 2 – Financial Model',
  '2496934':   'Step 3 – Advisor Demo',
  '100409509': 'Step 4 – Discovery Day',
  '2496935':   'Step 5 – Offer Review',
  '2496936':   'Step 6 – Offer Accepted',
  '100411705': 'Step 7 – Launched',
};

const STAGE_COLORS: Record<string, string> = {
  '2496931':   '#7fb3d8',
  '2496932':   '#6ba3cc',
  '2496934':   '#5793c0',
  '100409509': '#4383b4',
  '2496935':   '#2f73a8',
  '2496936':   C.gold,
  '100411705': C.teal,
};

const EARLY_STAGE_IDS = ['2496931', '2496932', '2496934', '100409509'];
const LAUNCH_STAGE_IDS = ['2496935', '2496936', '100411705'];
const LAUNCHED_STAGE_ID = '100411705';
const GRADUATION_DAYS = 90;

// ── Types ────────────────────────────────────────────────────────────────────
interface Deal {
  id: string;
  dealname: string;
  dealstage: string;
  transferable_aum: string | null;
  t12_revenue: string | null;
  current_firm__cloned_: string | null;
  firm_type: string | null;
  client_households: string | null;
  transition_type: string | null;
  desired_start_date: string | null;
  actual_launch_date: string | null;
  ownerName: string | null;
  daysSinceLaunch: number | null;
}

interface SentimentScore {
  deal_id: string;
  composite_score: number;
  tier: string;
  activity_score: number;
  tone_score: number;
  milestone_score: number;
  recency_score: number;
  updated_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
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

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function sortByLastName(deals: Deal[]): Deal[] {
  return [...deals].sort((a, b) => getLastName(a.dealname).localeCompare(getLastName(b.dealname)));
}

// ── Tab definitions ──────────────────────────────────────────────────────────
type TabKey = 'launch' | 'early' | 'completed' | 'aum';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'launch', label: 'Launch to Graduation', icon: '▲' },
  { key: 'early', label: 'Early Deals', icon: '◈' },
  { key: 'completed', label: 'Completed Transitions', icon: '✓' },
  { key: 'aum', label: 'AUM Tracker', icon: '◎' },
];

// ── Sentiment Badge Component ────────────────────────────────────────────────
function SentimentBadge({ score, tier }: { score: number | null; tier: string | null }) {
  if (!tier || score === null) {
    return (
      <span style={{
        display: 'inline-block', padding: '4px 10px', borderRadius: 4,
        fontSize: 10, color: C.slate, background: 'rgba(91,106,113,0.06)',
        fontStyle: 'italic',
      }}>
        Not scored
      </span>
    );
  }

  const config = TIER_CONFIG[tier] || { color: C.slate, bgColor: 'rgba(91,106,113,0.08)', icon: '●' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 4,
        fontSize: 11, fontWeight: 600,
        background: config.bgColor, color: config.color,
      }}>
        <span style={{ fontSize: 10 }}>{config.icon}</span>
        {tier}
      </span>
      <span style={{ fontSize: 10, color: C.slate, paddingLeft: 2 }}>
        {Math.round(score)}/100
      </span>
    </div>
  );
}

// ── AUM Progress Bar Component ───────────────────────────────────────────────
function AumProgressBar({ expected, actual }: { expected: number | null; actual: number | null }) {
  if (!expected || !actual) {
    return <span style={{ fontSize: 11, color: C.slate, fontStyle: 'italic' }}>—</span>;
  }
  const pct = Math.min(Math.round((actual / expected) * 100), 200);
  const displayPct = Math.min(pct, 100); // cap bar at 100%
  const color = pct >= 90 ? C.green : pct >= 60 ? C.gold : pct >= 30 ? C.amber : C.red;

  return (
    <div style={{ minWidth: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color }}>{pct}%</span>
        <span style={{ fontSize: 10, color: C.slate }}>{formatAUM(actual)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(91,106,113,0.1)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3, background: color,
          width: `${displayPct}%`, transition: 'width 300ms ease',
        }} />
      </div>
    </div>
  );
}

// ── AUM Tracker types ────────────────────────────────────────────────────────
interface AumAdvisor {
  deal_id: string;
  advisor_name: string;
  expected_aum: number | null;
  actual_aum: number | null;
  transfer_pct: number | null;
  launch_date: string | null;
  days_since_launch: number | null;
  prior_firm: string | null;
  households: number | null;
  transition_type: string | null;
  fee_rate_bps: number | null;
  current_revenue: number | null;
}

// ── AUM Pace Warning Logic ──────────────────────────────────────────────────
// Master Merge:   95% within 14 days
// LPOA:           60% by 30d, 80% by 45d, 90% by 60d
// Repaper:        ~90% by graduation (90 days)

interface PaceTarget {
  days: number;
  expectedPct: number;
}

const PACE_TARGETS: Record<string, PaceTarget[]> = {
  'Master Merge': [
    { days: 14, expectedPct: 95 },
  ],
  'LPOA': [
    { days: 30, expectedPct: 60 },
    { days: 45, expectedPct: 80 },
    { days: 60, expectedPct: 90 },
  ],
  'Repaper': [
    { days: 90, expectedPct: 90 },
  ],
};

type PaceStatus = 'on-track' | 'warning' | 'behind' | 'unknown';

interface PaceResult {
  status: PaceStatus;
  label: string;
  detail: string;
  currentTarget: number | null;
  nextTarget: PaceTarget | null;
}

function evaluatePace(advisor: AumAdvisor): PaceResult {
  const { transition_type, transfer_pct, days_since_launch } = advisor;

  if (!transition_type || days_since_launch === null || transfer_pct === null) {
    return { status: 'unknown', label: '—', detail: 'Insufficient data', currentTarget: null, nextTarget: null };
  }

  // Normalize transition type to match keys
  const typeKey = Object.keys(PACE_TARGETS).find(
    k => transition_type.toLowerCase().includes(k.toLowerCase())
  );

  if (!typeKey) {
    return { status: 'unknown', label: '—', detail: `No pace targets for "${transition_type}"`, currentTarget: null, nextTarget: null };
  }

  const targets = PACE_TARGETS[typeKey];

  // Find the current applicable target (the latest target where days_since_launch >= target.days)
  // and the next upcoming target
  let currentTarget: PaceTarget | null = null;
  let nextTarget: PaceTarget | null = null;

  for (let i = 0; i < targets.length; i++) {
    if (days_since_launch >= targets[i].days) {
      currentTarget = targets[i];
    } else {
      nextTarget = targets[i];
      break;
    }
  }

  // If past all targets, use the final one
  if (!currentTarget && !nextTarget && targets.length > 0) {
    nextTarget = targets[0];
  }

  // If we haven't reached the first target yet, check if we're on pace
  if (!currentTarget && nextTarget) {
    // Interpolate: what % should they be at now based on linear pace to next target?
    const linearExpected = (days_since_launch / nextTarget.days) * nextTarget.expectedPct;
    const delta = transfer_pct - linearExpected;

    if (delta >= -5) {
      return {
        status: 'on-track',
        label: 'On Pace',
        detail: `${transfer_pct}% transferred — ${nextTarget.expectedPct}% target by day ${nextTarget.days}`,
        currentTarget: Math.round(linearExpected),
        nextTarget,
      };
    } else {
      return {
        status: 'warning',
        label: 'Slow Start',
        detail: `${transfer_pct}% transferred — should be ~${Math.round(linearExpected)}% to hit ${nextTarget.expectedPct}% by day ${nextTarget.days}`,
        currentTarget: Math.round(linearExpected),
        nextTarget,
      };
    }
  }

  // We've passed at least one target — check compliance
  if (currentTarget) {
    const delta = transfer_pct - currentTarget.expectedPct;

    if (delta >= -5) {
      // On track or ahead
      const detail = nextTarget
        ? `${transfer_pct}% transferred — next target: ${nextTarget.expectedPct}% by day ${nextTarget.days}`
        : `${transfer_pct}% transferred — meeting ${currentTarget.expectedPct}% target`;

      return {
        status: 'on-track',
        label: 'On Pace',
        detail,
        currentTarget: currentTarget.expectedPct,
        nextTarget,
      };
    } else if (delta >= -15) {
      return {
        status: 'warning',
        label: 'Off Pace',
        detail: `${transfer_pct}% transferred — should be ${currentTarget.expectedPct}% by day ${currentTarget.days}`,
        currentTarget: currentTarget.expectedPct,
        nextTarget,
      };
    } else {
      return {
        status: 'behind',
        label: 'Behind Target',
        detail: `${transfer_pct}% transferred — expected ${currentTarget.expectedPct}% by day ${currentTarget.days} (${Math.abs(delta)}% behind)`,
        currentTarget: currentTarget.expectedPct,
        nextTarget,
      };
    }
  }

  return { status: 'unknown', label: '—', detail: '', currentTarget: null, nextTarget: null };
}

const PACE_STYLES: Record<PaceStatus, { color: string; bg: string; icon: string }> = {
  'on-track': { color: '#27ae60', bg: 'rgba(39,174,96,0.10)', icon: '✓' },
  'warning':  { color: '#e67e22', bg: 'rgba(230,126,34,0.10)', icon: '⚠' },
  'behind':   { color: '#c0392b', bg: 'rgba(192,57,43,0.08)', icon: '▼' },
  'unknown':  { color: '#5b6a71', bg: 'rgba(91,106,113,0.06)', icon: '●' },
};

// ── AUM Tracker Tab Component ───────────────────────────────────────────────
function AumTrackerTab({ advisors, loading }: { advisors: AumAdvisor[]; loading: boolean; search: string }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: C.slate, fontSize: 14 }}>
        Loading AUM data...
      </div>
    );
  }

  if (advisors.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: C.slate, fontSize: 14 }}>
        No launched advisors found
      </div>
    );
  }

  // Count pace statuses for summary
  const paceResults = advisors.map(a => ({ advisor: a, pace: evaluatePace(a) }));
  const behindCount = paceResults.filter(r => r.pace.status === 'behind').length;
  const warningCount = paceResults.filter(r => r.pace.status === 'warning').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Pace warning summary bar */}
      {(behindCount > 0 || warningCount > 0) && (
        <div style={{
          display: 'flex', gap: 16, padding: '12px 20px', marginBottom: 8,
          background: behindCount > 0 ? 'rgba(192,57,43,0.05)' : 'rgba(230,126,34,0.05)',
          border: `1px solid ${behindCount > 0 ? 'rgba(192,57,43,0.15)' : 'rgba(230,126,34,0.15)'}`,
          borderRadius: 8, alignItems: 'center',
        }}>
          <span style={{ fontSize: 16 }}>{behindCount > 0 ? '⚠' : '◈'}</span>
          <span style={{ fontSize: 13, color: C.dark }}>
            {behindCount > 0 && <strong style={{ color: '#c0392b' }}>{behindCount} advisor{behindCount > 1 ? 's' : ''} behind target</strong>}
            {behindCount > 0 && warningCount > 0 && ' · '}
            {warningCount > 0 && <span style={{ color: '#e67e22' }}>{warningCount} off pace</span>}
          </span>
        </div>
      )}

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 0.9fr 0.7fr 1fr 1fr 0.6fr 0.7fr 0.8fr 1.1fr',
        gap: 12, padding: '12px 20px',
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: C.slate, borderBottom: `1px solid ${C.border}`,
      }}>
        <span>Advisor</span>
        <span>Prior Firm</span>
        <span>Type</span>
        <span style={{ textAlign: 'right' }}>Expected AUM</span>
        <span>Transfer Progress</span>
        <span style={{ textAlign: 'center' }}>Days</span>
        <span style={{ textAlign: 'right' }}>Fee BPS</span>
        <span style={{ textAlign: 'right' }}>Current Rev</span>
        <span>Pace Status</span>
      </div>

      {/* Rows */}
      {paceResults.map(({ advisor, pace }) => {
        const paceStyle = PACE_STYLES[pace.status];

        return (
          <div key={advisor.deal_id} style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 0.9fr 0.7fr 1fr 1fr 0.6fr 0.7fr 0.8fr 1.1fr',
            gap: 12, padding: '16px 20px', alignItems: 'center',
            background: C.cardBg,
            border: `1px solid ${pace.status === 'behind' ? 'rgba(192,57,43,0.2)' : C.border}`,
            borderRadius: 8,
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = C.teal;
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(29,118,130,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = pace.status === 'behind' ? 'rgba(192,57,43,0.2)' : C.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Advisor Name */}
            <Link href={`/command-center/advisor/${advisor.deal_id}`} style={{ textDecoration: 'none' }}>
              <div>
                <p style={{
                  fontSize: 15, fontWeight: 600, color: C.dark,
                  fontFamily: "'ABC Arizona Text', Georgia, serif", cursor: 'pointer',
                }}>
                  {advisor.advisor_name}
                </p>
                {advisor.households && (
                  <p style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>
                    {advisor.households} household{advisor.households !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </Link>

            {/* Prior Firm */}
            <p style={{ fontSize: 13, color: C.dark }}>
              {advisor.prior_firm || '—'}
            </p>

            {/* Transition Type */}
            <div>
              {advisor.transition_type ? (
                <span style={{
                  display: 'inline-block', padding: '3px 8px', borderRadius: 4,
                  fontSize: 10, fontWeight: 600,
                  background: 'rgba(29,118,130,0.08)', color: C.teal,
                  whiteSpace: 'nowrap',
                }}>
                  {advisor.transition_type}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: C.slate, fontStyle: 'italic' }}>—</span>
              )}
            </div>

            {/* Expected AUM */}
            <p style={{
              fontSize: 14, fontWeight: 600, color: C.dark, textAlign: 'right',
              fontFamily: "'ABC Arizona Text', Georgia, serif",
            }}>
              {formatAUM(advisor.expected_aum)}
            </p>

            {/* Transfer Progress Bar */}
            <AumProgressBar expected={advisor.expected_aum} actual={advisor.actual_aum} />

            {/* Days Since Launch */}
            <p style={{ fontSize: 13, color: C.slate, textAlign: 'center' }}>
              {advisor.days_since_launch !== null ? (
                <span>
                  {advisor.days_since_launch}
                  <span style={{ fontSize: 10, color: C.slate, marginLeft: 2 }}>d</span>
                </span>
              ) : '—'}
            </p>

            {/* Fee Rate BPS */}
            <p style={{ fontSize: 13, fontWeight: 500, color: C.dark, textAlign: 'right' }}>
              {advisor.fee_rate_bps != null ? `${advisor.fee_rate_bps}` : '—'}
              {advisor.fee_rate_bps != null && (
                <span style={{ fontSize: 10, color: C.slate, marginLeft: 2 }}>bps</span>
              )}
            </p>

            {/* Current Revenue */}
            <p style={{
              fontSize: 13, fontWeight: 600, color: advisor.current_revenue ? C.green : C.slate,
              textAlign: 'right', fontFamily: "'ABC Arizona Text', Georgia, serif",
            }}>
              {advisor.current_revenue ? formatAUM(advisor.current_revenue) : '—'}
            </p>

            {/* Pace Status Badge + Tooltip */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 4,
                fontSize: 11, fontWeight: 600,
                background: paceStyle.bg, color: paceStyle.color,
              }}>
                <span style={{ fontSize: 10 }}>{paceStyle.icon}</span>
                {pace.label}
              </span>
              {pace.detail && pace.status !== 'unknown' && (
                <span style={{ fontSize: 10, color: C.slate, paddingLeft: 2, lineHeight: 1.3 }}>
                  {pace.detail}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdvisorHubPage() {
  const { data, isLoading, error } = useSWR('/api/command-center/pipeline', fetcher);
  const { data: sentimentData, mutate: mutateSentiment } = useSWR('/api/command-center/sentiment/scores', fetcher);
  const { data: aumData, isLoading: aumLoading } = useSWR('/api/command-center/aum-tracker', fetcher);
  const [activeTab, setActiveTab] = useState<TabKey>('launch');
  const [search, setSearch] = useState('');
  const [scoring, setScoring] = useState<Record<string, boolean>>({});

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

  const { launchDeals, earlyDeals, completedDeals } = useMemo(() => {
    if (!data?.deals) return { launchDeals: [], earlyDeals: [], completedDeals: [] };
    const deals = (data.deals as Deal[]).filter(d => !d.dealname?.toLowerCase().includes('test'));

    const early = deals.filter(d => EARLY_STAGE_IDS.includes(d.dealstage));

    const launch = deals.filter(d => {
      if (!LAUNCH_STAGE_IDS.includes(d.dealstage)) return false;
      if (d.dealstage === LAUNCHED_STAGE_ID) {
        return d.daysSinceLaunch === null || d.daysSinceLaunch <= GRADUATION_DAYS;
      }
      return true;
    });

    const completed = deals.filter(d =>
      d.dealstage === LAUNCHED_STAGE_ID &&
      d.daysSinceLaunch !== null &&
      d.daysSinceLaunch > GRADUATION_DAYS
    );

    return {
      launchDeals: sortByLastName(launch),
      earlyDeals: sortByLastName(early),
      completedDeals: sortByLastName(completed),
    };
  }, [data]);

  const currentDeals = useMemo(() => {
    if (activeTab === 'aum') return []; // AUM tab uses its own data source
    const pool = activeTab === 'launch' ? launchDeals : activeTab === 'early' ? earlyDeals : completedDeals;
    if (!search.trim()) return pool;
    const q = search.toLowerCase();
    return pool.filter(d =>
      d.dealname?.toLowerCase().includes(q) ||
      d.current_firm__cloned_?.toLowerCase().includes(q) ||
      d.ownerName?.toLowerCase().includes(q)
    );
  }, [activeTab, launchDeals, earlyDeals, completedDeals, search]);

  // Filtered AUM advisors
  const filteredAumAdvisors = useMemo(() => {
    if (!aumData?.advisors) return [];
    const advisors = (aumData.advisors as AumAdvisor[]).filter(a => !a.advisor_name?.toLowerCase().includes('test'));
    if (!search.trim()) return advisors;
    const q = search.toLowerCase();
    return advisors.filter(a =>
      a.advisor_name?.toLowerCase().includes(q) ||
      a.prior_firm?.toLowerCase().includes(q)
    );
  }, [aumData, search]);

  // Score a single advisor
  const scoreAdvisor = useCallback(async (dealId: string) => {
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
  }, [mutateSentiment]);

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
  const gridCols = showSentiment
    ? '1.8fr 1.2fr 0.8fr 1fr 0.9fr 0.9fr 0.9fr'
    : '2fr 1.5fr 1fr 1fr 1fr 1fr';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '40px 48px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <Image src="/images/Farther_Symbol_RGB_Cream.svg" alt="" width={28} height={28} />
          <h1 style={{
            fontSize: 32, fontWeight: 700, color: C.dark,
            fontFamily: "'ABC Arizona Text', Georgia, serif",
          }}>
            Advisor Hub
          </h1>
        </div>
        <p style={{ fontSize: 14, color: C.slate }}>
          Full directory of advisors across all pipeline stages
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Launch to Graduation', value: String(launchDeals.length), sub: undefined, color: C.teal, icon: '▲' },
          { label: 'Early Deals', value: String(earlyDeals.length), sub: undefined, color: '#4383b4', icon: '◈' },
          { label: 'Completed Transitions', value: String(completedDeals.length), sub: undefined, color: C.green, icon: '✓' },
        ].map(card => (
          <div key={card.label} style={{
            background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '20px 24px', position: 'relative',
          }}>
            <span style={{ position: 'absolute', top: 16, right: 18, fontSize: 20, opacity: 0.25, color: card.color }}>
              {card.icon}
            </span>
            <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {card.label}
            </p>
            <p style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
              {card.value}
            </p>
            {card.sub && <p style={{ fontSize: 12, color: C.slate, marginTop: 4 }}>{card.sub}</p>}
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
          const realizedPct = totalExpectedRevenue > 0 && aumData?.summary?.total_current_revenue
            ? Math.round((aumData.summary.total_current_revenue / totalExpectedRevenue) * 100)
            : null;
          return [
            {
              label: 'AUM Transfer Rate',
              value: aumData?.summary?.overall_transfer_pct != null ? `${aumData.summary.overall_transfer_pct}%` : '—',
              sub: aumData?.summary ? `${formatAUM(aumData.summary.total_actual_aum)} of ${formatAUM(aumData.summary.total_expected_aum)}` : undefined,
              color: C.gold, icon: '◎',
            },
            {
              label: 'On Book Revenue',
              value: aumData?.summary?.total_current_revenue ? formatAUM(aumData.summary.total_current_revenue) : '—',
              sub: aumData?.summary?.advisors_with_actual ? `${aumData.summary.advisors_with_actual} advisor${aumData.summary.advisors_with_actual > 1 ? 's' : ''} reporting` : undefined,
              color: C.green, icon: '$',
            },
            {
              label: 'Expected Revenue',
              value: totalExpectedRevenue > 0 ? formatAUM(Math.round(totalExpectedRevenue)) : '—',
              sub: realizedPct != null ? `${realizedPct}% realized` : 'At full AUM transfer',
              color: C.gold, icon: '★',
            },
          ];
        })().map(card => (
          <div key={card.label} style={{
            background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '20px 24px', position: 'relative',
          }}>
            <span style={{ position: 'absolute', top: 16, right: 18, fontSize: 20, opacity: 0.25, color: card.color }}>
              {card.icon}
            </span>
            <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {card.label}
            </p>
            <p style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
              {card.value}
            </p>
            {card.sub && <p style={{ fontSize: 12, color: C.slate, marginTop: 4 }}>{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs + Search + Score All */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${C.border}` }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = tab.key === 'launch' ? launchDeals.length : tab.key === 'early' ? earlyDeals.length : tab.key === 'completed' ? completedDeals.length : (aumData?.total ?? 0);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '12px 24px', fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? C.teal : C.slate, background: 'none', border: 'none',
                  borderBottom: isActive ? `2px solid ${C.teal}` : '2px solid transparent',
                  marginBottom: -2, cursor: 'pointer',
                  fontFamily: "'Fakt', system-ui, sans-serif",
                  transition: 'color 150ms ease, border-color 150ms ease',
                }}
              >
                <span style={{ marginRight: 6, fontSize: 11 }}>{tab.icon}</span>
                {tab.label}
                <span style={{
                  marginLeft: 8, fontSize: 11, fontWeight: 600,
                  padding: '2px 8px', borderRadius: 10,
                  background: isActive ? 'rgba(29,118,130,0.1)' : 'rgba(91,106,113,0.08)',
                  color: isActive ? C.teal : C.slate,
                }}>
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
                padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                background: batchScoring ? C.border : C.teal, color: C.white,
                border: 'none', cursor: batchScoring ? 'not-allowed' : 'pointer',
                fontFamily: "'Fakt', system-ui, sans-serif",
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
              width: 240, padding: '10px 16px', fontSize: 13, borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.cardBg, color: C.dark,
              fontFamily: "'Fakt', system-ui, sans-serif",
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && activeTab !== 'aum' && (
        <div style={{ textAlign: 'center', padding: 60, color: C.slate, fontSize: 14 }}>
          Loading advisors...
        </div>
      )}
      {error && activeTab !== 'aum' && (
        <div style={{ textAlign: 'center', padding: 60, color: C.red, fontSize: 14 }}>
          Failed to load pipeline data
        </div>
      )}

      {/* ═══════ AUM TRACKER TAB ═══════ */}
      {activeTab === 'aum' && (
        <AumTrackerTab advisors={filteredAumAdvisors} loading={aumLoading} search={search} />
      )}

      {/* ═══════ PIPELINE TABS (Launch / Early / Completed) ═══════ */}
      {activeTab !== 'aum' && !isLoading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: gridCols,
            gap: 16, padding: '12px 20px',
            fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: C.slate, borderBottom: `1px solid ${C.border}`,
          }}>
            <span>Advisor</span>
            <span>Current Firm</span>
            <span style={{ textAlign: 'right' }}>AUM</span>
            <span>Stage</span>
            {showSentiment && <span>Sentiment</span>}
            <span>{activeTab === 'completed' ? 'Launched' : 'Target Date'}</span>
            <span>Recruiter</span>
          </div>

          {currentDeals.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: C.slate, fontSize: 14 }}>
              {search ? 'No advisors match your search' : 'No advisors in this category'}
            </div>
          )}

          {currentDeals.map(deal => {
            const stageColor = STAGE_COLORS[deal.dealstage] ?? C.slate;
            const stageLabel = STAGE_LABELS[deal.dealstage] ?? deal.dealstage;
            const shortStage = stageLabel.replace(/Step \d+ – /, '');
            const aum = deal.transferable_aum ? Number(deal.transferable_aum) : null;
            const dateVal = activeTab === 'completed'
              ? (deal.actual_launch_date || deal.desired_start_date)
              : deal.desired_start_date;
            const sentiment = sentimentMap[deal.id];
            const isScoring = scoring[deal.id];

            return (
              <div key={deal.id} style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                gap: 16, padding: '16px 20px', alignItems: 'center',
                background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8,
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.teal;
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(29,118,130,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Name — clickable link */}
                <Link href={`/command-center/advisor/${deal.id}`} style={{ textDecoration: 'none' }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", cursor: 'pointer' }}>
                      {deal.dealname || '—'}
                    </p>
                    {deal.firm_type && (
                      <p style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>{deal.firm_type}</p>
                    )}
                  </div>
                </Link>

                {/* Current Firm */}
                <p style={{ fontSize: 13, color: C.dark }}>
                  {deal.current_firm__cloned_ || '—'}
                </p>

                {/* AUM */}
                <p style={{ fontSize: 14, fontWeight: 600, color: C.dark, textAlign: 'right', fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
                  {formatAUM(aum)}
                </p>

                {/* Stage Badge */}
                <div>
                  <span style={{
                    display: 'inline-block', padding: '4px 10px', borderRadius: 4,
                    fontSize: 11, fontWeight: 600,
                    background: `${stageColor}18`, color: stageColor,
                  }}>
                    {shortStage}
                  </span>
                  {activeTab === 'launch' && deal.daysSinceLaunch !== null && (
                    <p style={{ fontSize: 10, color: C.slate, marginTop: 3 }}>
                      Day {deal.daysSinceLaunch}
                    </p>
                  )}
                  {activeTab === 'completed' && deal.daysSinceLaunch !== null && (
                    <p style={{ fontSize: 10, color: C.green, marginTop: 3 }}>
                      {deal.daysSinceLaunch} days
                    </p>
                  )}
                </div>

                {/* Sentiment — only for launch & completed tabs */}
                {showSentiment && (
                  <div>
                    {isScoring ? (
                      <span style={{ fontSize: 11, color: C.teal, fontStyle: 'italic' }}>
                        Analyzing...
                      </span>
                    ) : sentiment ? (
                      <SentimentBadge
                        score={Number(sentiment.composite_score)}
                        tier={sentiment.tier}
                      />
                    ) : (
                      <button
                        onClick={(e) => { e.preventDefault(); scoreAdvisor(deal.id); }}
                        style={{
                          padding: '4px 10px', fontSize: 10, fontWeight: 600,
                          borderRadius: 4, border: `1px solid ${C.border}`,
                          background: 'none', color: C.slate, cursor: 'pointer',
                          fontFamily: "'Fakt', system-ui, sans-serif",
                          transition: 'color 150ms ease, border-color 150ms ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = C.teal; e.currentTarget.style.borderColor = C.teal; }}
                        onMouseLeave={e => { e.currentTarget.style.color = C.slate; e.currentTarget.style.borderColor = C.border; }}
                      >
                        ✦ Score
                      </button>
                    )}
                  </div>
                )}

                {/* Date */}
                <p style={{ fontSize: 13, color: C.slate }}>
                  {formatDate(dateVal)}
                </p>

                {/* Recruiter */}
                <p style={{ fontSize: 13, color: C.slate }}>
                  {deal.ownerName || '—'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Total footer */}
      {activeTab !== 'aum' && !isLoading && !error && data?.deals && (
        <div style={{
          marginTop: 24, padding: '12px 20px',
          fontSize: 12, color: C.slate, textAlign: 'right',
          borderTop: `1px solid ${C.border}`,
        }}>
          {data.deals.length} total advisors across all stages
        </div>
      )}
    </div>
  );
}
