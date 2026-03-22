'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  dark: '#FAF7F2', white: '#1a1a1a', slate: 'rgba(250,247,242,0.5)',
  lightBlue: '#b6d0ed',
  teal: '#1d7682', bg: '#111111',
  cardBg: '#2f2f2f', border: 'rgba(250,247,242,0.08)',
  green: '#10b981', greenBg: 'rgba(16,185,129,0.15)',
  amber: '#f59e0b', amberBg: 'rgba(245,158,11,0.15)', amberBorder: 'rgba(245,158,11,0.3)',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.15)', redBorder: 'rgba(239,68,68,0.3)',
  gold: '#f59e0b', goldBg: 'rgba(245,158,11,0.15)',
};

// ── Stage mappings for Advisor Recruiting ────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  '2496931':   'Step 1 – First Meeting',
  '2496932':   'Step 2 – Financial Model',
  '2496934':   'Step 3 – Advisor Demo',
  '100409509': 'Step 4 – Discovery Day',
  '2496935':   'Step 5 – Offer Review',
  '2496936':   'Step 6 – Offer Accepted',
  '100411705': 'Step 7 – Launched',
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  '2496936':   'AX Team Introduced',
  '100411705': 'Official Start at Farther',
};

const ACTIVE_STAGE_IDS = ['2496931', '2496932', '2496934', '100409509', '2496935', '2496936', '100411705'];
const FUNNEL_STAGE_ORDER = ['2496931', '2496932', '2496934', '100409509', '2496935', '2496936', '100411705'];
// ── Stage colors ─────────────────────────────────────────────────────────────
const STAGE_COLORS: Record<string, string> = {
  '2496931':   '#7fb3d8',
  '2496932':   '#6ba3cc',
  '2496934':   '#5793c0',
  '100409509': '#4383b4',
  '2496935':   '#2f73a8',
  '2496936':   C.gold,
  '100411705': C.teal,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
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

function daysUntil(d: string): number {
  const target = new Date(d);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Types ────────────────────────────────────────────────────────────────────
interface Deal {
  id: string;
  dealname: string;
  transferable_aum: string | null;
  dealstage: string;
  current_firm__cloned_: string | null;
  custodian__cloned_: string | null;
  transition_type: string | null;
  firm_type: string | null;
  onboarder: string | null;
  transition_owner: string | null;
  desired_start_date: string | null;
  actual_launch_date: string | null;
  client_households: string | null;
  ownerName: string | null;
  daysSinceLaunch: number | null;
}

// Stage groupings for tabs
const EARLY_STAGE_IDS = ['2496931', '2496932', '2496934', '100409509']; // Steps 1-4
const LAUNCH_STAGE_IDS = ['2496935', '2496936', '100411705']; // Steps 5-7

interface AcquisitionsDeal extends Deal {
  stageLabel: string;
  stageOrder: number;
  isTerminal?: boolean;
}

interface AcquisitionsStage {
  id: string;
  label: string;
  count: number;
  isTerminal: boolean;
}

// ── Shared UI components ─────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, accent, icon }: { label: string; value: string; sub?: string; accent?: boolean; icon?: string }) {
  return (
    <div style={{
      background: accent ? C.teal : C.cardBg,
      border: `1px solid ${accent ? C.teal : C.border}`,
      borderRadius: 8, padding: '20px 24px', position: 'relative',
    }}>
      {icon && (
        <span style={{ position: 'absolute', top: 16, right: 18, fontSize: 20, opacity: 0.3, color: accent ? C.white : C.slate }}>{icon}</span>
      )}
      <p style={{ fontSize: 11, color: accent ? 'rgba(255,255,255,0.7)' : C.slate, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: accent ? C.white : C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: accent ? 'rgba(255,255,255,0.6)' : C.slate, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function StageBadge({ stageId, label, isTerminal }: { stageId: string; label: string; isTerminal?: boolean }) {
  const isLaunched = stageId === '100411705';
  const isOfferAccepted = stageId === '2496936';
  const description = STAGE_DESCRIPTIONS[stageId];

  let bg = 'rgba(91,106,113,0.1)';
  let color = C.slate;
  let borderColor = 'transparent';

  if (isTerminal) {
    bg = C.redBg; color = C.red; borderColor = C.redBorder;
  } else if (isLaunched) {
    bg = 'rgba(29,118,130,0.1)'; color = C.teal;
  } else if (isOfferAccepted) {
    bg = C.goldBg; color = C.gold; borderColor = 'rgba(200,169,81,0.25)';
  }

  return (
    <span
      title={description}
      style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
        background: bg, color, border: `1px solid ${borderColor}`, cursor: description ? 'help' : 'default',
      }}
    >
      {label}
    </span>
  );
}

// ── Launch timer component ───────────────────────────────────────────────────
// Step 6: countdown to launch. Step 7: days since launch + graduation progress.
function LaunchTimer({ deal }: { deal: Deal }) {
  const isOfferAccepted = deal.dealstage === '2496936';
  const isLaunched = deal.dealstage === '100411705';

  if (!isOfferAccepted && !isLaunched) return <span style={{ color: C.slate }}>—</span>;

  const launchDateStr = deal.actual_launch_date || deal.desired_start_date;
  if (!launchDateStr) return <span style={{ color: C.slate, fontSize: 12 }}>No date set</span>;

  const launchDate = new Date(launchDateStr);
  const now = new Date();
  const diffMs = now.getTime() - launchDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // ── Step 6: Countdown to launch ──
  if (isOfferAccepted) {
    const daysUntilLaunch = -diffDays;
    if (daysUntilLaunch < 0) {
      // Past target date but still in Step 6
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>
            {Math.abs(daysUntilLaunch)}d overdue
          </span>
          <span style={{ fontSize: 10, color: C.slate }}>
            Target: {launchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      );
    }
    const urgencyColor = daysUntilLaunch <= 7 ? C.red : daysUntilLaunch <= 30 ? C.amber : C.teal;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: urgencyColor }}>
          T-{daysUntilLaunch}d
        </span>
        <span style={{ fontSize: 10, color: C.slate }}>
          {launchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    );
  }

  // ── Step 7: Days since launch + graduation tracker ──
  const daysSinceLaunch = diffDays;

  // Graduation milestones
  let milestone = '';
  let milestoneColor = C.slate;
  let progressPct = 0;

  if (daysSinceLaunch >= 45) {
    milestone = 'Graduated';
    milestoneColor = C.green;
    progressPct = 100;
  } else if (daysSinceLaunch >= 30) {
    milestone = '90% assets target';
    milestoneColor = C.teal;
    progressPct = Math.round((daysSinceLaunch / 45) * 100);
  } else if (daysSinceLaunch >= 0) {
    milestone = '70% assets by Day 30';
    milestoneColor = C.amber;
    progressPct = Math.round((daysSinceLaunch / 45) * 100);
  } else {
    // Future launch date
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>T-{Math.abs(daysSinceLaunch)}d</span>
        <span style={{ fontSize: 10, color: C.slate }}>Pre-launch</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 120 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: milestoneColor }}>
          Day {daysSinceLaunch}
        </span>
        <span style={{ fontSize: 10, color: C.slate }}>/ 45</span>
      </div>
      {/* Progress bar */}
      <div style={{ width: '100%', height: 4, background: 'rgba(91,106,113,0.1)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
        {/* Day 30 marker */}
        <div style={{ position: 'absolute', left: `${(30/45)*100}%`, top: 0, width: 1, height: '100%', background: 'rgba(91,106,113,0.3)' }} />
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${Math.min(progressPct, 100)}%`,
          background: milestoneColor, transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 500, color: milestoneColor }}>{milestone}</span>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: C.dark, fontFamily: "'Fakt', system-ui, sans-serif", marginBottom: subtitle ? 4 : 0 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 12, color: C.slate }}>{subtitle}</p>}
    </div>
  );
}

// ── Complexity score badge ───────────────────────────────────────────────────
function ComplexityBadge({ score, tier, tierColor }: { score: number; tier: string; tierColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} title={`${tier} complexity — Score: ${score}/105`}>
      <span style={{
        fontSize: 12, fontWeight: 700, color: tierColor,
        fontFamily: "'ABC Arizona Text', Georgia, serif",
      }}>
        {score}
      </span>
      <div style={{ width: 32, height: 4, background: 'rgba(91,106,113,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${Math.min((score / 105) * 100, 100)}%`,
          background: tierColor,
        }} />
      </div>
    </div>
  );
}

// ── Horizontal bar component ─────────────────────────────────────────────────
function HorizontalBar({ items, maxValue, perItemMax }: { items: { label: string; value: number; color: string; sub?: string; display?: string }[]; maxValue: number; perItemMax?: number[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => {
        const cap = perItemMax?.[i] ?? maxValue;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 130, fontSize: 12, color: C.slate, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.label}
            </div>
            <div style={{ flex: 1, height: 22, background: 'rgba(91,106,113,0.06)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${cap > 0 ? Math.max((item.value / cap) * 100, 2) : 0}%`,
                background: item.color, transition: 'width 0.4s ease',
              }} />
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 600, color: C.dark }}>
                {item.display ?? item.value}{item.sub ? ` · ${item.sub}` : ''}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMMAND DASHBOARD (Analytics overlay for Recruiting tab)
// ══════════════════════════════════════════════════════════════════════════════
function CommandDashboard({ deals }: { deals: Deal[] }) {
  const { data: aumData } = useSWR('/api/command-center/aum-tracker', fetcher);
  const { data: sentimentData } = useSWR('/api/command-center/sentiment/scores', fetcher);

  const analytics = useMemo(() => {
    const activeDeals = deals.filter(d => ACTIVE_STAGE_IDS.includes(d.dealstage));
    const funnelDeals = deals.filter(d => FUNNEL_STAGE_ORDER.includes(d.dealstage));
    const allLaunchedDeals = deals.filter(d => d.dealstage === '100411705');
    const launchedDeals = allLaunchedDeals.filter(d =>
      d.daysSinceLaunch === null || d.daysSinceLaunch <= 90
    );
    const preLaunchDeals = activeDeals.filter(d => d.dealstage !== '100411705');

    const getAUM = (d: Deal) => parseFloat(d.transferable_aum ?? '0') || 0;

    // ── Stage funnel ──
    const ytdStart = new Date(new Date().getFullYear(), 0, 1); // Jan 1 of current year
    const stageFunnel = FUNNEL_STAGE_ORDER.map(sid => {
      let stageDeals = funnelDeals.filter(d => d.dealstage === sid);
      // Step 7 (Launched): only show YTD launches toward the $25B goal
      if (sid === '100411705') {
        stageDeals = stageDeals.filter(d => {
          const launchStr = d.actual_launch_date || d.desired_start_date;
          if (!launchStr) return false;
          return new Date(launchStr) >= ytdStart;
        });
      }
      const aum = stageDeals.reduce((acc, d) => acc + getAUM(d), 0);
      return { id: sid, label: STAGE_LABELS[sid], count: stageDeals.length, aum, color: STAGE_COLORS[sid] };
    });

    // ── Total active AUM ──
    const totalActiveAUM = activeDeals.reduce((acc, d) => acc + getAUM(d), 0);
    const preLaunchAUM = preLaunchDeals.reduce((acc, d) => acc + getAUM(d), 0);

    // ── Launch countdown ──
    const now = new Date();
    const getLaunchesInDays = (days: number) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);
      return preLaunchDeals
        .filter(d => {
          if (!d.desired_start_date) return false;
          const dt = new Date(d.desired_start_date);
          return dt >= now && dt <= cutoff;
        })
        .sort((a, b) => new Date(a.desired_start_date!).getTime() - new Date(b.desired_start_date!).getTime());
    };

    const launches30 = getLaunchesInDays(30);
    const launches60 = getLaunchesInDays(60);
    const launches90 = getLaunchesInDays(90);

    const launches30AUM = launches30.reduce((acc, d) => acc + getAUM(d), 0);
    const launches60AUM = launches60.reduce((acc, d) => acc + getAUM(d), 0);
    const launches90AUM = launches90.reduce((acc, d) => acc + getAUM(d), 0);

    // ── AUM by stage ──
    const maxStageAUM = Math.max(...stageFunnel.map(s => s.aum));

    // ── Launch pace tracking ──
    const ANNUAL_GOAL = 25e9;
    const year = now.getFullYear();
    const monthStart = new Date(year, now.getMonth(), 1);
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    const quarterStart = new Date(year, quarterMonth, 1);

    const getLaunchDate = (d: Deal) => d.actual_launch_date || d.desired_start_date;

    const ytdLaunched = allLaunchedDeals.filter(d => {
      const ls = getLaunchDate(d);
      return ls && new Date(ls) >= ytdStart;
    });
    const mtdLaunched = ytdLaunched.filter(d => {
      const ls = getLaunchDate(d);
      return ls && new Date(ls) >= monthStart;
    });
    const qtdLaunched = ytdLaunched.filter(d => {
      const ls = getLaunchDate(d);
      return ls && new Date(ls) >= quarterStart;
    });

    const ytdAUM = ytdLaunched.reduce((acc, d) => acc + getAUM(d), 0);
    const mtdAUM = mtdLaunched.reduce((acc, d) => acc + getAUM(d), 0);
    const qtdAUM = qtdLaunched.reduce((acc, d) => acc + getAUM(d), 0);

    // Pace calculations
    const dayOfYear = Math.floor((now.getTime() - ytdStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalDaysInYear = (new Date(year, 11, 31).getTime() - ytdStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const ytdPacePct = (ytdAUM / ANNUAL_GOAL) * 100;
    const expectedYtdPct = (dayOfYear / totalDaysInYear) * 100;
    const ytdOnTrack = ytdPacePct >= expectedYtdPct;

    // Monthly pace: goal / 12 per month
    const monthlyGoal = ANNUAL_GOAL / 12;
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
    const expectedMtdPct = (dayOfMonth / daysInMonth) * 100;
    const mtdPacePct = (mtdAUM / monthlyGoal) * 100;
    const mtdOnTrack = mtdPacePct >= expectedMtdPct;
    const mtdDeficit = mtdOnTrack ? 0 : (monthlyGoal * (expectedMtdPct / 100)) - mtdAUM;

    // Quarterly pace: goal / 4 per quarter
    const quarterlyGoal = ANNUAL_GOAL / 4;
    const dayOfQuarter = Math.floor((now.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const quarterEnd = new Date(year, quarterMonth + 3, 0);
    const daysInQuarter = Math.floor((quarterEnd.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const expectedQtdPct = (dayOfQuarter / daysInQuarter) * 100;
    const qtdPacePct = (qtdAUM / quarterlyGoal) * 100;
    const qtdOnTrack = qtdPacePct >= expectedQtdPct;
    const qtdDeficit = qtdOnTrack ? 0 : (quarterlyGoal * (expectedQtdPct / 100)) - qtdAUM;

    const quarterLabel = `Q${Math.floor(now.getMonth() / 3) + 1}`;
    const monthLabel = now.toLocaleString('en-US', { month: 'long' });

    return {
      activeDeals, launchedDeals, preLaunchDeals,
      stageFunnel, totalActiveAUM, preLaunchAUM,
      launches30, launches60, launches90, launches30AUM, launches60AUM, launches90AUM,
      maxStageAUM,
      // Pace tracking
      ANNUAL_GOAL, ytdAUM, mtdAUM, qtdAUM,
      ytdLaunched, mtdLaunched, qtdLaunched,
      ytdPacePct, mtdPacePct, qtdPacePct,
      expectedYtdPct, expectedMtdPct, expectedQtdPct,
      ytdOnTrack, mtdOnTrack, qtdOnTrack,
      mtdDeficit, qtdDeficit,
      monthlyGoal, quarterlyGoal,
      quarterLabel, monthLabel,
    };
  }, [deals]);

  const a = analytics;

  // Pace indicator helper
  function PaceIndicator({ label, aum, goal, pacePct, expectedPct, onTrack, deficit, count }: {
    label: string; aum: number; goal: number; pacePct: number; expectedPct: number; onTrack: boolean; deficit: number; count: number;
  }) {
    const paceColor = onTrack ? C.green : C.red;
    const cappedPct = Math.min(pacePct, 100);
    return (
      <div style={{ flex: 1, padding: '16px 20px', borderRadius: 8, background: 'rgba(91,106,113,0.04)', border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
          <span style={{ fontSize: 11, color: C.slate }}>{count} launched</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 2 }}>
          {formatAUM(aum)}
        </div>
        <div style={{ fontSize: 11, color: C.slate, marginBottom: 10 }}>
          of {formatAUM(goal)} goal
        </div>
        {/* Progress bar with expected pace marker */}
        <div style={{ position: 'relative', height: 8, background: 'rgba(91,106,113,0.08)', borderRadius: 4, overflow: 'visible', marginBottom: 8 }}>
          <div style={{
            height: '100%', borderRadius: 4, width: `${cappedPct}%`,
            background: paceColor, transition: 'width 0.4s ease',
          }} />
          {/* Expected pace marker */}
          <div style={{
            position: 'absolute', top: -3, left: `${Math.min(expectedPct, 100)}%`,
            width: 2, height: 14, background: C.dark, borderRadius: 1, opacity: 0.4,
          }} title={`Expected pace: ${expectedPct.toFixed(0)}%`} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: paceColor }}>
            {onTrack ? 'On Track' : 'Behind Pace'}
          </span>
          {!onTrack && deficit > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: C.red }}>
              {formatAUM(deficit)} deficit
            </span>
          )}
          {onTrack && (
            <span style={{ fontSize: 11, color: C.green }}>
              +{formatAUM(aum - (goal * expectedPct / 100))} ahead
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 40 }}>
      {/* ── 2026 Launch Goal Tracker ── */}
      <div style={{
        background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10,
        padding: '28px 32px', marginBottom: 20,
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 4 }}>
              2026 Launch Goal Tracker
            </h3>
            <p style={{ fontSize: 12, color: C.slate }}>
              {formatAUM(a.ANNUAL_GOAL)} annual target · {a.ytdLaunched.length} advisors launched YTD
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: a.ytdOnTrack ? C.teal : C.red, fontFamily: "'ABC Arizona Text', Georgia, serif", lineHeight: 1 }}>
              {formatAUM(a.ytdAUM)}
            </div>
            <div style={{ fontSize: 12, color: C.slate, marginTop: 4 }}>
              {a.ytdPacePct.toFixed(1)}% of goal · {a.expectedYtdPct.toFixed(0)}% expected
            </div>
          </div>
        </div>

        {/* YTD progress bar */}
        <div style={{ position: 'relative', height: 12, background: 'rgba(91,106,113,0.08)', borderRadius: 6, overflow: 'visible', marginBottom: 24 }}>
          <div style={{
            height: '100%', borderRadius: 6,
            width: `${Math.min(a.ytdPacePct, 100)}%`,
            background: a.ytdOnTrack ? C.teal : C.red,
            transition: 'width 0.4s ease',
          }} />
          {/* Expected pace marker */}
          <div style={{
            position: 'absolute', top: -4, left: `${Math.min(a.expectedYtdPct, 100)}%`,
            width: 2, height: 20, background: C.dark, borderRadius: 1, opacity: 0.5,
          }} title={`Expected YTD pace: ${a.expectedYtdPct.toFixed(0)}%`} />
          {/* Goal markers */}
          {[25, 50, 75].map(pct => (
            <div key={pct} style={{
              position: 'absolute', top: 16, left: `${pct}%`, transform: 'translateX(-50%)',
              fontSize: 9, color: C.slate, opacity: 0.6,
            }}>
              {formatAUM(a.ANNUAL_GOAL * pct / 100)}
            </div>
          ))}
        </div>

        {/* MTD / QTD / YTD pace cards */}
        <div style={{ display: 'flex', gap: 16 }}>
          <PaceIndicator
            label={a.monthLabel}
            aum={a.mtdAUM} goal={a.monthlyGoal}
            pacePct={a.mtdPacePct} expectedPct={a.expectedMtdPct}
            onTrack={a.mtdOnTrack} deficit={a.mtdDeficit}
            count={a.mtdLaunched.length}
          />
          <PaceIndicator
            label={a.quarterLabel}
            aum={a.qtdAUM} goal={a.quarterlyGoal}
            pacePct={a.qtdPacePct} expectedPct={a.expectedQtdPct}
            onTrack={a.qtdOnTrack} deficit={a.qtdDeficit}
            count={a.qtdLaunched.length}
          />
          <PaceIndicator
            label="YTD"
            aum={a.ytdAUM} goal={a.ANNUAL_GOAL}
            pacePct={a.ytdPacePct} expectedPct={a.expectedYtdPct}
            onTrack={a.ytdOnTrack} deficit={a.ytdOnTrack ? 0 : (a.ANNUAL_GOAL * a.expectedYtdPct / 100) - a.ytdAUM}
            count={a.ytdLaunched.length}
          />
        </div>
      </div>

      {/* ── Pipeline Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        <SummaryCard
          label="Total Pipeline AUM"
          value={formatAUM(a.totalActiveAUM)}
          sub={`${a.activeDeals.length} active deals`}
          accent icon="◈"
        />
        <SummaryCard
          label="Pre-Launch AUM"
          value={formatAUM(a.preLaunchAUM)}
          sub={`${a.preLaunchDeals.length} in funnel`}
          icon="▸"
        />
        <SummaryCard
          label="Launching in 30 Days"
          value={String(a.launches30.length)}
          sub={formatAUM(a.launches30AUM) + ' projected'}
          icon="⏱"
        />
        <SummaryCard
          label="Launched Advisors"
          value={String(a.launchedDeals.length)}
          sub="Step 7 – Within 90 days"
          icon="✓"
        />
      </div>

      {/* ── Insight Cards: Sentiment · AUM · Revenue ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        {/* Sentiment Tracking */}
        {(() => {
          const scores = sentimentData?.scores ?? [];
          const tierCounts: Record<string, number> = {};
          for (const s of scores) tierCounts[s.tier] = (tierCounts[s.tier] ?? 0) + 1;
          const atRisk = (tierCounts['At Risk'] ?? 0) + (tierCounts['High Risk'] ?? 0);
          const positive = (tierCounts['Advocate'] ?? 0) + (tierCounts['Positive'] ?? 0);
          return (
            <div style={{
              background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '20px 24px', position: 'relative',
            }}>
              <span style={{ position: 'absolute', top: 16, right: 18, fontSize: 20, opacity: 0.25, color: '#1d7682' }}>✦</span>
              <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Sentiment Tracking</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
                {scores.length > 0 ? `${scores.length}` : '—'}
              </p>
              <p style={{ fontSize: 12, color: C.slate, marginTop: 4 }}>
                {scores.length > 0
                  ? `${positive} positive · ${atRisk > 0 ? `${atRisk} at risk` : 'none at risk'}`
                  : 'No scores yet'}
              </p>
            </div>
          );
        })()}

        {/* Current AUM vs Expected */}
        <div style={{
          background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: '20px 24px', position: 'relative',
        }}>
          <span style={{ position: 'absolute', top: 16, right: 18, fontSize: 20, opacity: 0.25, color: C.teal }}>◎</span>
          <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Current vs Expected AUM</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
            {aumData?.summary?.overall_transfer_pct != null ? `${aumData.summary.overall_transfer_pct}%` : '—'}
          </p>
          <p style={{ fontSize: 12, color: C.slate, marginTop: 4 }}>
            {aumData?.summary
              ? `${formatAUM(aumData.summary.total_actual_aum)} of ${formatAUM(aumData.summary.total_expected_aum)}`
              : 'Loading...'}
          </p>
        </div>

        {/* On Book Revenue */}
        <div style={{
          background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: '20px 24px', position: 'relative',
        }}>
          <span style={{ position: 'absolute', top: 16, right: 18, fontSize: 20, opacity: 0.25, color: C.green }}>$</span>
          <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>On Book Revenue</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: C.green, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
            {aumData?.summary?.total_current_revenue ? formatAUM(aumData.summary.total_current_revenue) : '—'}
          </p>
          <p style={{ fontSize: 12, color: C.slate, marginTop: 4 }}>
            {aumData?.summary?.advisors_with_actual
              ? `${aumData.summary.advisors_with_actual} advisors with AUM on book`
              : 'Based on current AUM × fee rate'}
          </p>
        </div>

        {/* Expected Revenue */}
        {(() => {
          // Expected revenue = total expected AUM × weighted avg fee rate
          const advisors = aumData?.advisors ?? [];
          let totalExpectedRevenue = 0;
          for (const adv of advisors) {
            if (adv.expected_aum && adv.fee_rate_bps && adv.fee_rate_bps > 0) {
              totalExpectedRevenue += adv.expected_aum * (adv.fee_rate_bps / 10000);
            }
          }
          return (
            <div style={{
              background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '20px 24px', position: 'relative',
            }}>
              <span style={{ position: 'absolute', top: 16, right: 18, fontSize: 20, opacity: 0.25, color: C.gold }}>★</span>
              <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Expected Revenue</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
                {totalExpectedRevenue > 0 ? formatAUM(Math.round(totalExpectedRevenue)) : '—'}
              </p>
              <p style={{ fontSize: 12, color: C.slate, marginTop: 4 }}>
                {totalExpectedRevenue > 0 && aumData?.summary?.total_current_revenue
                  ? `${Math.round((aumData.summary.total_current_revenue / totalExpectedRevenue) * 100)}% realized`
                  : 'At full AUM transfer'}
              </p>
            </div>
          );
        })()}
      </div>

      {/* ── Row 1: Stage Funnel + Launch Countdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Stage Funnel with AUM */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
          <SectionHeader title="Pipeline Funnel" subtitle="Advisors & projected AUM by stage · Launched = YTD toward $25B goal" />
          <HorizontalBar
            maxValue={a.maxStageAUM}
            perItemMax={[20e9, 15e9, 10e9, 7e9, 5e9, 4e9, 25e9]}
            items={a.stageFunnel.map(s => ({
              label: STAGE_LABELS[s.id].replace('Step ', 'S'),
              value: s.aum,
              display: formatAUM(s.aum),
              color: s.color,
              sub: `${s.count} deals`,
            }))}
          />
        </div>

        {/* Launch Countdown */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
          <SectionHeader title="Launch Countdown" subtitle="Advisors with target launch dates" />
          {/* 30/60/90 tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: '90 Days', count: a.launches90.length, aum: a.launches90AUM, color: C.teal },
              { label: '60 Days', count: a.launches60.length, aum: a.launches60AUM, color: C.amber },
              { label: '30 Days', count: a.launches30.length, aum: a.launches30AUM, color: C.red },
            ].map(item => (
              <div key={item.label} style={{
                padding: '12px 14px', borderRadius: 6,
                background: `${item.color}10`, border: `1px solid ${item.color}30`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: item.color, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
                  {item.count}
                </div>
                <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: item.color, fontWeight: 700, marginTop: 2 }}>{formatAUM(item.aum)}</div>
              </div>
            ))}
          </div>

          {/* Upcoming launches list */}
          <div style={{ maxHeight: 220, overflow: 'auto' }}>
            {a.launches90.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 420 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.cardBg, zIndex: 1 }}>
                    {['Advisor', 'Stage', 'Exp. AUM', 'Days'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Advisor' ? 'left' : 'right', color: C.slate, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {a.launches90
                    .sort((x, y) => {
                      const dx = daysUntil(x.desired_start_date!);
                      const dy = daysUntil(y.desired_start_date!);
                      const x30 = dx <= 30 ? 0 : 1;
                      const y30 = dy <= 30 ? 0 : 1;
                      if (x30 !== y30) return x30 - y30;
                      return dx - dy;
                    })
                    .map(deal => {
                      const days = daysUntil(deal.desired_start_date!);
                      const urgencyColor = days <= 7 ? C.red : days <= 30 ? C.amber : C.teal;
                      return (
                        <tr key={deal.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '5px 8px' }}>
                            <Link href={`/command-center/advisor/${deal.id}`} style={{ color: C.teal, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                              {deal.dealname}
                            </Link>
                          </td>
                          <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                            <StageBadge stageId={deal.dealstage} label={STAGE_LABELS[deal.dealstage] ?? deal.dealstage} />
                          </td>
                          <td style={{ padding: '5px 8px', color: C.teal, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {formatAUM(parseFloat(deal.transferable_aum ?? '0'))}
                          </td>
                          <td style={{ padding: '5px 8px', fontWeight: 600, textAlign: 'right', color: urgencyColor, whiteSpace: 'nowrap' }}>
                            {days}d
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: 13, color: C.slate, textAlign: 'center', padding: 20 }}>No launches scheduled in the next 90 days</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADVISOR RECRUITING TAB
// ══════════════════════════════════════════════════════════════════════════════
function RecruitingTab() {
  const { data, error, isLoading } = useSWR('/api/command-center/pipeline', fetcher, { refreshInterval: 43_200_000 });
  const [showDashboard, setShowDashboard] = useState(true);
  const [complexityScores, setComplexityScores] = useState<Record<string, { score: number; tier: string; tierColor: string }>>({});
  const [advisorTab, setAdvisorTab] = useState<'launch_to_grad' | 'early' | 'completed'>('launch_to_grad');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortCol, setSortCol] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showAI, setShowAI] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Ask me anything about the pipeline — stalled deals, upcoming launches, advisor details, or risk factors." },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiBottomRef = useRef<HTMLDivElement>(null);
  const [teamAssignments, setTeamAssignments] = useState<Record<string, Record<string, string>>>({});
  const { data: aumData } = useSWR('/api/command-center/aum-tracker?all=true', fetcher);

  const deals: Deal[] = useMemo(
    () => (data?.deals ?? []).filter((d: Deal) => !d.dealname?.toLowerCase().includes('test')),
    [data]
  );

  // Fetch complexity scores after deals load
  const dealIdKey = useMemo(() => deals.map(d => d.id).join(','), [deals]);
  useEffect(() => {
    if (deals.length === 0) return;
    const dealIds = deals.map(d => d.id);
    fetch('/api/command-center/complexity/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealIds }),
    })
      .then(r => r.json())
      .then(d => { if (d.scores) setComplexityScores(d.scores); })
      .catch(() => {}); // Silent fail — scores are supplementary
  }, [dealIdKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch team assignments from database after deals load
  useEffect(() => {
    if (deals.length === 0) return;
    fetch('/api/command-center/assignments')
      .then(r => r.json())
      .then(d => {
        if (d.assignments) {
          const map: Record<string, Record<string, string>> = {};
          for (const a of d.assignments) {
            if (!map[a.deal_id]) map[a.deal_id] = {};
            map[a.deal_id][a.role] = a.member_name;
          }
          setTeamAssignments(map);
        }
      })
      .catch(() => {});
  }, [dealIdKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build map of deal_id → { actual_aum, current_revenue } from AUM tracker data
  const aumMap = useMemo(() => {
    const map: Record<string, { actual_aum: number | null; current_revenue: number | null }> = {};
    if (aumData?.advisors) {
      for (const a of aumData.advisors) {
        map[a.deal_id] = { actual_aum: a.actual_aum, current_revenue: a.current_revenue };
      }
    }
    return map;
  }, [aumData]);

  // Auto-scroll AI chat
  useEffect(() => {
    aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  if (isLoading) return <div style={{ padding: '60px 0', color: C.slate }}>Loading pipeline…</div>;
  if (error || data?.error) return <div style={{ padding: '60px 0', color: C.red }}>Failed to load pipeline data.</div>;

  // All deals sorted by funnel stage order
  const allActiveDeals = [...deals]
    .filter(d => ACTIVE_STAGE_IDS.includes(d.dealstage))
    .sort((a, b) => FUNNEL_STAGE_ORDER.indexOf(a.dealstage) - FUNNEL_STAGE_ORDER.indexOf(b.dealstage));

  // Filter deals by sub-tab
  const sortedDeals = allActiveDeals.filter(d => {
    if (advisorTab === 'early') return EARLY_STAGE_IDS.includes(d.dealstage);
    if (advisorTab === 'completed') return d.dealstage === '100411705' && (d.daysSinceLaunch ?? 0) >= 90;
    // launch_to_grad: Stages 5-7, but launched advisors only if < 90 days
    if (LAUNCH_STAGE_IDS.includes(d.dealstage)) {
      if (d.dealstage === '100411705') return (d.daysSinceLaunch ?? 0) < 90;
      return true;
    }
    return false;
  });

  // Stage IDs relevant to the active sub-tab (for filter dropdown)
  const tabStageIds = advisorTab === 'early' ? EARLY_STAGE_IDS
    : advisorTab === 'completed' ? ['100411705']
    : LAUNCH_STAGE_IDS;

  // Apply search & filters
  const filteredDeals = sortedDeals.filter(d => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = [d.dealname, d.current_firm__cloned_, d.firm_type, d.ownerName, d.custodian__cloned_]
        .some(f => f?.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (stageFilter !== 'all' && d.dealstage !== stageFilter) return false;
    if (typeFilter !== 'all' && d.firm_type !== typeFilter) return false;
    return true;
  });

  // Unique firm types for filter dropdown
  const firmTypes = Array.from(new Set(sortedDeals.map(d => d.firm_type).filter(Boolean))) as string[];

  // AI send function
  async function sendAiMessage(text: string) {
    if (!text.trim() || aiLoading) return;
    const userMsg = { role: 'user' as const, content: text.trim() };
    const updated = [...aiMessages, userMsg];
    setAiMessages(updated);
    setAiInput('');
    setAiLoading(true);
    try {
      const res = await fetch('/api/command-center/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      const d = await res.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: d.reply ?? d.error ?? 'Error occurred.' }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <>
      {/* Toolbar: Analytics toggle + AI toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setShowAI(!showAI)}
          style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
            background: showAI ? C.teal : C.cardBg,
            color: showAI ? C.white : C.slate,
            border: `1px solid ${showAI ? C.teal : C.border}`,
            cursor: 'pointer', transition: 'all 150ms ease',
          }}
        >
          {showAI ? '✦ Hide AI' : '✦ Ask AI'}
        </button>
        <button
          onClick={() => setShowDashboard(!showDashboard)}
          style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
            background: showDashboard ? C.teal : C.cardBg,
            color: showDashboard ? C.white : C.slate,
            border: `1px solid ${showDashboard ? C.teal : C.border}`,
            cursor: 'pointer', transition: 'all 150ms ease',
          }}
        >
          {showDashboard ? '◈ Hide Analytics' : '◈ Show Analytics'}
        </button>
      </div>

      {/* Command Dashboard */}
      {showDashboard && <CommandDashboard deals={deals} />}

      {/* Inline AI Chat */}
      {showAI && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: C.white }}>✦</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>AX AI Assistant</span>
            <span style={{ fontSize: 11, color: C.slate }}>· Powered by Grok · Live pipeline data</span>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto', padding: '12px 16px' }}>
            {aiMessages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                <div style={{
                  maxWidth: '75%', padding: '8px 14px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? C.teal : '#f7f4ef',
                  color: msg.role === 'user' ? C.white : C.dark,
                  fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  border: msg.role === 'user' ? 'none' : `1px solid ${C.border}`,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ padding: '8px 14px', borderRadius: '14px 14px 14px 4px', background: '#f7f4ef', border: `1px solid ${C.border}`, fontSize: 13, color: C.slate }}>
                  Thinking…
                </div>
              </div>
            )}
            <div ref={aiBottomRef} />
          </div>
          <form
            onSubmit={e => { e.preventDefault(); sendAiMessage(aiInput); }}
            style={{ display: 'flex', gap: 8, padding: '10px 16px', borderTop: `1px solid ${C.border}`, background: '#faf7f2' }}
          >
            <input
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="Ask about deals, advisors, risks, upcoming launches…"
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                fontSize: 13, color: C.dark, background: C.white, outline: 'none',
                fontFamily: "'Fakt', system-ui, sans-serif",
              }}
            />
            <button
              type="submit"
              disabled={!aiInput.trim() || aiLoading}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: aiInput.trim() && !aiLoading ? C.teal : C.border,
                color: aiInput.trim() && !aiLoading ? C.white : C.slate,
                fontSize: 13, fontWeight: 600, cursor: aiInput.trim() && !aiLoading ? 'pointer' : 'default',
                fontFamily: "'Fakt', system-ui, sans-serif",
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Sub-tabs: Early Deals / Launch to Graduation / Completed Transitions */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${C.border}`, marginBottom: 20 }}>
        {([
          { key: 'launch_to_grad' as const, label: 'Launch to Graduation', sub: 'Steps 5–7 (< 90 days)' },
          { key: 'early' as const, label: 'Early Deals', sub: 'Steps 1–4' },
          { key: 'completed' as const, label: 'Completed Transitions', sub: '90+ days post-launch' },
        ]).map(tab => {
          const isActive = advisorTab === tab.key;
          // Count deals for badge
          const count = allActiveDeals.filter(d => {
            if (tab.key === 'early') return EARLY_STAGE_IDS.includes(d.dealstage);
            if (tab.key === 'completed') return d.dealstage === '100411705' && (d.daysSinceLaunch ?? 0) >= 90;
            if (LAUNCH_STAGE_IDS.includes(d.dealstage)) {
              if (d.dealstage === '100411705') return (d.daysSinceLaunch ?? 0) < 90;
              return true;
            }
            return false;
          }).length;
          return (
            <button
              key={tab.key}
              onClick={() => { setAdvisorTab(tab.key); setStageFilter('all'); }}
              style={{
                padding: '10px 20px', background: 'none', border: 'none',
                borderBottom: `2px solid ${isActive ? C.teal : 'transparent'}`,
                marginBottom: -2, cursor: 'pointer', transition: 'all 150ms ease',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? C.teal : C.slate, fontFamily: "'Fakt', system-ui, sans-serif" }}>
                {tab.label}
              </span>
              <span style={{
                marginLeft: 6, fontSize: 11, fontWeight: 600,
                padding: '1px 6px', borderRadius: 10,
                background: isActive ? 'rgba(29,118,130,0.12)' : 'rgba(91,106,113,0.08)',
                color: isActive ? C.teal : C.slate,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search, Filters & Stage Pills */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search advisors, firms, owners…"
            style={{
              width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8,
              border: `1px solid ${C.border}`, fontSize: 13, color: C.dark,
              background: C.cardBg, outline: 'none', fontFamily: "'Fakt', system-ui, sans-serif",
            }}
          />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.slate }}>⌕</span>
        </div>

        {/* Stage Filter */}
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
            fontSize: 12, color: C.dark, background: C.cardBg, outline: 'none',
            fontFamily: "'Fakt', system-ui, sans-serif", cursor: 'pointer',
          }}
        >
          <option value="all">All Stages</option>
          {tabStageIds.map(sid => (
            <option key={sid} value={sid}>{STAGE_LABELS[sid]}</option>
          ))}
        </select>

        {/* Firm Type Filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
            fontSize: 12, color: C.dark, background: C.cardBg, outline: 'none',
            fontFamily: "'Fakt', system-ui, sans-serif", cursor: 'pointer',
          }}
        >
          <option value="all">All Firm Types</option>
          {firmTypes.map(ft => (
            <option key={ft} value={ft}>{ft.replace(/_/g, ' ')}</option>
          ))}
        </select>

        {/* Result count */}
        <span style={{ fontSize: 12, color: C.slate }}>
          {filteredDeals.length} of {sortedDeals.length} deals
        </span>
      </div>

      {/* Stage Funnel Pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {tabStageIds.map(stageId => {
          const count = sortedDeals.filter(d => d.dealstage === stageId).length;
          if (!count) return null;
          const isLaunched = stageId === '100411705';
          const isOfferAccepted = stageId === '2496936';
          const isSelected = stageFilter === stageId;
          return (
            <button key={stageId} onClick={() => setStageFilter(isSelected ? 'all' : stageId)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
              background: isSelected ? C.teal : isLaunched ? 'rgba(29,118,130,0.15)' : isOfferAccepted ? C.goldBg : 'rgba(91,106,113,0.08)',
              color: isSelected ? C.white : isLaunched ? C.teal : isOfferAccepted ? C.gold : C.slate,
              fontFamily: "'Fakt', system-ui, sans-serif",
            }}>
              {STAGE_LABELS[stageId]} · {count}
            </button>
          );
        })}
      </div>

      {/* Deals Table */}
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#f7f4ef' }}>
                {[
                  { key: 'dealname', label: 'Advisor / Deal' },
                  { key: 'current_firm__cloned_', label: 'Prior Firm' },
                  { key: 'firm_type', label: 'Type' },
                  { key: 'dealstage', label: 'Stage' },
                  { key: 'transferable_aum', label: 'Exp. AUM' },
                  { key: 'actual_aum', label: 'Tran AUM' },
                  { key: 'current_revenue', label: 'Revenue' },
                  { key: 'complexity', label: 'Complexity' },
                  { key: 'launch_date', label: 'Launch Date' },
                  { key: 'launch_status', label: 'Launch Status' },
                  { key: 'axm', label: 'AXM', color: C.teal },
                  { key: 'axa', label: 'AXA' },
                  { key: 'ctm', label: 'CTM', color: '#2f73a8' },
                  { key: 'cta', label: 'CTA' },
                  { key: 'ownerName', label: 'Recruiter' },
                ].map((col: { key: string; label: string; color?: string }) => (
                  <th
                    key={col.key}
                    onClick={() => {
                      if (sortCol === col.key) {
                        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortCol(col.key);
                        setSortDir('asc');
                      }
                    }}
                    style={{
                      padding: '10px 14px', textAlign: 'left', color: col.color || C.slate, fontSize: 11,
                      fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                      whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
                    }}
                  >
                    {col.label} {sortCol === col.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const displayed = [...filteredDeals].sort((a, b) => {
                  if (!sortCol) return 0;
                  const dir = sortDir === 'asc' ? 1 : -1;
                  if (sortCol === 'transferable_aum') {
                    return ((parseFloat(a.transferable_aum ?? '0') || 0) - (parseFloat(b.transferable_aum ?? '0') || 0)) * dir;
                  }
                  if (sortCol === 'actual_aum') {
                    return ((aumMap[a.id]?.actual_aum ?? 0) - (aumMap[b.id]?.actual_aum ?? 0)) * dir;
                  }
                  if (sortCol === 'current_revenue') {
                    return ((aumMap[a.id]?.current_revenue ?? 0) - (aumMap[b.id]?.current_revenue ?? 0)) * dir;
                  }
                  if (sortCol === 'complexity') {
                    return ((complexityScores[a.id]?.score ?? 0) - (complexityScores[b.id]?.score ?? 0)) * dir;
                  }
                  if (sortCol === 'launch_date') {
                    const da = a.desired_start_date ?? a.actual_launch_date ?? '';
                    const db = b.desired_start_date ?? b.actual_launch_date ?? '';
                    return da.localeCompare(db) * dir;
                  }
                  if (sortCol === 'dealstage') {
                    return (FUNNEL_STAGE_ORDER.indexOf(a.dealstage) - FUNNEL_STAGE_ORDER.indexOf(b.dealstage)) * dir;
                  }
                  if (['axm', 'axa', 'ctm', 'cta'].includes(sortCol)) {
                    const roleKey = sortCol.toUpperCase();
                    const va = teamAssignments[a.id]?.[roleKey] ?? '';
                    const vb = teamAssignments[b.id]?.[roleKey] ?? '';
                    return va.localeCompare(vb) * dir;
                  }
                  const va = ((a as unknown as Record<string, unknown>)[sortCol] as string) ?? '';
                  const vb = ((b as unknown as Record<string, unknown>)[sortCol] as string) ?? '';
                  return va.localeCompare(vb) * dir;
                });
                return displayed.map((deal, i) => {
                  const cx = complexityScores[deal.id];
                  const launchDate = deal.desired_start_date ?? deal.actual_launch_date;
                  return (
                    <tr key={deal.id} style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: i % 2 === 0 ? C.cardBg : '#faf7f2',
                    }}>
                      <td style={{ padding: '10px 14px' }}>
                        <Link href={`/command-center/advisor/${deal.id}`} style={{ fontWeight: 600, color: C.teal, textDecoration: 'none' }}>
                          {deal.dealname}
                        </Link>
                      </td>
                      <td style={{ padding: '10px 14px', color: C.slate }}>{deal.current_firm__cloned_ ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: C.slate }}>{deal.firm_type ?? '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <StageBadge stageId={deal.dealstage} label={STAGE_LABELS[deal.dealstage] ?? deal.dealstage} />
                      </td>
                      <td style={{ padding: '10px 14px', color: C.teal, fontWeight: 600 }}>
                        {formatAUM(parseFloat(deal.transferable_aum ?? '0'))}
                      </td>
                      <td style={{ padding: '10px 14px', color: aumMap[deal.id]?.actual_aum ? C.dark : C.slate, fontWeight: aumMap[deal.id]?.actual_aum ? 600 : 400 }}>
                        {aumMap[deal.id]?.actual_aum ? formatAUM(aumMap[deal.id].actual_aum) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: aumMap[deal.id]?.current_revenue ? C.green : C.slate, fontWeight: aumMap[deal.id]?.current_revenue ? 600 : 400 }}>
                        {aumMap[deal.id]?.current_revenue ? formatAUM(aumMap[deal.id].current_revenue) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {cx ? <ComplexityBadge score={cx.score} tier={cx.tier} tierColor={cx.tierColor} /> : <span style={{ color: C.slate, fontSize: 11 }}>…</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: C.slate, whiteSpace: 'nowrap' }}>
                        {launchDate ? formatDate(launchDate) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <LaunchTimer deal={deal} />
                      </td>
                      <td style={{ padding: '10px 14px', color: teamAssignments[deal.id]?.AXM ? C.teal : C.slate, fontWeight: teamAssignments[deal.id]?.AXM ? 600 : 400 }}>{teamAssignments[deal.id]?.AXM ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: teamAssignments[deal.id]?.AXA ? C.dark : C.slate, fontWeight: teamAssignments[deal.id]?.AXA ? 500 : 400 }}>{teamAssignments[deal.id]?.AXA ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: teamAssignments[deal.id]?.CTM ? '#2f73a8' : C.slate, fontWeight: teamAssignments[deal.id]?.CTM ? 600 : 400 }}>{teamAssignments[deal.id]?.CTM ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: teamAssignments[deal.id]?.CTA ? C.dark : C.slate, fontWeight: teamAssignments[deal.id]?.CTA ? 500 : 400 }}>{teamAssignments[deal.id]?.CTA ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: C.slate }}>{deal.ownerName ?? '—'}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ACQUISITIONS TAB
// ══════════════════════════════════════════════════════════════════════════════
function AcquisitionsTab() {
  const { data, error, isLoading } = useSWR('/api/command-center/acquisitions', fetcher, { refreshInterval: 43_200_000 });

  if (isLoading) return <div style={{ padding: '60px 0', color: C.slate }}>Loading acquisitions…</div>;
  if (error || data?.error) return <div style={{ padding: '60px 0', color: C.red }}>Failed to load acquisitions data.</div>;

  const deals: AcquisitionsDeal[] = data?.deals ?? [];
  const stages: AcquisitionsStage[] = data?.stages ?? [];
  const activeDeals = deals.filter(d => !d.isTerminal);
  const terminalDeals = deals.filter(d => d.isTerminal);
  const totalAUM = activeDeals.reduce((acc, d) => acc + (parseFloat(d.transferable_aum ?? '0') || 0), 0);

  return (
    <>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <SummaryCard label="Total M&A Pipeline" value={formatAUM(totalAUM)} sub={`${activeDeals.length} active deals`} accent icon="◈" />
        <SummaryCard label="Total Deals" value={String(deals.length)} sub={`${activeDeals.length} active · ${terminalDeals.length} closed`} icon="▸" />
        <SummaryCard label="Active Stages" value={String(stages.filter(s => !s.isTerminal && s.count > 0).length)} sub="in progress" icon="▲" />
        <SummaryCard
          label="Avg Deal Size"
          value={activeDeals.length ? formatAUM(totalAUM / activeDeals.length) : '—'}
          sub="transferable AUM" icon="✦"
        />
      </div>

      {/* Stage Funnel Pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
        {stages.filter(s => s.count > 0).map(stage => (
          <div key={stage.id} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: stage.isTerminal ? C.redBg : 'rgba(91,106,113,0.08)',
            color: stage.isTerminal ? C.red : C.slate,
          }}>
            {stage.label} · {stage.count}
          </div>
        ))}
      </div>

      {/* Deals Table */}
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#f7f4ef' }}>
                {['Deal Name', 'Prior Firm', 'Type', 'Stage', 'Exp. AUM', 'Households', 'Target Date', 'Owner'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: C.slate, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map((deal, i) => {
                const rowOpacity = deal.isTerminal ? 0.6 : 1;
                return (
                  <tr key={deal.id} style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: deal.isTerminal ? 'rgba(192,57,43,0.03)' : i % 2 === 0 ? C.cardBg : '#faf7f2',
                    opacity: rowOpacity,
                  }}>
                    <td style={{ padding: '10px 14px' }}>
                      <Link
                        href={`/command-center/advisor/${deal.id}`}
                        style={{ fontWeight: 600, color: deal.isTerminal ? C.slate : C.teal, textDecoration: deal.isTerminal ? 'line-through' : 'none' }}
                      >
                        {deal.dealname}
                      </Link>
                    </td>
                    <td style={{ padding: '10px 14px', color: C.slate }}>{deal.current_firm__cloned_ ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: C.slate }}>{deal.firm_type ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <StageBadge stageId={deal.dealstage} label={deal.stageLabel} isTerminal={deal.isTerminal} />
                    </td>
                    <td style={{ padding: '10px 14px', color: deal.isTerminal ? C.slate : C.teal, fontWeight: 600 }}>
                      {formatAUM(parseFloat(deal.transferable_aum ?? '0'))}
                    </td>
                    <td style={{ padding: '10px 14px', color: C.slate }}>{deal.client_households ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: C.slate }}>
                      {formatDate(deal.desired_start_date)}
                    </td>
                    <td style={{ padding: '10px 14px', color: C.slate }}>{deal.ownerName ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD WITH TABS
// ══════════════════════════════════════════════════════════════════════════════
type TabKey = 'recruiting' | 'acquisitions';

export default function PipelineDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('recruiting');

  const tabs: { key: TabKey; label: string; sublabel: string }[] = [
    { key: 'recruiting', label: 'Advisor Recruiting', sublabel: 'Pipeline 751770' },
    { key: 'acquisitions', label: 'Acquisitions', sublabel: 'M&A Pipeline' },
  ];

  return (
    <div style={{ padding: '40px 40px', minHeight: '100vh', background: C.bg, fontFamily: "'Fakt', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 6 }}>
          Pipeline Dashboard
        </h1>
        <p style={{ color: C.slate, fontSize: 14 }}>
          Live HubSpot data · refreshes every 30s
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${C.border}`, marginBottom: 32 }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 24px', background: 'none', border: 'none',
                borderBottom: `2px solid ${isActive ? C.teal : 'transparent'}`,
                marginBottom: -2, cursor: 'pointer', transition: 'all 150ms ease',
              }}
            >
              <span style={{
                fontSize: 14, fontWeight: isActive ? 600 : 400,
                color: isActive ? C.teal : C.slate,
                fontFamily: "'Fakt', system-ui, sans-serif",
              }}>
                {tab.label}
              </span>
              <span style={{
                display: 'block', fontSize: 11,
                color: isActive ? C.teal : C.slate,
                opacity: 0.6, marginTop: 2,
              }}>
                {tab.sublabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'recruiting' && <RecruitingTab />}
      {activeTab === 'acquisitions' && <AcquisitionsTab />}
    </div>
  );
}
