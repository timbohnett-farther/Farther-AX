import React, { useState } from 'react';
import { Card, Title, Text } from '@tremor/react';

export type TimePeriod = 'MTD' | 'QTD' | 'YTD' | '1Y' | 'ALL';

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode | ((period: TimePeriod) => React.ReactNode);
  className?: string;
  action?: React.ReactNode;
  timePeriods?: TimePeriod[];
  defaultPeriod?: TimePeriod;
  onPeriodChange?: (period: TimePeriod) => void;
  metric?: string;
  metricDelta?: string;
  metricDeltaType?: 'positive' | 'negative' | 'neutral';
}

/**
 * ChartContainer - Premium chart wrapper with frosted glass effect
 *
 * Now supports:
 * - Time period selectors (Bloomberg-style)
 * - Hero metric display above chart
 * - Delta/trend indicators
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  className = '',
  action,
  timePeriods,
  defaultPeriod = 'YTD',
  onPeriodChange,
  metric,
  metricDelta,
  metricDeltaType = 'neutral',
}) => {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>(defaultPeriod);

  const handlePeriodChange = (period: TimePeriod) => {
    setActivePeriod(period);
    onPeriodChange?.(period);
  };

  const deltaColorClass = metricDeltaType === 'positive'
    ? 'text-emerald-600'
    : metricDeltaType === 'negative'
    ? 'text-red-500'
    : 'text-slate';

  return (
    <Card className={`chart-card chart-glow ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <Title className="text-xl font-serif text-gray-900">{title}</Title>
          {subtitle && (
            <Text className="mt-1 text-sm text-gray-600">{subtitle}</Text>
          )}
        </div>
        <div className="flex items-center gap-3">
          {timePeriods && timePeriods.length > 0 && (
            <div className="time-selector">
              {timePeriods.map(period => (
                <button
                  key={period}
                  className={activePeriod === period ? 'active' : ''}
                  onClick={() => handlePeriodChange(period)}
                >
                  {period}
                </button>
              ))}
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      </div>
      {metric && (
        <div className="mt-3 mb-4 flex items-baseline gap-3">
          <span className="metric-hero text-4xl">{metric}</span>
          {metricDelta && (
            <span className={`text-sm font-semibold ${deltaColorClass}`}>
              {metricDelta}
            </span>
          )}
        </div>
      )}
      <div className="mt-4">
        {typeof children === 'function' ? children(activePeriod) : children}
      </div>
    </Card>
  );
};

export default ChartContainer;
