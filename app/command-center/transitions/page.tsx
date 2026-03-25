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
  dark: '#FFFEF4', white: '#1a1a1a', slate: 'rgba(212,223,229,0.5)',
  teal: '#4E7082', bg: '#111111',
  cardBg: '#171f27', border: 'rgba(212,223,229,0.08)',
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
  const [syncProgress, setSyncProgress] = useState<{
    totalWorkbooks: number;
    completedWorkbooks: number;
    currentWorkbook: string | null;
  } | null>(null);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [sheetId, setSheetId] = useState('');
  const [docusignLoading, setDocusignLoading] = useState(false);
  const [docusignConnected, setDocusignConnected] = useState(false);
  const [docusignError, setDocusignError] = useState<string | null>(null);
  const [autoSyncChecked, setAutoSyncChecked] = useState(false);

  // Team mappings state
  const [syncingTeamMappings, setSyncingTeamMappings] = useState(false);
  const [teamMappingsResult, setTeamMappingsResult] = useState<string | null>(null);

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

  // ── Auto-sync if data is stale (> 2 hours) ────────────────────────────────
  useEffect(() => {
    if (!data || autoSyncChecked) return;
    setAutoSyncChecked(true);
    const lastSynced = data.lastSyncedAt ? new Date(data.lastSyncedAt).getTime() : 0;
    const ageMs = Date.now() - lastSynced;
    if (ageMs > 2 * 60 * 60 * 1000) {  // 2 hours
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
    setSyncProgress(null);
    try {
      const body = sheetId.trim() ? { sheetId: sheetId.trim() } : {};

      // Show initial progress
      setSyncProgress({
        totalWorkbooks: 0,
        completedWorkbooks: 0,
        currentWorkbook: 'Preparing sync...',
      });

      const res = await fetch('/api/command-center/transitions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();

      if (res.ok && result.summary) {
        // Show completion progress
        setSyncProgress({
          totalWorkbooks: result.summary.total_workbooks || 0,
          completedWorkbooks: result.summary.total_workbooks || 0,
          currentWorkbook: 'Complete',
        });

        setSyncResult(
          `✓ Synced ${result.summary.total_synced} rows from ${result.summary.total_workbooks} workbook${result.summary.total_workbooks !== 1 ? 's' : ''}` +
          (result.summary.errors > 0 ? ` (${result.summary.errors} error${result.summary.errors !== 1 ? 's' : ''})` : '')
        );
        mutate();
      } else {
        setSyncResult(`Error: ${result.error ?? 'Unknown'}`);
        setSyncProgress(null);
      }
    } catch (e) {
      setSyncResult(`Sync failed: ${e instanceof Error ? e.message : String(e)}`);
      setSyncProgress(null);
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

  // ── Team Mappings Sync ────────────────────────────────────────────────────
  async function handleSyncTeamMappings() {
    setSyncingTeamMappings(true);
    setTeamMappingsResult(null);
    try {
      const res = await fetch('/api/command-center/transitions/team-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setTeamMappingsResult(
          `✓ ${result.message}` ||
          `✓ Synced ${result.totalMappings} team mappings (${result.inserted} new, ${result.updated} updated)`
        );
      } else {
        setTeamMappingsResult(`Error: ${result.error ?? 'Unknown'}`);
      }
    } catch (e) {
      setTeamMappingsResult(`Sync failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSyncingTeamMappings(false);
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
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button onClick={() => setShowSyncPanel(!showSyncPanel)} style={{
          padding: '7px 14px', borderRadius: 6, border: 'none', background: C.teal,
          color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>
          &darr; Sync from Sheet
        </button>
        <button onClick={handleSyncTeamMappings} disabled={syncingTeamMappings} style={{
          padding: '7px 14px', borderRadius: 6, border: `1px solid ${C.border}`,
          background: syncingTeamMappings ? C.cardBg : 'transparent',
          color: syncingTeamMappings ? C.slate : C.dark, fontSize: 12, fontWeight: 600,
          cursor: syncingTeamMappings ? 'not-allowed' : 'pointer',
        }}>
          {syncingTeamMappings ? 'Syncing...' : '\u2728 Sync Team Mappings'}
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

          {/* Progress Bar */}
          {syncProgress && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.slate, fontWeight: 500 }}>
                  {syncProgress.currentWorkbook}
                </span>
                <span style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>
                  {syncProgress.totalWorkbooks > 0
                    ? `${syncProgress.completedWorkbooks}/${syncProgress.totalWorkbooks} (${Math.round((syncProgress.completedWorkbooks / syncProgress.totalWorkbooks) * 100)}%)`
                    : 'Preparing...'
                  }
                </span>
              </div>
              <div style={{
                width: '100%',
                height: 8,
                background: C.border,
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  height: '100%',
                  width: syncProgress.totalWorkbooks > 0
                    ? `${(syncProgress.completedWorkbooks / syncProgress.totalWorkbooks) * 100}%`
                    : '30%',
                  background: `linear-gradient(90deg, ${C.teal}, ${C.green})`,
                  borderRadius: 4,
                  transition: 'width 0.3s ease',
                  animation: syncProgress.totalWorkbooks === 0 ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }} />
              </div>
            </div>
          )}

          {syncResult && (
            <div style={{
              fontSize: 12, padding: '6px 10px', borderRadius: 6,
              background: syncResult.startsWith('Error') ? C.redBg : C.greenBg,
              color: syncResult.startsWith('Error') ? C.red : C.green,
            }}>{syncResult}</div>
          )}
        </div>
      )}

      {/* ── Team Mappings Result ──────────────────────────────────────────────── */}
      {teamMappingsResult && (
        <div style={{
          background: teamMappingsResult.startsWith('Error') ? C.redBg : C.greenBg,
          border: `1px solid ${teamMappingsResult.startsWith('Error') ? C.redBorder : C.greenBorder}`,
          borderRadius: 8, padding: '8px 14px', marginBottom: 12, fontSize: 13,
          color: teamMappingsResult.startsWith('Error') ? C.red : C.green,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          {teamMappingsResult}
          <button onClick={() => setTeamMappingsResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit' }}>&times;</button>
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
