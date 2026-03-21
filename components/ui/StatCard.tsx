import React from 'react';
import { Card, Metric, Text, Flex, BadgeDelta, DeltaType } from '@tremor/react';

export interface StatCardProps {
  title: string;
  value: string | number;
  delta?: string;
  deltaType?: DeltaType;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
  /** Mini sparkline chart rendered below the metric */
  sparkline?: React.ReactNode;
  /** Accent color variant */
  accent?: 'teal' | 'success' | 'warning' | 'danger';
  /** Show live status dot */
  live?: boolean;
}

/**
 * StatCard - Premium KPI metric card with glass morphism effect
 *
 * Enhanced with sparkline support and accent variants for
 * executive dashboard visualizations.
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  delta,
  deltaType = 'unchanged',
  icon,
  subtitle,
  className = '',
  onClick,
  sparkline,
  accent,
  live,
}) => {
  const accentBorder = accent === 'success' ? 'emerald'
    : accent === 'warning' ? 'amber'
    : accent === 'danger' ? 'red'
    : 'teal';

  return (
    <Card
      className={`stat-card ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      decoration="top"
      decorationColor={accentBorder as 'teal' | 'emerald' | 'amber' | 'red'}
    >
      <Flex justifyContent="between" alignItems="start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Text className="text-sm text-gray-600 font-medium truncate">{title}</Text>
            {live && (
              <span className="status-dot active bg-emerald-500 text-emerald-500" />
            )}
          </div>
          <Metric className="mt-2 text-3xl font-semibold text-gray-900">
            {value}
          </Metric>
          {subtitle && (
            <Text className="mt-1 text-xs text-gray-500">{subtitle}</Text>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-teal/10 rounded-lg flex-shrink-0">
            {icon}
          </div>
        )}
      </Flex>
      {sparkline && (
        <div className="sparkline-container mt-3 -mb-1">
          {sparkline}
        </div>
      )}
      {delta && (
        <Flex className="mt-4">
          <BadgeDelta deltaType={deltaType} size="sm">
            {delta}
          </BadgeDelta>
        </Flex>
      )}
    </Card>
  );
};

export default StatCard;
