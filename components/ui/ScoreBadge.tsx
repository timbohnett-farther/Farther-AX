import React from 'react';
import { Badge, Color } from '@tremor/react';

export interface ScoreBadgeProps {
  score: number;
  maxScore?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * ScoreBadge - Score visualization with color coding
 *
 * Used for complexity scores, health scores, and risk ratings
 */
export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  maxScore = 100,
  label,
  showValue = true,
  size = 'md',
  className = '',
}) => {
  const getScoreColor = (score: number, max: number): Color => {
    const percentage = (score / max) * 100;
    if (percentage >= 85) return 'emerald';
    if (percentage >= 70) return 'blue';
    if (percentage >= 55) return 'amber';
    if (percentage >= 35) return 'orange';
    return 'red';
  };

  const getScoreLabel = (score: number, max: number): string => {
    const percentage = (score / max) * 100;
    if (percentage >= 85) return 'Excellent';
    if (percentage >= 70) return 'Good';
    if (percentage >= 55) return 'Fair';
    if (percentage >= 35) return 'At Risk';
    return 'Critical';
  };

  const color = getScoreColor(score, maxScore);
  const displayLabel = label || getScoreLabel(score, maxScore);
  const displayText = showValue ? `${displayLabel} (${score})` : displayLabel;

  return (
    <Badge
      color={color}
      size={size}
      className={`font-semibold ${className}`}
    >
      {displayText}
    </Badge>
  );
};

export default ScoreBadge;
