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
}

/**
 * StatCard - Premium KPI metric card with glass morphism effect
 *
 * Replaces custom SummaryCard patterns with Tremor-based component
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
}) => {
  return (
    <Card
      className={`stat-card cursor-pointer ${className}`}
      onClick={onClick}
      decoration="top"
      decorationColor="teal"
    >
      <Flex justifyContent="between" alignItems="start">
        <div>
          <Text className="text-sm text-gray-600 font-medium">{title}</Text>
          <Metric className="mt-2 text-3xl font-semibold text-gray-900">
            {value}
          </Metric>
          {subtitle && (
            <Text className="mt-1 text-xs text-gray-500">{subtitle}</Text>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-teal/10 rounded-lg">
            {icon}
          </div>
        )}
      </Flex>
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
