'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  dark: '#333333', white: '#ffffff', slate: '#5b6a71',
  lightBlue: '#b6d0ed', teal: '#1d7682', bg: '#FAF7F2',
  cardBg: '#ffffff', border: '#e8e2d9',
  red: '#c0392b', redBg: 'rgba(192,57,43,0.08)', redBorder: 'rgba(192,57,43,0.18)',
  amber: '#b27d2e', amberBg: 'rgba(178,125,46,0.08)', amberBorder: 'rgba(178,125,46,0.18)',
  gold: '#c8a951', goldBg: 'rgba(200,169,81,0.10)',
  green: '#27ae60', greenBg: 'rgba(39,174,96,0.10)',
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
const ALL_STAGE_ORDER = [...FUNNEL_STAGE_ORDER];

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
}

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
function HorizontalBar({ items, maxValue }: { items: { label: string; value: number; color: string; sub?: string }[]; maxValue: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 130, fontSize: 12, color: C.slate, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.label}
          </div>
          <div style={{ flex: 1, height: 22, background: 'rgba(91,106,113,0.06)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${maxValue > 0 ? Math.max((item.value / maxValue) * 100, 2) : 0}%`,
              background: item.color, transition: 'width 0.4s ease',
            }} />
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 600, color: C.dark }}>
              {item.value}{item.sub ? ` · ${item.sub}` : ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Distribution pill list ───────────────────────────────────────────────────
function DistributionList({ items, total }: { items: { label: string; count: number }[]; total: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, fontSize: 13, color: C.dark }}>{item.label}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.teal, minWidth: 30, textAlign: 'right' }}>{item.count}</div>
            <div style={{ width: 60, height: 6, background: 'rgba(91,106,113,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: C.teal, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 11, color: C.slate, minWidth: 32, textAlign: 'right' }}>{pct}%</div>
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
  const analytics = useMemo(() => {
    const activeDeals = deals.filter(d => ACTIVE_STAGE_IDS.includes(d.dealstage));
    const funnelDeals = deals.filter(d => FUNNEL_STAGE_ORDER.includes(d.dealstage));
    const launchedDeals = deals.filter(d => d.dealstage === '100411705');
    const preLaunchDeals = activeDeals.filter(d => d.dealstage !== '100411705');

    const getAUM = (d: Deal) => parseFloat(d.transferable_aum ?? '0') || 0;

    // ── Stage funnel ──
    const stageFunnel = FUNNEL_STAGE_ORDER.map(sid => {
      const stageDeals = funnelDeals.filter(d => d.dealstage === sid);
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

    // ── Firm type distribution ──
    const firmTypeCounts: Record<string, number> = {};
    for (const d of activeDeals) {
      const ft = d.firm_type || 'Not Set';
      firmTypeCounts[ft] = (firmTypeCounts[ft] ?? 0) + 1;
    }
    const firmTypes = Object.entries(firmTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([label, count]) => ({ label: label.replace(/_/g, ' '), count }));

    // ── Transition type distribution ──
    const transTypeCounts: Record<string, number> = {};
    for (const d of activeDeals) {
      const tt = d.transition_type || 'Not Set';
      transTypeCounts[tt] = (transTypeCounts[tt] ?? 0) + 1;
    }
    const transTypes = Object.entries(transTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([label, count]) => ({ label, count }));

    // ── Custodian distribution ──
    const custCounts: Record<string, number> = {};
    for (const d of activeDeals) {
      let cust = (d.custodian__cloned_ ?? '').trim();
      if (!cust) cust = 'Not Set';
      // Normalize Schwab variants
      if (cust.toLowerCase().includes('schwab') || cust.toLowerCase().includes('charles schwab')) {
        if (!cust.includes(',') && !cust.includes('&')) cust = 'Schwab';
      }
      custCounts[cust] = (custCounts[cust] ?? 0) + 1;
    }
    const custodians = Object.entries(custCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([label, count]) => ({ label, count }));

    // ── AUM by stage ──
    const maxStageAUM = Math.max(...stageFunnel.map(s => s.aum));

    return {
      activeDeals, launchedDeals, preLaunchDeals,
      stageFunnel, totalActiveAUM, preLaunchAUM,
      launches30, launches60, launches90, launches30AUM, launches60AUM, launches90AUM,
      firmTypes, transTypes, custodians,
      maxStageAUM,
    };
  }, [deals]);

  const a = analytics;
  const totalFunnelDeals = a.activeDeals.length;

  return (
    <div style={{ marginBottom: 40 }}>
      {/* ── Hero Stats ── */}
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

      {/* ── Row 1: Stage Funnel + Launch Countdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Stage Funnel with AUM */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
          <SectionHeader title="Pipeline Funnel" subtitle="Advisors & projected AUM by stage" />
          <HorizontalBar
            maxValue={a.maxStageAUM}
            items={a.stageFunnel.map(s => ({
              label: STAGE_LABELS[s.id].replace('Step ', 'S'),
              value: s.count,
              color: s.color,
              sub: formatAUM(s.aum),
            }))}
          />
        </div>

        {/* Launch Countdown */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
          <SectionHeader title="Launch Countdown" subtitle="Advisors with target launch dates" />
          {/* 30/60/90 tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: '30 Days', count: a.launches30.length, aum: a.launches30AUM, color: C.red },
              { label: '60 Days', count: a.launches60.length, aum: a.launches60AUM, color: C.amber },
              { label: '90 Days', count: a.launches90.length, aum: a.launches90AUM, color: C.teal },
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
                <div style={{ fontSize: 11, color: item.color, fontWeight: 600, marginTop: 2 }}>{formatAUM(item.aum)}</div>
              </div>
            ))}
          </div>

          {/* Upcoming launches list */}
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {a.launches30.length > 0 ? (
              <div style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 600, color: C.dark, marginBottom: 8 }}>Next 30 Days</div>
                {a.launches30.map(deal => (
                  <div key={deal.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                    <Link href={`/command-center/advisor/${deal.id}`} style={{ color: C.teal, fontWeight: 500, textDecoration: 'none', flex: 1 }}>
                      {deal.dealname}
                    </Link>
                    <StageBadge stageId={deal.dealstage} label={STAGE_LABELS[deal.dealstage] ?? deal.dealstage} />
                    <span style={{ color: C.teal, fontWeight: 600, minWidth: 50, textAlign: 'right' }}>{formatAUM(parseFloat(deal.transferable_aum ?? '0'))}</span>
                    <span style={{ color: C.slate, minWidth: 40, textAlign: 'right' }}>{daysUntil(deal.desired_start_date!)}d</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: C.slate, textAlign: 'center', padding: 20 }}>No launches scheduled in the next 30 days</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: AUM by Stage bar chart ── */}
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, marginBottom: 20 }}>
        <SectionHeader title="Projected AUM by Stage" subtitle="Total transferable AUM at each funnel stage" />
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140 }}>
          {a.stageFunnel.map(stage => {
            const maxAUM = a.maxStageAUM || 1;
            const heightPct = Math.max((stage.aum / maxAUM) * 100, 4);
            return (
              <div key={stage.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.dark }}>{formatAUM(stage.aum)}</div>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  height: `${heightPct}%`, minHeight: 4,
                  background: stage.color, transition: 'height 0.4s ease',
                }} />
                <div style={{ fontSize: 10, color: C.slate, textAlign: 'center', lineHeight: 1.2 }}>
                  {STAGE_LABELS[stage.id].replace('Step ', 'S').replace(' – ', '\n')}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: stage.color }}>{stage.count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Row 3: Breakdown Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Firm Type */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
          <SectionHeader title="Firm Type" subtitle="Where advisors are coming from" />
          <DistributionList items={a.firmTypes} total={totalFunnelDeals} />
        </div>

        {/* Transition Type */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
          <SectionHeader title="Transition Type" subtitle="How assets will move" />
          <DistributionList items={a.transTypes} total={totalFunnelDeals} />
        </div>

        {/* Custodian */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
          <SectionHeader title="Custodian" subtitle="Current custodian relationships" />
          <DistributionList items={a.custodians.slice(0, 8)} total={totalFunnelDeals} />
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

  const deals: Deal[] = data?.deals ?? [];

  // Fetch complexity scores after deals load
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
  }, [deals]);

  if (isLoading) return <div style={{ padding: '60px 0', color: C.slate }}>Loading pipeline…</div>;
  if (error || data?.error) return <div style={{ padding: '60px 0', color: C.red }}>Failed to load pipeline data.</div>;

  // All deals sorted by funnel stage order
  const sortedDeals = [...deals]
    .filter(d => ACTIVE_STAGE_IDS.includes(d.dealstage))
    .sort((a, b) => FUNNEL_STAGE_ORDER.indexOf(a.dealstage) - FUNNEL_STAGE_ORDER.indexOf(b.dealstage));

  return (
    <>
      {/* Toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
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

      {/* Stage Funnel Pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {ALL_STAGE_ORDER.map(stageId => {
          const count = sortedDeals.filter(d => d.dealstage === stageId).length;
          if (!count) return null;
          const isLaunched = stageId === '100411705';
          const isOfferAccepted = stageId === '2496936';
          return (
            <div key={stageId} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: isLaunched ? 'rgba(29,118,130,0.15)' : isOfferAccepted ? C.goldBg : 'rgba(91,106,113,0.08)',
              color: isLaunched ? C.teal : isOfferAccepted ? C.gold : C.slate,
            }}>
              {STAGE_LABELS[stageId]} · {count}
            </div>
          );
        })}
      </div>

      {/* Deals Table */}
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#f7f4ef' }}>
                {['Advisor / Deal', 'Prior Firm', 'Type', 'Stage', 'Exp. AUM', 'Complexity', 'Launch Status', 'Owner'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: C.slate, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedDeals.map((deal, i) => {
                const cx = complexityScores[deal.id];
                return (
                  <tr key={deal.id} style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: i % 2 === 0 ? C.cardBg : '#faf7f2',
                  }}>
                    <td style={{ padding: '10px 14px' }}>
                      <Link
                        href={`/command-center/advisor/${deal.id}`}
                        style={{ fontWeight: 600, color: C.teal, textDecoration: 'none' }}
                      >
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
                    <td style={{ padding: '10px 14px' }}>
                      {cx ? <ComplexityBadge score={cx.score} tier={cx.tier} tierColor={cx.tierColor} /> : <span style={{ color: C.slate, fontSize: 11 }}>…</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <LaunchTimer deal={deal} />
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
