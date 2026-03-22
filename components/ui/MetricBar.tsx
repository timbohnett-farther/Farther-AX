import React from 'react';
import { BarList, Card, Title, Text, Color } from '@tremor/react';

export interface MetricBarData {
  name: string;
  value: number;
  color?: Color;
  href?: string;
}

export interface MetricBarProps {
  title?: string;
  subtitle?: string;
  data: MetricBarData[];
  valueFormatter?: (value: number) => string;
  showAnimation?: boolean;
  className?: string;
}

/**
 * MetricBar - Horizontal bar chart for team workload and capacity
 *
 * Replaces custom HorizontalBar component with Tremor BarList
 */
export const MetricBar: React.FC<MetricBarProps> = ({
  title,
  subtitle,
  data,
  valueFormatter,
  showAnimation = true,
  className = '',
}) => {
  return (
    <Card className={`glass-card ${className}`}>
      {title && (
        <div className="mb-4">
          <Title className="text-lg font-serif text-cream">{title}</Title>
          {subtitle && (
            <Text className="mt-1 text-sm text-slate">{subtitle}</Text>
          )}
        </div>
      )}
      <BarList
        data={data}
        valueFormatter={valueFormatter}
        showAnimation={showAnimation}
        className="mt-2"
      />
    </Card>
  );
};

export default MetricBar;
