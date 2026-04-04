'use client';

import { useTheme } from '@/lib/theme-provider';
import { Deal } from './types';

interface LaunchTimerProps {
  deal: Deal;
}

export function LaunchTimer({ deal }: LaunchTimerProps) {
  const { THEME } = useTheme();
  const isOfferAccepted = deal.dealstage === '2496936';
  const isLaunched = deal.dealstage === '100411705';

  if (!isOfferAccepted && !isLaunched) return <span style={{ color: THEME.colors.textSecondary }}>—</span>;

  const launchDateStr = deal.actual_launch_date || deal.desired_start_date;
  if (!launchDateStr) return <span style={{ color: THEME.colors.textSecondary, fontSize: 12 }}>No date set</span>;

  const launchDate = new Date(launchDateStr);
  const now = new Date();
  const diffMs = now.getTime() - launchDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Step 6: Countdown to launch
  if (isOfferAccepted) {
    const daysUntilLaunch = -diffDays;
    if (daysUntilLaunch < 0) {
      // Past target date but still in Step 6
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.error }}>
            {Math.abs(daysUntilLaunch)}d overdue
          </span>
          <span style={{ fontSize: 10, color: THEME.colors.textSecondary }}>
            Target: {launchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      );
    }
    const urgencyColor = daysUntilLaunch <= 7 ? THEME.colors.error : daysUntilLaunch <= 30 ? THEME.colors.warning : THEME.colors.teal;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: urgencyColor }}>
          T-{daysUntilLaunch}d
        </span>
        <span style={{ fontSize: 10, color: THEME.colors.textSecondary }}>
          {launchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    );
  }

  // Step 7: Days since launch + graduation tracker
  const daysSinceLaunch = diffDays;

  // Graduation milestones
  let milestone = '';
  let milestoneColor = THEME.colors.textSecondary;
  let progressPct = 0;

  if (daysSinceLaunch >= 45) {
    milestone = 'Graduated';
    milestoneColor = THEME.colors.success;
    progressPct = 100;
  } else if (daysSinceLaunch >= 30) {
    milestone = '90% assets target';
    milestoneColor = THEME.colors.teal;
    progressPct = Math.round((daysSinceLaunch / 45) * 100);
  } else if (daysSinceLaunch >= 0) {
    milestone = '70% assets by Day 30';
    milestoneColor = THEME.colors.warning;
    progressPct = Math.round((daysSinceLaunch / 45) * 100);
  } else {
    // Future launch date
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.teal }}>T-{Math.abs(daysSinceLaunch)}d</span>
        <span style={{ fontSize: 10, color: THEME.colors.textSecondary }}>Pre-launch</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 120 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: milestoneColor }}>
          Day {daysSinceLaunch}
        </span>
        <span style={{ fontSize: 10, color: THEME.colors.textSecondary }}>/ 45</span>
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
