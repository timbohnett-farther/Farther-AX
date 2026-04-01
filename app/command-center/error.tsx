'use client';

import { useEffect } from 'react';

export default function CommandCenterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[command-center] Page error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', padding: 40, textAlign: 'center',
    }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#333' }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: 14, color: '#5B6A71', marginBottom: 24, maxWidth: 400 }}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 24px', fontSize: 14, fontWeight: 600, borderRadius: 8,
          background: '#3B5A69', color: '#F8F4F0', border: 'none', cursor: 'pointer',
        }}
      >
        Try Again
      </button>
    </div>
  );
}
