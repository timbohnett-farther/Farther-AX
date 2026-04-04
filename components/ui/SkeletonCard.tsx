'use client';

interface SkeletonCardProps {
  /** Height in Tailwind units (e.g., 'h-24', 'h-48') */
  height?: string;
  /** Number of skeleton lines inside the card */
  lines?: number;
  /** Additional className */
  className?: string;
}

export function SkeletonCard({ height = 'h-24', lines = 3, className = '' }: SkeletonCardProps) {
  return (
    <div className={`animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-4 ${height} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`rounded bg-gray-200 dark:bg-gray-700 ${
            i === 0 ? 'h-4 w-3/4 mb-3' : i === lines - 1 ? 'h-3 w-1/2 mt-2' : 'h-3 w-full mb-2'
          }`}
        />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4, height = 'h-24' }: { count?: number; height?: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={height} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      ))}
    </div>
  );
}
