'use client';

import { ReactNode, useState } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

/**
 * Custom Tooltip component with proper light/dark mode support
 *
 * Replaces browser-native `title` attribute tooltips with a styled version
 * that respects the Farther brand color system.
 *
 * Light mode: Dark text on light background
 * Dark mode: Light text on dark background
 *
 * @example
 * <Tooltip content="This is helpful info">
 *   <button>Hover me</button>
 * </Tooltip>
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible && content && (
        <div
          className={`
            absolute z-50 ${positionClasses[position]}
            px-3 py-2 rounded-lg shadow-lg
            text-sm font-medium whitespace-nowrap
            pointer-events-none
            animate-fade-in

            /* Light mode: Dark text on light background */
            bg-white text-gray-900 border border-gray-200

            /* Dark mode: Light text on dark background */
            dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700
          `}
          style={{
            maxWidth: '320px',
            whiteSpace: 'normal',
            wordWrap: 'break-word'
          }}
        >
          {content}

          {/* Arrow */}
          <div
            className={`
              absolute ${arrowClasses[position]}
              w-0 h-0
              border-4

              /* Light mode arrow */
              border-white
              dark:border-gray-800
            `}
          />
        </div>
      )}
    </div>
  );
}
