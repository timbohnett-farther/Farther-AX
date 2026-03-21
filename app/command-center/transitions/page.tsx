'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Status class helper ─────────────────────────────────────────────────────
function statusClass(status: string | null): string {
  if (!status) return 'text-slate italic';
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'signed' || s === 'done') {
    return 'text-market-bull font-semibold';
  }
  if (s === 'sent' || s === 'delivered' || s === 'in progress') {
    return 'text-wealth-gold-dark font-medium';
  }
  if (s === 'not sent' || s === 'not ready' || s === 'declined' || s === 'voided') {
    return 'text-market-bear font-medium';
  }
  if (s === 'ready to send documents' || s === 'ready') {
    return 'font-medium text-blue-600';
  }
  return 'text-charcoal';
}

// ── DocuSign status pill ─────────────────────────────────────────────────────
function DocuSignPill({ status }: { status: string | null }) {
  if (!status) return <span className="text-slate text-xs">&mdash;</span>;
  const s = status.toLowerCase();
  let badgeClass = 'badge-glass badge-warning';
  if (s === 'completed' || s === 'signed') badgeClass = 'badge-glass badge-success';
  if (s === 'sent' || s === 'delivered') badgeClass = 'badge-glass text-blue-600 bg-blue-50 border-blue-200';
  if (s === 'voided' || s === 'declined') badgeClass = 'badge-glass badge-danger';
  return (
    <span className={`inline-block capitalize ${badgeClass}`}>
      {status}
    </span>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────
interface Account {
  id: number;
  household_name: string | null;
  account_type: string | null;
  account_name: string | null;
  status_of_iaa: string | null;
  status_of_account_paperwork: string | null;
  portal_status: string | null;
  document_readiness: string | null;
  primary_first_name: string | null;
  primary_last_name: string | null;
  primary_email: string | null;
  new_account_number: string | null;
  contra_account_firm: string | null;
  contra_account_numbers: string | null;
  fee_schedule: string | null;
  notes: string | null;
  docusign_iaa_status: string | null;
  docusign_paperwork_status: string | null;
  billing_setup: string | null;
  welcome_gift_box: string | null;
  portal_invites: string | null;
}

interface AdvisorGroup {
  advisor_name: string;
  farther_contact: string | null;
  total_accounts: number;
  accounts: Account[];
}

interface TransitionsData {
  advisors: AdvisorGroup[];
  summary: {
    total_advisors: number;
    total_accounts: number;
    iaa_signed: number;
    paperwork_signed: number;
    pending_documents: number;
  };
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function TransitionsPage() {
  const { data, error, isLoading, mutate } = useSWR<TransitionsData>(
    '/api/command-center/transitions', fetcher
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAdvisor, setExpandedAdvisor] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState('');
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [docusignStatus, setDocusignStatus] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ── Filtered advisors ──────────────────────────────────────────────────────
  const filteredAdvisors = useMemo(() => {
    if (!data?.advisors) return [];
    let advisors = data.advisors;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      advisors = advisors.filter(a =>
        a.advisor_name.toLowerCase().includes(term) ||
        a.accounts.some(acc =>
          acc.household_name?.toLowerCase().includes(term) ||
          acc.primary_last_name?.toLowerCase().includes(term) ||
          acc.primary_email?.toLowerCase().includes(term) ||
          acc.account_name?.toLowerCase().includes(term)
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      advisors = advisors.map(a => {
        const filtered = a.accounts.filter(acc => {
          if (statusFilter === 'iaa_pending') return acc.status_of_iaa !== 'Completed' && acc.docusign_iaa_status?.toLowerCase() !== 'completed';
          if (statusFilter === 'paperwork_pending') return acc.status_of_account_paperwork !== 'Completed' && acc.docusign_paperwork_status?.toLowerCase() !== 'completed';
          if (statusFilter === 'completed') return (acc.status_of_iaa === 'Completed' || acc.docusign_iaa_status?.toLowerCase() === 'completed') && (acc.status_of_account_paperwork === 'Completed' || acc.docusign_paperwork_status?.toLowerCase() === 'completed');
          if (statusFilter === 'not_ready') return acc.document_readiness && acc.document_readiness !== 'Ready to Send Documents';
          return true;
        });
        return { ...a, accounts: filtered, total_accounts: filtered.length };
      }).filter(a => a.accounts.length > 0);
    }

    return advisors;
  }, [data, searchTerm, statusFilter]);

  // ── Google Sheets Sync ─────────────────────────────────────────────────────
  async function handleSync() {
    if (!sheetId.trim()) { setSyncResult('Please enter a Google Sheet ID'); return; }
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/command-center/transitions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: sheetId.trim() }),
      });
      const result = await res.json();
      if (res.ok) {
        setSyncResult(`Synced ${result.synced} of ${result.total} rows`);
        mutate();
      } else {
        setSyncResult(`Error: ${result.error}`);
      }
    } catch (e) {
      setSyncResult(`Sync failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSyncing(false);
    }
  }

  // ── DocuSign Connect ───────────────────────────────────────────────────────
  async function handleDocuSignConnect() {
    try {
      const res = await fetch('/api/command-center/transitions/docusign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (result.error === 'not_authenticated' && result.authUrl) {
        window.location.href = result.authUrl;
      } else if (res.ok) {
        setDocusignStatus('Connected — ' + (result.totalSetSize ?? 0) + ' envelopes found');
      }
    } catch (e) {
      setDocusignStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // ── Check URL params for DocuSign callback ────────────────────────────────
  if (typeof window !== 'undefined' && !docusignStatus) {
    const params = new URLSearchParams(window.location.search);
    const ds = params.get('docusign');
    if (ds === 'connected') {
      setDocusignStatus('DocuSign connected successfully');
      window.history.replaceState({}, '', '/command-center/transitions');
    } else if (ds === 'error') {
      setDocusignStatus('DocuSign connection failed: ' + (params.get('reason') ?? 'unknown'));
      window.history.replaceState({}, '', '/command-center/transitions');
    }
  }

  const summary = data?.summary;

  return (
    <div className="py-8 px-10 max-w-[1400px]">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <Link href="/command-center" className="text-sm text-slate no-underline inline-flex items-center gap-1.5 mb-3 hover:text-teal transition-smooth">
          ← Back to Pipeline
        </Link>
        <h1 className="text-3xl font-bold text-charcoal font-serif mb-1">
          Client Transition Dashboard
        </h1>
        <p className="text-sm text-slate">
          Track client transitions, document statuses, and DocuSign progress by advisor
        </p>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Advisors', value: summary?.total_advisors ?? '—', colorClass: 'text-teal' },
          { label: 'Total Accounts', value: summary?.total_accounts ?? '—', colorClass: 'text-charcoal' },
          { label: 'IAA Signed', value: summary?.iaa_signed ?? '—', colorClass: 'text-market-bull' },
          { label: 'Paperwork Signed', value: summary?.paperwork_signed ?? '—', colorClass: 'text-market-bull' },
          { label: 'Pending Documents', value: summary?.pending_documents ?? '—', colorClass: 'text-wealth-gold-dark' },
        ].map(card => (
          <div key={card.label} className="stat-card">
            <div className="text-xs text-slate font-medium uppercase tracking-wide mb-1.5">
              {card.label}
            </div>
            <div className={`text-3xl font-bold ${card.colorClass}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls Row ────────────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-5 items-center flex-wrap">
        {/* Search */}
        <input
          type="text"
          placeholder="Search advisors, households, clients..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[250px] px-3.5 py-2.5 rounded-lg border border-cream-border text-sm text-charcoal bg-white outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-smooth"
        />

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-lg border border-cream-border text-sm bg-white text-charcoal cursor-pointer focus:border-teal focus:ring-1 focus:ring-teal transition-smooth"
        >
          <option value="all">All Statuses</option>
          <option value="iaa_pending">IAA Pending</option>
          <option value="paperwork_pending">Paperwork Pending</option>
          <option value="completed">Fully Completed</option>
          <option value="not_ready">Not Ready</option>
        </select>

        {/* Sync Button */}
        <button
          onClick={() => setShowSyncPanel(!showSyncPanel)}
          className="bg-teal hover:bg-teal-dark text-white px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-1.5 transition-smooth"
        >
          ↻ Sync from Sheet
        </button>

        {/* DocuSign Button */}
        <button
          onClick={handleDocuSignConnect}
          className="bg-white hover:bg-cream text-charcoal px-4 py-2.5 rounded-lg border border-cream-border text-sm font-semibold cursor-pointer flex items-center gap-1.5 transition-smooth"
        >
          ✎ DocuSign Status
        </button>
      </div>

      {/* ── Sync Panel ──────────────────────────────────────────────────────── */}
      {showSyncPanel && (
        <div className="glass-card p-5 mb-5">
          <div className="text-sm font-semibold text-charcoal mb-3">
            Sync Transition Data from Google Sheets
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Google Sheet ID (from the URL)"
              value={sheetId}
              onChange={e => setSheetId(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-cream-border text-sm outline-none bg-white focus:border-teal focus:ring-1 focus:ring-teal transition-smooth"
            />
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`px-5 py-2.5 rounded-lg border-none text-white text-sm font-semibold transition-smooth ${
                syncing ? 'bg-slate cursor-not-allowed' : 'bg-teal hover:bg-teal-dark cursor-pointer'
              }`}
            >
              {syncing ? 'Syncing...' : 'Start Sync'}
            </button>
          </div>
          {syncResult && (
            <div className={`mt-2.5 text-sm px-3 py-2 rounded-md ${
              syncResult.startsWith('Error')
                ? 'bg-market-bear-light text-market-bear-dark'
                : 'bg-market-bull-light text-market-bull-dark'
            }`}>
              {syncResult}
            </div>
          )}
          <p className="text-xs text-slate mt-2">
            The Sheet ID is the long string in the Google Sheets URL between /d/ and /edit.
            The sheet tab must be named &quot;Transition&quot;.
          </p>
        </div>
      )}

      {/* ── DocuSign Status ─────────────────────────────────────────────────── */}
      {docusignStatus && (
        <div className={`rounded-lg px-4 py-2.5 mb-4 text-sm flex justify-between items-center border ${
          docusignStatus.includes('Error') || docusignStatus.includes('failed')
            ? 'bg-market-bear-light border-market-bear text-market-bear-dark'
            : 'bg-market-bull-light border-market-bull text-market-bull-dark'
        }`}>
          {docusignStatus}
          <button onClick={() => setDocusignStatus(null)} className="bg-transparent border-none cursor-pointer text-base text-inherit hover:opacity-70 transition-smooth">×</button>
        </div>
      )}

      {/* ── Loading / Error States ──────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-4">
          <div className="shimmer h-24 rounded-xl" />
          <div className="shimmer h-24 rounded-xl" />
          <div className="shimmer h-24 rounded-xl" />
        </div>
      )}

      {error && (
        <div className="text-center py-16 text-market-bear">
          Failed to load transition data. {data?.advisors?.length === 0 ? 'Sync a Google Sheet to get started.' : ''}
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────────────────── */}
      {data && data.advisors.length === 0 && !isLoading && !error && (
        <div className="glass-card text-center py-20 px-10">
          <div className="text-5xl mb-4">📋</div>
          <div className="text-lg font-semibold text-charcoal mb-2">
            No Transition Data Yet
          </div>
          <p className="text-sm text-slate max-w-[400px] mx-auto mb-5">
            Click &quot;Sync from Sheet&quot; above to import your transition spreadsheet from Google Sheets.
          </p>
        </div>
      )}

      {/* ── Advisor Accordion ───────────────────────────────────────────────── */}
      {filteredAdvisors.map(advisor => {
        const isExpanded = expandedAdvisor === advisor.advisor_name;

        // Quick stats for this advisor
        const iaaComplete = advisor.accounts.filter(a =>
          a.status_of_iaa === 'Completed' || a.docusign_iaa_status?.toLowerCase() === 'completed'
        ).length;
        const pwComplete = advisor.accounts.filter(a =>
          a.status_of_account_paperwork === 'Completed' || a.docusign_paperwork_status?.toLowerCase() === 'completed'
        ).length;

        return (
          <div key={advisor.advisor_name} className={`glass-card mb-3 overflow-hidden ${isExpanded ? 'depth-3' : 'depth-1'}`}>
            {/* ── Advisor Header ────────────────────────────────────────────── */}
            <button
              onClick={() => setExpandedAdvisor(isExpanded ? null : advisor.advisor_name)}
              className={`w-full px-5 py-4 border-none cursor-pointer flex items-center justify-between text-left transition-smooth ${
                isExpanded ? 'bg-glass-teal-light' : 'bg-transparent hover:bg-glass-teal-light'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {advisor.advisor_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="text-base font-semibold text-charcoal">
                    {advisor.advisor_name}
                  </div>
                  <div className="text-xs text-slate">
                    {advisor.farther_contact && `Contact: ${advisor.farther_contact} · `}
                    {advisor.total_accounts} account{advisor.total_accounts !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Progress pills */}
                <div className="flex gap-2">
                  <span className={`badge-glass ${iaaComplete === advisor.total_accounts ? 'badge-success' : 'badge-warning'}`}>
                    IAA {iaaComplete}/{advisor.total_accounts}
                  </span>
                  <span className={`badge-glass ${pwComplete === advisor.total_accounts ? 'badge-success' : 'badge-warning'}`}>
                    Paperwork {pwComplete}/{advisor.total_accounts}
                  </span>
                </div>

                <span className={`text-lg text-slate inline-block transition-smooth ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                  ▾
                </span>
              </div>
            </button>

            {/* ── Expanded Accounts Table ────────────────────────────────────── */}
            {isExpanded && (
              <div className="px-5 pb-4 overflow-x-auto">
                <table className="w-full text-sm premium-table">
                  <thead>
                    <tr className="border-b-2 border-cream-border">
                      {[
                        'Household', 'Account Type', 'Primary Holder', 'Readiness',
                        'IAA Status', 'Paperwork', 'DocuSign IAA', 'DocuSign PW',
                        'Portal', 'Contra Firm', 'New Acct #', 'Fee Schedule', 'Notes',
                      ].map(h => (
                        <th key={h} className="px-2 py-2.5 text-left text-xs font-semibold text-slate uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {advisor.accounts.map(acc => (
                      <tr key={acc.id} className="border-b border-cream-border">
                        <td className="px-2 py-2.5 font-medium text-charcoal max-w-[160px]">
                          {acc.household_name || acc.account_name || '—'}
                        </td>
                        <td className="px-2 py-2.5 text-charcoal">
                          {acc.account_type || '—'}
                        </td>
                        <td className="px-2 py-2.5 text-charcoal">
                          <div>{[acc.primary_first_name, acc.primary_last_name].filter(Boolean).join(' ') || '—'}</div>
                          {acc.primary_email && (
                            <div className="text-xs text-slate">{acc.primary_email}</div>
                          )}
                        </td>
                        <td className={`px-2 py-2.5 ${statusClass(acc.document_readiness)}`}>
                          {acc.document_readiness || '—'}
                        </td>
                        <td className={`px-2 py-2.5 ${statusClass(acc.status_of_iaa)}`}>
                          {acc.status_of_iaa || '—'}
                        </td>
                        <td className={`px-2 py-2.5 ${statusClass(acc.status_of_account_paperwork)}`}>
                          {acc.status_of_account_paperwork || '—'}
                        </td>
                        <td className="px-2 py-2.5">
                          <DocuSignPill status={acc.docusign_iaa_status} />
                        </td>
                        <td className="px-2 py-2.5">
                          <DocuSignPill status={acc.docusign_paperwork_status} />
                        </td>
                        <td className={`px-2 py-2.5 ${statusClass(acc.portal_status)}`}>
                          {acc.portal_status || '—'}
                        </td>
                        <td className="px-2 py-2.5 text-charcoal text-xs">
                          {acc.contra_account_firm || '—'}
                        </td>
                        <td className="px-2 py-2.5 text-charcoal font-mono text-xs">
                          {acc.new_account_number || '—'}
                        </td>
                        <td className="px-2 py-2.5 text-charcoal text-xs">
                          {acc.fee_schedule || '—'}
                        </td>
                        <td className="px-2 py-2.5 text-slate text-xs max-w-[200px]">
                          <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                            {acc.notes || '—'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Results count ───────────────────────────────────────────────────── */}
      {data && filteredAdvisors.length > 0 && (
        <div className="text-center py-4 text-xs text-slate">
          Showing {filteredAdvisors.length} advisor{filteredAdvisors.length !== 1 ? 's' : ''} · {filteredAdvisors.reduce((s, a) => s + a.total_accounts, 0)} accounts
        </div>
      )}
    </div>
  );
}
