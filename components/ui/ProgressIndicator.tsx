import React from 'react';
import { ProgressBar, Text, Flex } from '@tremor/react';

export interface ProgressIndicatorProps {
  label: string;
  value: number;
  maxValue?: number;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'teal';
  showPercentage?: boolean;
  markers?: Array<{ value: number; label: string }>;
  className?: string;
}

/**
 * ProgressIndicator - Progress bar with markers for launch timers
 *
 * Used for AUM progress tracking, launch countdowns, and goal tracking
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  label,
  value,
  maxValue = 100,
  color = 'teal',
  showPercentage = true,
  markers,
  className = '',
}) => {
  const percentage = Math.min(100, (value / maxValue) * 100);

  return (
    <div className={`space-y-2 ${className}`}>
      <Flex justifyContent="between" alignItems="center">
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
        {showPercentage && (
          <Text className="text-sm font-semibold text-gray-900">
            {percentage.toFixed(0)}%
          </Text>
        )}
      </Flex>
      <ProgressBar value={percentage} color={color} className="mt-2" />
      {markers && markers.length > 0 && (
        <div className="relative h-6 mt-1">
          {markers.map((marker, idx) => {
            const position = (marker.value / maxValue) * 100;
            return (
              <div
                key={idx}
                className="absolute"
                style={{ left: `${position}%` }}
              >
                <div className="w-0.5 h-2 bg-gray-400 -translate-x-1/2" />
                <Text className="text-xs text-gray-500 -translate-x-1/2 whitespace-nowrap">
                  {marker.label}
                </Text>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
