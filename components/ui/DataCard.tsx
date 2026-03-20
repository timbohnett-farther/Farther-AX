import React from 'react';
import { Card, Title, Text } from '@tremor/react';

export interface DataCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  decoration?: 'top' | 'left' | 'bottom' | 'right';
  decorationColor?: string;
}

/**
 * DataCard - Generic section container with glass effect
 *
 * Replaces custom section divs with consistent Tremor Card styling
 */
export const DataCard: React.FC<DataCardProps> = ({
  title,
  subtitle,
  children,
  action,
  className = '',
  decoration,
  decorationColor,
}) => {
  return (
    <Card
      className={`glass-card ${className}`}
      decoration={decoration}
      decorationColor={decorationColor as "teal" | "blue" | "red" | "green" | "gray" | undefined}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <div>
              <Title className="text-lg font-serif text-gray-900">{title}</Title>
              {subtitle && (
                <Text className="mt-1 text-sm text-gray-600">{subtitle}</Text>
              )}
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div>
        {children}
      </div>
    </Card>
  );
};

export default DataCard;
