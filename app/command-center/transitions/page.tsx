'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import { FilterPanel } from '@/components/transitions/FilterPanel';
import { StatsCards } from '@/components/transitions/StatsCards';
import { AccountsTable } from '@/components/transitions/AccountsTable';
import { ExecutiveSummary } from '@/components/transitions/ExecutiveSummary';
import { DocuSignDashboard } from '@/components/transitions/DocuSignDashboard';
import { ChangeLogPanel } from '@/components/transitions/ChangeLogPanel';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  dark: '#FAF7F2', white: '#1a1a1a', slate: 'rgba(250,247,242,0.5)',
  teal: '#2bb8c4', bg: '#111111',
  cardBg: '#2f2f2f', border: 'rgba(250,247,242,0.08)',
  green: '#4ade80', greenBg: 'rgba(74,222,128,0.2)',
  amber: '#fbbf24', amberBg: 'rgba(251,191,36,0.2)', amberBorder: 'rgba(251,191,36,0.35)',
  red: '#f87171', redBg: 'rgba(248,113,113,0.2)', redBorder: 'rgba(248,113,113,0.35)',
  purple: '#a78bfa', purpleBg: 'rgba(167,139,250,0.15)', purpleBorder: 'rgba(167,139,250,0.35)',
  greenBorder: 'rgba(74,222,128,0.35)',
};

type TabKey = 'accounts' | 'docusign' | 'summary' | 'changelog';

const TABS: { key: TabKey; label: string; sub: string }[] = [
  { key: 'accounts', label: 'Account View', sub: 'Filtered Accounts' },
  { key: 'docusign', label: 'DocuSign Dashboard', sub: 'Household Progress' },
  { key: 'summary', label: 'Executive Summary', sub: 'By Advisor' },
  { key: 'changelog', label: 'Change Log', sub: 'Audit Trail' },
];

interface Filters {
  advisor: string;
  iaa_status: string;
  pw_status: string;
  portal_status: string;
  household: string;
}

const EMPTY_FILTERS: Filters = { advisor: '', iaa_status: '', pw_status: '', portal_status: '', household: '' };

function TransitionsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read state from URL
  const activeTab = (searchParams.get('tab') as TabKey) || 'accounts';
  const page = parseInt(searchParams.get('page') ?? '1');
  const filters: Filters = {
    advisor: searchParams.get('advisor') ?? '',
    iaa_status: searchParams.get('iaa_status') ?? '',
    pw_status: searchParams.get('pw_status') ?? '',
    portal_status: searchParams.get('portal_status') ?? '',
    household: searchParams.get('household') ?? '',
  };

  // Sync + DocuSign state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [sheetId, setSheetId] = useState('');
  const [docusignLoading, setDocusignLoading] = useState(false);
  const [docusignConnected, setDocusignConnected] = useState(false);
  const [docusignError, setDocusignError] = useState<string | null>(null);
  const [autoSyncChecked, setAutoSyncChecked] = useState(false);

  // ── URL update helper ──────────────────────────────────────────────────────
  const updateUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/command-center/transitions?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const handleFilterChange = useCallback((updates: Partial<Filters>) => {
    const newFilters = { ...filters, ...updates };
    updateUrl({ ...newFilters, page: '1' });
  }, [filters, updateUrl]);

  const handleFilterReset = useCallback(() => {
    updateUrl({ ...EMPTY_FILTERS, page: '' });
  }, [updateUrl]);

  const handleTabChange = useCallback((tab: TabKey) => {
    updateUrl({ tab });
  }, [updateUrl]);

  const handlePageChange = useCallback((p: number) => {
    updateUrl({ page: String(p) });
  }, [updateUrl]);

  // ── Build filter query params for API calls ───────────────────────────────
  const filterParams = new URLSearchParams();
  if (filters.advisor) filterParams.set('advisor', filters.advisor);
  if (filters.iaa_status) filterParams.set('iaa_status', filters.iaa_status);
  if (filters.pw_status) filterParams.set('pw_status', filters.pw_status);
  if (filters.portal_status) filterParams.set('portal_status', filters.portal_status);
  if (filters.household) filterParams.set('household', filters.household);
  const filterParamStr = filterParams.toString();

  // ── Fetch filtered transitions data ───────────────────────────────────────
  const apiUrl = `/api/command-center/transitions?${filterParamStr}&page=${page}&per_page=50`;
  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  // ── Auto-sync if data is stale (> 1 hour) ─────────────────────────────────
  useEffect(() => {
    if (!data || autoSyncChecked) return;
    setAutoSyncChecked(true);
    const lastSynced = data.lastSyncedAt ? new Date(data.lastSyncedAt).getTime() : 0;
    const ageMs = Date.now() - lastSynced;
    if (ageMs > 60 * 60 * 1000) {
      fetch('/api/command-center/transitions/sync').then(() => mutate()).catch(() => {});
    }
  }, [data, autoSyncChecked, mutate]);

  // ── DocuSign callback detection ──────────────────────────────────────────
  useEffect(() => {
    const ds = searchParams.get('docusign');
    if (ds === 'connected') {
      window.history.replaceState({}, '', '/command-center/transitions?tab=docusign');
      setDocusignConnected(true);
      handleDocuSignFetch();
    } else if (ds === 'error') {
      setDocusignError('DocuSign connection failed');
      window.history.replaceState({}, '', '/command-center/transitions');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync handler ──────────────────────────────────────────────────────────
  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const body = sheetId.trim() ? { sheetId: sheetId.trim() } : {};
      const res = await fetch('/api/command-center/transitions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (res.ok && result.summary) {
        setSyncResult(`Synced ${result.summary.total_synced} rows from ${result.summary.total_workbooks} workbooks`);
        mutate();
      } else {
        setSyncResult(`Error: ${result.error ?? 'Unknown'}`);
      }
    } catch (e) {
      setSyncResult(`Sync failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSyncing(false);
    }
  }

  // ── DocuSign fetch ────────────────────────────────────────────────────────
  async function handleDocuSignFetch() {
    setDocusignLoading(true);
    setDocusignError(null);
    try {
      const res = await fetch('/api/command-center/transitions/docusign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (result.error === 'not_authenticated' && result.authUrl) {
        window.location.href = result.authUrl;
        return;
      }
      if (!res.ok) {
        setDocusignError(result.error || 'Unknown error');
        return;
      }
      setDocusignConnected(true);
      mutate();
    } catch (e) {
      setDocusignError(e instanceof Error ? e.message : String(e));
    } finally {
      setDocusignLoading(false);
    }
  }

  // ── Last synced format ────────────────────────────────────────────────────
  function formatSyncAge(isoDate: string | null | undefined): string {
    if (!isoDate) return 'Never synced';
    const mins = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  const accounts = data?.accounts ?? data?.advisors?.flatMap((a: { accounts: unknown[] }) => a.accounts) ?? [];
  const total = data?.total ?? accounts.length;

  return (
    <div style={{ padding: '32px 40px', maxWidth: '100vw', overflow: 'hidden' }}>
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/command-center" style={{ fontSize: 13, color: C.slate, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          &larr; Back to Pipeline
        </Link>
        <div style={{ position: 'relative', margin: '8px 0 4px' }}>
          <Image src="/images/Farther_Symbol_RGB_Cream.svg" alt="" width={32} height={32} style={{ position: 'absolute', top: 0, right: 0, opacity: 0.5 }} />
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 6 }}>
              Client Transition Dashboard
            </h1>
            <p style={{ fontSize: 14, color: C.slate, margin: 0 }}>
              Last synced: {formatSyncAge(data?.lastSyncedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Controls Row ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'flex-end' }}>
        <button onClick={() => setShowSyncPanel(!showSyncPanel)} style={{
          padding: '7px 14px', borderRadius: 6, border: 'none', background: C.teal,
          color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>
          &darr; Sync from Sheet
        </button>
        <button onClick={handleDocuSignFetch} disabled={docusignLoading} style={{
          padding: '7px 14px', borderRadius: 6, border: `1px solid ${C.border}`,
          background: docusignLoading ? C.cardBg : 'transparent',
          color: docusignLoading ? C.slate : C.dark, fontSize: 12, fontWeight: 600,
          cursor: docusignLoading ? 'not-allowed' : 'pointer',
        }}>
          {docusignLoading ? 'Loading...' : docusignConnected ? '\u2713 DocuSign Connected' : '\u270E DocuSign Status'}
        </button>
      </div>

      {/* ── Sync Panel ────────────────────────────────────────────────────────── */}
      {showSyncPanel && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <button onClick={() => { setSheetId(''); handleSync(); }} disabled={syncing} style={{
              padding: '8px 16px', borderRadius: 6, border: 'none', background: syncing ? C.slate : C.teal,
              color: '#fff', fontSize: 12, fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer',
            }}>
              {syncing ? 'Syncing...' : 'Sync All Folders'}
            </button>
            <input type="text" placeholder="Or enter Sheet ID..." value={sheetId} onChange={e => setSheetId(e.target.value)} style={{
              flex: 1, padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`,
              fontSize: 12, background: C.white, color: C.dark, outline: 'none',
            }} />
            <button onClick={handleSync} disabled={syncing || !sheetId.trim()} style={{
              padding: '8px 16px', borderRadius: 6, border: `1px solid ${C.border}`,
              background: 'transparent', color: C.dark, fontSize: 12, fontWeight: 600,
              cursor: syncing || !sheetId.trim() ? 'not-allowed' : 'pointer',
              opacity: syncing || !sheetId.trim() ? 0.4 : 1,
            }}>
              Sync Sheet
            </button>
          </div>
          {syncResult && (
            <div style={{
              fontSize: 12, padding: '6px 10px', borderRadius: 6,
              background: syncResult.startsWith('Error') ? C.redBg : C.greenBg,
              color: syncResult.startsWith('Error') ? C.red : C.green,
            }}>{syncResult}</div>
          )}
        </div>
      )}

      {/* ── DocuSign Error ────────────────────────────────────────────────────── */}
      {docusignError && (
        <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: '8px 14px', marginBottom: 12, fontSize: 13, color: C.red, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          DocuSign Error: {docusignError}
          <button onClick={() => setDocusignError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit' }}>&times;</button>
        </div>
      )}

      {/* ── Tab Bar ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${C.border}`, marginBottom: 20 }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding: '10px 20px', background: 'none', border: 'none',
                borderBottom: `2px solid ${isActive ? C.teal : 'transparent'}`,
                marginBottom: -2, cursor: 'pointer', transition: 'all 150ms ease',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? C.teal : C.slate, fontFamily: "'Fakt', system-ui, sans-serif" }}>
                {tab.label}
              </span>
              <span style={{ display: 'block', fontSize: 11, color: isActive ? C.teal : C.slate, opacity: 0.6, marginTop: 2 }}>
                {tab.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────────── */}
      {activeTab === 'accounts' && (
        <>
          {/* Stats Cards */}
          <StatsCards filterParams={filterParamStr} />

          {/* Filter Panel */}
          <FilterPanel filters={filters} onChange={handleFilterChange} onReset={handleFilterReset} />

          {/* Loading */}
          {isLoading && !data && <div style={{ padding: 40, color: C.slate, textAlign: 'center' }}>Loading transition data...</div>}
          {error && <div style={{ padding: 40, color: C.red, textAlign: 'center' }}>Failed to load data.</div>}

          {/* Accounts Table */}
          {!isLoading || data ? (
            <AccountsTable
              accounts={accounts}
              total={total}
              page={page}
              perPage={50}
              onPageChange={handlePageChange}
              showAdvisorColumn={!filters.advisor}
            />
          ) : null}
        </>
      )}

      {activeTab === 'docusign' && (
        <DocuSignDashboard advisorFilter={filters.advisor || undefined} />
      )}

      {activeTab === 'summary' && (
        <ExecutiveSummary
          onAdvisorClick={(advisor) => {
            updateUrl({ tab: 'accounts', advisor, page: '1' });
          }}
        />
      )}

      {activeTab === 'changelog' && (
        <ChangeLogPanel />
      )}
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function TransitionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: 'rgba(250,247,242,0.5)' }}>Loading...</div>}>
      <TransitionsPageInner />
    </Suspense>
  );
}
