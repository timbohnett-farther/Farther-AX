'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme-provider';
import type { AumAdvisor } from './types';

// ── AUM Pace Warning Logic ──────────────────────────────────────────────
// Master Merge:   95% within 14 days
// LPOA:           60% by 30d, 80% by 45d, 90% by 60d
// Repaper:        ~90% by graduation (90 days)

interface PaceTarget {
  days: number;
  expectedPct: number;
}

const PACE_TARGETS: Record<string, PaceTarget[]> = {
  'Master Merge': [{ days: 14, expectedPct: 95 }],
  LPOA: [
    { days: 30, expectedPct: 60 },
    { days: 45, expectedPct: 80 },
    { days: 60, expectedPct: 90 },
  ],
  Repaper: [{ days: 90, expectedPct: 90 }],
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
    return {
      status: 'unknown',
      label: '—',
      detail: 'Insufficient data',
      currentTarget: null,
      nextTarget: null,
    };
  }

  // Normalize transition type to match keys
  const typeKey = Object.keys(PACE_TARGETS).find(k =>
    transition_type.toLowerCase().includes(k.toLowerCase())
  );

  if (!typeKey) {
    return {
      status: 'unknown',
      label: '—',
      detail: `No pace targets for "${transition_type}"`,
      currentTarget: null,
      nextTarget: null,
    };
  }

  const targets = PACE_TARGETS[typeKey];

  // Find the current applicable target and the next upcoming target
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
  warning: { color: '#e67e22', bg: 'rgba(230,126,34,0.10)', icon: '⚠' },
  behind: { color: '#c0392b', bg: 'rgba(192,57,43,0.08)', icon: '▼' },
  unknown: { color: '#5b6a71', bg: 'rgba(91,106,113,0.06)', icon: '●' },
};

// ── Helper Functions ────────────────────────────────────────────────────

function formatAUM(n: number | null | undefined): string {
  if (!n || isNaN(n)) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

// ── AUM Progress Bar Component ─────────────────────────────────────────

function AumProgressBar({ expected, actual }: { expected: number | null; actual: number | null }) {
  const { THEME } = useTheme();

  if (!expected || !actual) {
    return (
      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
        —
      </span>
    );
  }
  const pct = Math.min(Math.round((actual / expected) * 100), 200);
  const displayPct = Math.min(pct, 100); // cap bar at 100%
  const color =
    pct >= 90
      ? THEME.colors.success
      : pct >= 60
      ? THEME.colors.bronze400
      : pct >= 30
      ? THEME.colors.warning
      : THEME.colors.error;

  return (
    <div style={{ minWidth: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color }}>{pct}%</span>
        <span
          style={{
            fontSize: 10,
            color: 'var(--color-text-secondary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatAUM(actual)}
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: 'rgba(91,106,113,0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 3,
            background: color,
            width: `${displayPct}%`,
            transition: 'width 300ms ease',
          }}
        />
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

interface AumTrackerTabProps {
  advisors: AumAdvisor[];
  loading: boolean;
  search: string;
}

export function AumTrackerTab({ advisors, loading }: AumTrackerTabProps) {
  const { THEME } = useTheme();

  if (loading) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 60,
          color: 'var(--color-text-secondary)',
          fontSize: 14,
        }}
      >
        Loading AUM data...
      </div>
    );
  }

  if (advisors.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 60,
          color: 'var(--color-text-secondary)',
          fontSize: 14,
        }}
      >
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
        <div
          style={{
            display: 'flex',
            gap: 16,
            padding: '12px 20px',
            marginBottom: 8,
            background: behindCount > 0 ? 'rgba(192,57,43,0.05)' : 'rgba(230,126,34,0.05)',
            border: `1px solid ${behindCount > 0 ? 'rgba(192,57,43,0.15)' : 'rgba(230,126,34,0.15)'}`,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 16 }}>{behindCount > 0 ? '⚠' : '◈'}</span>
          <span style={{ fontSize: 13, color: 'var(--color-text)' }}>
            {behindCount > 0 && (
              <strong style={{ color: '#c0392b' }}>
                {behindCount} advisor{behindCount > 1 ? 's' : ''} behind target
              </strong>
            )}
            {behindCount > 0 && warningCount > 0 && ' · '}
            {warningCount > 0 && <span style={{ color: '#e67e22' }}>{warningCount} off pace</span>}
          </span>
        </div>
      )}

      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 0.9fr 0.7fr 1fr 1fr 0.6fr 0.7fr 0.8fr 1.1fr',
          gap: 12,
          padding: '12px 20px',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-secondary)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
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
          <div
            key={advisor.deal_id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 0.9fr 0.7fr 1fr 1fr 0.6fr 0.7fr 0.8fr 1.1fr',
              gap: 12,
              padding: '16px 20px',
              alignItems: 'center',
              background: 'var(--color-surface)',
              border: `1px solid ${pace.status === 'behind' ? 'rgba(192,57,43,0.2)' : 'var(--color-border)'}`,
              borderRadius: 8,
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#3B5A69';
              e.currentTarget.style.background = 'rgba(78,112,130,0.04)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor =
                pace.status === 'behind' ? 'rgba(192,57,43,0.2)' : 'var(--color-border)';
              e.currentTarget.style.background = 'var(--color-surface)';
            }}
          >
            {/* Advisor Name */}
            <Link
              href={`/command-center/advisor/${advisor.deal_id}`}
              style={{ textDecoration: 'none' }}
            >
              <div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontVariantNumeric: 'tabular-nums',
                    cursor: 'pointer',
                  }}
                >
                  {advisor.advisor_name}
                </p>
                {advisor.households && (
                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--color-text-secondary)',
                      marginTop: 2,
                    }}
                  >
                    {advisor.households} household{advisor.households !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </Link>

            {/* Prior Firm */}
            <p style={{ fontSize: 13, color: 'var(--color-text)' }}>{advisor.prior_firm || '—'}</p>

            {/* Transition Type */}
            <div>
              {advisor.transition_type ? (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    background: 'rgba(78,112,130,0.08)',
                    color: '#3B5A69',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {advisor.transition_type}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-secondary)',
                    fontStyle: 'italic',
                  }}
                >
                  —
                </span>
              )}
            </div>

            {/* Expected AUM */}
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-text)',
                textAlign: 'right',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatAUM(advisor.expected_aum)}
            </p>

            {/* Transfer Progress Bar */}
            <AumProgressBar expected={advisor.expected_aum} actual={advisor.actual_aum} />

            {/* Days Since Launch */}
            <p
              style={{
                fontSize: 13,
                color: 'var(--color-text-secondary)',
                textAlign: 'center',
              }}
            >
              {advisor.days_since_launch !== null ? (
                <span>
                  {advisor.days_since_launch}
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--color-text-secondary)',
                      marginLeft: 2,
                    }}
                  >
                    d
                  </span>
                </span>
              ) : (
                '—'
              )}
            </p>

            {/* Fee Rate BPS */}
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-text)',
                textAlign: 'right',
              }}
            >
              {advisor.fee_rate_bps != null ? `${advisor.fee_rate_bps}` : '—'}
              {advisor.fee_rate_bps != null && (
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--color-text-secondary)',
                    marginLeft: 2,
                  }}
                >
                  bps
                </span>
              )}
            </p>

            {/* Current Revenue */}
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: advisor.current_revenue
                  ? THEME.colors.success
                  : 'var(--color-text-secondary)',
                textAlign: 'right',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {advisor.current_revenue ? formatAUM(advisor.current_revenue) : '—'}
            </p>

            {/* Pace Status Badge + Tooltip */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: paceStyle.bg,
                  color: paceStyle.color,
                }}
              >
                <span style={{ fontSize: 10 }}>{paceStyle.icon}</span>
                {pace.label}
              </span>
              {pace.detail && pace.status !== 'unknown' && (
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--color-text-secondary)',
                    paddingLeft: 2,
                    lineHeight: 1.3,
                  }}
                >
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
