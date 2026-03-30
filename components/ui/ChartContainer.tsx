'use client';

import React from 'react';
import { Card, Title, Text } from '@tremor/react';
import { useTheme } from '@/lib/theme-provider';

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

/**
 * ChartContainer - Premium chart wrapper
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
  const { STYLES, THEME } = useTheme();

  return (
    <Card className={className} style={{ ...STYLES.card, padding: '24px' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title style={{ ...STYLES.heading, fontSize: '20px', color: THEME.colors.textHeading }}>
            {title}
          </Title>
          {subtitle && (
            <Text className="mt-1 text-sm" style={{ color: THEME.colors.textSecondary }}>
              {subtitle}
            </Text>
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
