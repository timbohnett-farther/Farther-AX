'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  dark: '#FAF7F2', white: '#1a1a1a', slate: 'rgba(250,247,242,0.5)',
  teal: '#2bb8c4', bg: '#111111',
  cardBg: '#2f2f2f', border: 'rgba(250,247,242,0.08)',
  green: '#4ade80', greenBg: 'rgba(74,222,128,0.2)',
  amber: '#fbbf24', amberBg: 'rgba(251,191,36,0.2)', amberBorder: 'rgba(251,191,36,0.35)',
  red: '#f87171', redBg: 'rgba(248,113,113,0.2)', redBorder: 'rgba(248,113,113,0.35)',
  gold: '#fbbf24', goldBg: 'rgba(251,191,36,0.2)',
  blue: '#60a5fa', blueBg: 'rgba(96,165,250,0.2)', blueBorder: 'rgba(96,165,250,0.35)', greenBorder: 'rgba(74,222,128,0.35)',
};

// ── Status color map ─────────────────────────────────────────────────────────
function statusStyle(status: string | null): React.CSSProperties {
  if (!status) return { color: C.slate, fontStyle: 'italic' };
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'signed' || s === 'done') {
    return { color: C.green, fontWeight: 600 };
  }
  if (s === 'sent' || s === 'delivered' || s === 'in progress') {
    return { color: C.amber, fontWeight: 500 };
  }
  if (s === 'not sent' || s === 'not ready' || s === 'declined' || s === 'voided') {
    return { color: C.red, fontWeight: 500 };
  }
  if (s === 'ready to send documents' || s === 'ready') {
    return { color: C.blue, fontWeight: 500 };
  }
  return { color: C.dark };
}

// ── DocuSign status pill ─────────────────────────────────────────────────────
function DocuSignPill({ status }: { status: string | null }) {
  if (!status) return <span style={{ color: C.slate, fontSize: 12 }}>—</span>;
  const s = status.toLowerCase();
  let bg = C.amberBg, border = C.amberBorder, color = C.amber;
  if (s === 'completed' || s === 'signed') { bg = C.greenBg; border = C.greenBorder; color = C.green; }
  if (s === 'sent' || s === 'delivered') { bg = C.blueBg; border = C.blueBorder; color = C.blue; }
  if (s === 'voided' || s === 'declined') { bg = C.redBg; border = C.redBorder; color = C.red; }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 12,
      fontSize: 11, fontWeight: 600, background: bg, border: `1px solid ${border}`, color,
      textTransform: 'capitalize',
    }}>
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
    <div style={{ padding: '32px 40px', maxWidth: 1400 }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/command-center" style={{ fontSize: 13, color: C.slate, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          ← Back to Pipeline
        </Link>
        <div style={{ position: 'relative', margin: '8px 0 4px' }}>
          <Image src="/images/Farther_Symbol_RGB_Cream.svg" alt="" width={32} height={32} style={{ position: 'absolute', top: 0, right: 0, opacity: 0.5 }} />
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
              Client Transition Dashboard
            </h1>
            <p style={{ fontSize: 14, color: C.slate, margin: 0 }}>
              Track client transitions, document statuses, and DocuSign progress by advisor
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Advisors', value: summary?.total_advisors ?? '—', color: C.teal },
          { label: 'Total Accounts', value: summary?.total_accounts ?? '—', color: C.dark },
          { label: 'IAA Signed', value: summary?.iaa_signed ?? '—', color: C.green },
          { label: 'Paperwork Signed', value: summary?.paperwork_signed ?? '—', color: C.green },
          { label: 'Pending Documents', value: summary?.pending_documents ?? '—', color: C.amber },
        ].map(card => (
          <div key={card.label} style={{
            background: C.cardBg, borderRadius: 12, padding: '20px 20px 16px',
            border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 12, color: C.slate, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls Row ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search advisors, households, clients..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            flex: 1, minWidth: 250, padding: '10px 14px', borderRadius: 8,
            border: `1px solid ${C.border}`, fontSize: 14, outline: 'none',
            background: C.white, color: C.dark,
          }}
        />

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
            fontSize: 13, background: C.white, color: C.dark, cursor: 'pointer',
          }}
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
          style={{
            padding: '10px 18px', borderRadius: 8, border: 'none',
            background: C.teal, color: C.white, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ↻ Sync from Sheet
        </button>

        {/* DocuSign Button */}
        <button
          onClick={handleDocuSignConnect}
          style={{
            padding: '10px 18px', borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.white, color: C.dark, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ✎ DocuSign Status
        </button>
      </div>

      {/* ── Sync Panel ──────────────────────────────────────────────────────── */}
      {showSyncPanel && (
        <div style={{
          background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: 20, marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, marginBottom: 12 }}>
            Sync Transition Data from Google Sheets
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Google Sheet ID (from the URL)"
              value={sheetId}
              onChange={e => setSheetId(e.target.value)}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 8,
                border: `1px solid ${C.border}`, fontSize: 13, outline: 'none',
              }}
            />
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: syncing ? C.slate : C.teal, color: C.white,
                fontSize: 13, fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer',
              }}
            >
              {syncing ? 'Syncing...' : 'Start Sync'}
            </button>
          </div>
          {syncResult && (
            <div style={{
              marginTop: 10, fontSize: 13, padding: '8px 12px', borderRadius: 6,
              background: syncResult.startsWith('Error') ? C.redBg : C.greenBg,
              color: syncResult.startsWith('Error') ? C.red : C.green,
            }}>
              {syncResult}
            </div>
          )}
          <p style={{ fontSize: 12, color: C.slate, marginTop: 8 }}>
            The Sheet ID is the long string in the Google Sheets URL between /d/ and /edit.
            The sheet tab must be named &quot;Transition&quot;.
          </p>
        </div>
      )}

      {/* ── DocuSign Status ─────────────────────────────────────────────────── */}
      {docusignStatus && (
        <div style={{
          background: docusignStatus.includes('Error') || docusignStatus.includes('failed') ? C.redBg : C.greenBg,
          border: `1px solid ${docusignStatus.includes('Error') || docusignStatus.includes('failed') ? C.redBorder : C.greenBorder}`,
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
          color: docusignStatus.includes('Error') || docusignStatus.includes('failed') ? C.red : C.green,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {docusignStatus}
          <button onClick={() => setDocusignStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit' }}>×</button>
        </div>
      )}

      {/* ── Loading / Error States ──────────────────────────────────────────── */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 60, color: C.slate }}>
          Loading transition data...
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: 60, color: C.red }}>
          Failed to load transition data. {data?.advisors?.length === 0 ? 'Sync a Google Sheet to get started.' : ''}
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────────────────── */}
      {data && data.advisors.length === 0 && !isLoading && !error && (
        <div style={{
          textAlign: 'center', padding: '80px 40px',
          background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: C.dark, marginBottom: 8 }}>
            No Transition Data Yet
          </div>
          <p style={{ fontSize: 14, color: C.slate, maxWidth: 400, margin: '0 auto 20px' }}>
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
          <div key={advisor.advisor_name} style={{
            background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`,
            marginBottom: 12, overflow: 'hidden',
            boxShadow: isExpanded ? '0 2px 8px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.03)',
          }}>
            {/* ── Advisor Header ────────────────────────────────────────────── */}
            <button
              onClick={() => setExpandedAdvisor(isExpanded ? null : advisor.advisor_name)}
              style={{
                width: '100%', padding: '16px 20px', border: 'none', cursor: 'pointer',
                background: isExpanded ? 'rgba(29,118,130,0.04)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: C.teal,
                  color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, flexShrink: 0,
                }}>
                  {advisor.advisor_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.dark }}>
                    {advisor.advisor_name}
                  </div>
                  <div style={{ fontSize: 12, color: C.slate }}>
                    {advisor.farther_contact && `Contact: ${advisor.farther_contact} · `}
                    {advisor.total_accounts} account{advisor.total_accounts !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Progress pills */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                    background: iaaComplete === advisor.total_accounts ? C.greenBg : C.amberBg,
                    color: iaaComplete === advisor.total_accounts ? C.green : C.amber,
                    border: `1px solid ${iaaComplete === advisor.total_accounts ? C.greenBorder : C.amberBorder}`,
                  }}>
                    IAA {iaaComplete}/{advisor.total_accounts}
                  </span>
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                    background: pwComplete === advisor.total_accounts ? C.greenBg : C.amberBg,
                    color: pwComplete === advisor.total_accounts ? C.green : C.amber,
                    border: `1px solid ${pwComplete === advisor.total_accounts ? C.greenBorder : C.amberBorder}`,
                  }}>
                    Paperwork {pwComplete}/{advisor.total_accounts}
                  </span>
                </div>

                <span style={{
                  fontSize: 18, color: C.slate,
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms ease',
                  display: 'inline-block',
                }}>
                  ▾
                </span>
              </div>
            </button>

            {/* ── Expanded Accounts Table ────────────────────────────────────── */}
            {isExpanded && (
              <div style={{ padding: '0 20px 16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                      {[
                        'Household', 'Account Type', 'Primary Holder', 'Readiness',
                        'IAA Status', 'Paperwork', 'DocuSign IAA', 'DocuSign PW',
                        'Portal', 'Contra Firm', 'New Acct #', 'Fee Schedule', 'Notes',
                      ].map(h => (
                        <th key={h} style={{
                          padding: '10px 8px', textAlign: 'left', fontSize: 11,
                          fontWeight: 600, color: C.slate, textTransform: 'uppercase',
                          letterSpacing: 0.5, whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {advisor.accounts.map(acc => (
                      <tr key={acc.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 120ms ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(29,118,130,0.06)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '10px 8px', fontWeight: 500, color: C.dark, maxWidth: 160 }}>
                          {acc.household_name || acc.account_name || '—'}
                        </td>
                        <td style={{ padding: '10px 8px', color: C.dark }}>
                          {acc.account_type || '—'}
                        </td>
                        <td style={{ padding: '10px 8px', color: C.dark }}>
                          <div>{[acc.primary_first_name, acc.primary_last_name].filter(Boolean).join(' ') || '—'}</div>
                          {acc.primary_email && (
                            <div style={{ fontSize: 11, color: C.slate }}>{acc.primary_email}</div>
                          )}
                        </td>
                        <td style={{ padding: '10px 8px', ...statusStyle(acc.document_readiness) }}>
                          {acc.document_readiness || '—'}
                        </td>
                        <td style={{ padding: '10px 8px', ...statusStyle(acc.status_of_iaa) }}>
                          {acc.status_of_iaa || '—'}
                        </td>
                        <td style={{ padding: '10px 8px', ...statusStyle(acc.status_of_account_paperwork) }}>
                          {acc.status_of_account_paperwork || '—'}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <DocuSignPill status={acc.docusign_iaa_status} />
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <DocuSignPill status={acc.docusign_paperwork_status} />
                        </td>
                        <td style={{ padding: '10px 8px', ...statusStyle(acc.portal_status) }}>
                          {acc.portal_status || '—'}
                        </td>
                        <td style={{ padding: '10px 8px', color: C.dark, fontSize: 12 }}>
                          {acc.contra_account_firm || '—'}
                        </td>
                        <td style={{ padding: '10px 8px', color: C.dark, fontFamily: 'monospace', fontSize: 12 }}>
                          {acc.new_account_number || '—'}
                        </td>
                        <td style={{ padding: '10px 8px', color: C.dark, fontSize: 12 }}>
                          {acc.fee_schedule || '—'}
                        </td>
                        <td style={{ padding: '10px 8px', color: C.slate, fontSize: 12, maxWidth: 200 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: C.slate }}>
          Showing {filteredAdvisors.length} advisor{filteredAdvisors.length !== 1 ? 's' : ''} · {filteredAdvisors.reduce((s, a) => s + a.total_accounts, 0)} accounts
        </div>
      )}
    </div>
  );
}
