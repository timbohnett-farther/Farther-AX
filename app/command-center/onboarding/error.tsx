'use client';

import { useEffect } from 'react';

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[onboarding] Page error:', error);
  }, [error]);

  return (
    <div className="px-10 py-16 text-center">
      <h2 className="text-2xl font-bold mb-4 text-red-500">Onboarding Error</h2>
      <p className="text-sm text-gray-500 mb-2">
        {error.message || 'Something went wrong loading the onboarding page.'}
      </p>
      <p className="text-xs text-gray-400 mb-6 font-mono">
        {error.digest || ''}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
      >
        Try Again
      </button>
    </div>
  );
}
