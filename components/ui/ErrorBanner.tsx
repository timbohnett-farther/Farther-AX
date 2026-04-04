'use client';

import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorBannerProps {
  /** Section name to display (e.g., "Pipeline", "Sentiment Scores") */
  section: string;
  /** SWR mutate function to retry */
  onRetry?: () => void;
  /** Optional error message detail */
  message?: string;
  /** Additional className */
  className?: string;
}

export function ErrorBanner({ section, onRetry, message, className = '' }: ErrorBannerProps) {
  return (
    <div className={`rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            Unable to load {section}
          </p>
          {message && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 truncate">
              {message}
            </p>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
