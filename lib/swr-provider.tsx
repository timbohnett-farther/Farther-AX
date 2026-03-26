'use client';

import { SWRConfig } from 'swr';
import { useEffect, useRef } from 'react';
import { mutate } from 'swr';

// ── Persistent SWR Cache via localStorage ────────────────────────────────────
// SWR's in-memory cache is lost on tab close. This provider persists it to
// localStorage so returning users see instant cached data while SWR revalidates
// in the background (stale-while-revalidate pattern).

const SWR_CACHE_KEY = 'farther-ax-swr-cache';
const MAX_CACHE_SIZE = 4 * 1024 * 1024; // 4MB limit (localStorage is typically 5MB)

function localStorageProvider() {
  // Load persisted cache on startup
  let initialData: [string, any][] = [];
  try {
    const raw = localStorage.getItem(SWR_CACHE_KEY);
    if (raw) {
      initialData = JSON.parse(raw);
    }
  } catch {
    // Corrupted cache — start fresh
    localStorage.removeItem(SWR_CACHE_KEY);
  }

  const map = new Map<string, any>(initialData);

  // Persist cache to localStorage before tab close
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      try {
        const entries = Array.from(map.entries());
        const serialized = JSON.stringify(entries);
        if (serialized.length <= MAX_CACHE_SIZE) {
          localStorage.setItem(SWR_CACHE_KEY, serialized);
        } else {
          // If over limit, keep only the most recent half of entries
          const half = entries.slice(Math.floor(entries.length / 2));
          localStorage.setItem(SWR_CACHE_KEY, JSON.stringify(half));
        }
      } catch {
        // localStorage full or unavailable — silently skip
      }
    });
  }

  return map;
}

// ── Global fetcher with error handling ───────────────────────────────────────

const globalFetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`API error: ${r.status}`);
    return r.json();
  });

// ── Background Prefetcher ────────────────────────────────────────────────────
// On app entry, prefetch all critical endpoints so data is ready before the
// user navigates to any page. SWR's deduplication prevents duplicate fetches.

const CRITICAL_ENDPOINTS = [
  '/api/command-center/pipeline',
  '/api/command-center/aum-tracker',
  '/api/command-center/sentiment/scores',
  '/api/command-center/alerts',
  '/api/command-center/team',
  '/api/command-center/metrics',
  '/api/command-center/complexity/scores',
];

function Prefetcher() {
  const hasPrefetched = useRef(false);

  useEffect(() => {
    if (hasPrefetched.current) return;
    hasPrefetched.current = true;

    // Fire all critical fetches in parallel on app entry.
    // mutate() populates the global SWR cache so any page that uses
    // useSWR(key) will find data already available.
    CRITICAL_ENDPOINTS.forEach(url => {
      mutate(url, globalFetcher(url), { revalidate: false });
    });
  }, []);

  return null;
}

// ── SWR Provider Component ───────────────────────────────────────────────────

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: typeof window !== 'undefined' ? localStorageProvider : undefined,
        fetcher: globalFetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 3600000, // 1 hour — prevent duplicate calls across pages
        keepPreviousData: true,
        errorRetryCount: 2,
      }}
    >
      <Prefetcher />
      {children}
    </SWRConfig>
  );
}
