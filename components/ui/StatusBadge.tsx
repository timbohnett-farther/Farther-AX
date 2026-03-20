import React from 'react';
import { Badge, Color } from '@tremor/react';

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
 * StatusBadge - Modern status indicator using Tremor Badge
 *
 * Replaces custom status pills and DocuSign status badges
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  size = 'md',
  className = '',
}) => {
  const getStatusColor = (status: string): Color => {
    const statusMap: Record<string, Color> = {
      success: 'emerald',
      warning: 'amber',
      danger: 'red',
      error: 'red',
      info: 'blue',
      pending: 'yellow',
      active: 'green',
      inactive: 'gray',
      completed: 'emerald',
      'in-progress': 'blue',
      'not-started': 'gray',
    };
    return statusMap[status.toLowerCase()] || 'gray';
  };

  const displayText = text || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge
      color={getStatusColor(status)}
      size={size}
      className={`badge-glass ${className}`}
    >
      {displayText}
    </Badge>
  );
};

export default StatusBadge;
