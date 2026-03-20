import React from 'react';
import { Card, Title, Text } from '@tremor/react';

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

/**
 * ChartContainer - Premium chart wrapper with frosted glass effect
 *
 * Wraps Tremor charts with consistent styling and headers
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  className = '',
  action,
}) => {
  return (
    <Card className={`chart-card chart-glow ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title className="text-xl font-serif text-gray-900">{title}</Title>
          {subtitle && (
            <Text className="mt-1 text-sm text-gray-600">{subtitle}</Text>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="mt-4">
        {children}
      </div>
    </Card>
  );
};

export default ChartContainer;
