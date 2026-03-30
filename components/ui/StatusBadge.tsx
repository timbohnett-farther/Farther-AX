'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-provider';

export type StatusType =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'pending'
  | 'active'
  | 'inactive';

export interface StatusBadgeProps {
  status: StatusType | string;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * StatusBadge - Modern status indicator using inline styles
 *
 * Replaces custom status pills and DocuSign status badges
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  size = 'md',
  className = '',
}) => {
  const { STYLES, THEME } = useTheme();

  const getStatusColors = (status: string): { text: string; bg: string } => {
    const statusMap: Record<string, { text: string; bg: string }> = {
      success: { text: THEME.colors.success, bg: THEME.colors.successBg },
      warning: { text: THEME.colors.warning, bg: THEME.colors.warningBg },
      danger: { text: THEME.colors.error, bg: THEME.colors.errorBg },
      error: { text: THEME.colors.error, bg: THEME.colors.errorBg },
      info: { text: THEME.colors.info, bg: THEME.colors.infoBg },
      pending: { text: THEME.colors.warning, bg: THEME.colors.warningBg },
      active: { text: THEME.colors.success, bg: THEME.colors.successBg },
      inactive: { text: THEME.colors.neutral, bg: THEME.colors.neutralBg },
      completed: { text: THEME.colors.success, bg: THEME.colors.successBg },
      'in-progress': { text: THEME.colors.info, bg: THEME.colors.infoBg },
      'not-started': { text: THEME.colors.neutral, bg: THEME.colors.neutralBg },
    };
    return statusMap[status.toLowerCase()] || { text: THEME.colors.neutral, bg: THEME.colors.neutralBg };
  };

  const colors = getStatusColors(status);
  const displayText = text || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={className} style={STYLES.badge(colors.text, colors.bg)}>
      {displayText}
    </span>
  );
};

export default StatusBadge;
