'use client';

import { useTheme } from '@/lib/theme-provider';
import { STAGE_DESCRIPTIONS } from './constants';

interface StageBadgeProps {
  stageId: string;
  label: string;
  isTerminal?: boolean;
}

export function StageBadge({ stageId, label, isTerminal }: StageBadgeProps) {
  const { THEME } = useTheme();
  const isLaunched = stageId === '100411705';
  const isOfferAccepted = stageId === '2496936';
  const isClosedWon = label?.toLowerCase().includes('closed won') || label?.toLowerCase().includes('closedwon');
  const description = STAGE_DESCRIPTIONS[stageId];

  let bg = 'rgba(91,106,113,0.18)';
  let color = THEME.colors.text;
  let borderColor = 'rgba(91,106,113,0.25)';

  if (isClosedWon) {
    // Closed Won = SUCCESS = GREEN
    bg = 'rgba(16,185,129,0.2)'; color = '#10b981'; borderColor = 'rgba(16,185,129,0.4)';
  } else if (isTerminal) {
    // Terminal = FAILED = RED
    bg = 'rgba(239,68,68,0.2)'; color = '#f87171'; borderColor = 'rgba(239,68,68,0.4)';
  } else if (isLaunched) {
    bg = 'rgba(29,118,130,0.2)'; color = '#5ec4cf'; borderColor = 'rgba(29,118,130,0.35)';
  } else if (isOfferAccepted) {
    bg = 'rgba(245,158,11,0.2)'; color = '#fbbf24'; borderColor = 'rgba(245,158,11,0.35)';
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
