'use client';

import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PHASES, PHASE_ORDER, type Phase } from '@/lib/onboarding-tasks-v2';
import { useTheme } from '@/lib/theme-provider';
import {
  formatAUM,
  formatPct,
  STAGE_LABELS,
  STAGE_ORDER,
  stageIndex,
  type ProfileTab,
} from '@/components/advisor-detail/types';
import {
  Section,
  Field,
  Grid,
  Badge,
  StageBadge,
  IntelCard,
  EmptyState,
  StatCard,
} from '@/components/advisor-detail/shared';
import { AdvisorHeader } from '@/components/advisor-detail/AdvisorHeader';
import { ComplexityPanel } from '@/components/advisor-detail/ComplexityPanel';
import { TeamAssignments } from '@/components/advisor-detail/TeamAssignments';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── U4 & 2B Intake Card ──────────────────────────────────────────────────────
function U4Card({ dealId, contactId, contactEmail, advisorName }: { dealId: string; contactId: string | null; contactEmail: string | null; advisorName: string }) {
  const { THEME } = useTheme();
  const { data, mutate } = useSWR(dealId ? `/api/command-center/advisor/${dealId}/u4-2b` : null, fetcher);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const status = data?.status ?? 'not_sent';
  const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    not_sent: { label: 'Not Sent', color: '#94a3b8', bg: 'rgba(148,163,184,0.18)' },
    sent: { label: 'Awaiting Advisor', color: '#fbbf24', bg: 'rgba(251,191,36,0.18)' },
    completed: { label: 'Received', color: '#4ade80', bg: 'rgba(74,222,128,0.18)' },
    expired: { label: 'Expired', color: '#f87171', bg: 'rgba(248,113,113,0.18)' },
  };

  const cfg = statusConfig[status] || statusConfig.not_sent;

  const handleSend = async () => {
    if (!contactEmail) return;
    setSending(true);
    try {
      await fetch('/api/u4-2b/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, contactId, contactEmail, advisorName }),
      });
      mutate();
    } catch { /* silent */ }
    setSending(false);
  };

  const handleCopyLink = async () => {
    if (!data?.token) return;
    await navigator.clipboard.writeText(`${APP_URL}/forms/u4-2b/${data.token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Section title="U4 & 2B Intake Form" highlight icon="✦">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: THEME.colors.textMuted }}>Status:</span>
          <span style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: 6,
            background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 700,
            border: `1px solid ${cfg.color}40`,
          }}>{cfg.label}</span>
        </div>

        {(status === 'not_sent' || status === 'expired') && contactEmail && (
          <button onClick={handleSend} disabled={sending}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer',
              border: 'none', background: `linear-gradient(135deg, ${THEME.colors.teal}, #3B5A69)`, color: '#fff',
              boxShadow: '0 4px 16px rgba(29,118,130,0.3)', opacity: sending ? 0.7 : 1,
            }}>
            {sending ? 'Sending...' : (status === 'expired' ? 'Resend Form' : 'Send U4 & 2B Form')}
          </button>
        )}

        {!contactEmail && status === 'not_sent' && (
          <span style={{ fontSize: 12, color: THEME.colors.warning }}>No email on file — cannot send form</span>
        )}
      </div>

      {(status === 'sent' || status === 'completed' || status === 'expired') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 20px' }}>
          {data?.sentAt && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Sent</p>
              <p style={{ fontSize: 13, color: THEME.colors.text }}>{new Date(data.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          )}
          {data?.sentBy && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Sent By</p>
              <p style={{ fontSize: 13, color: THEME.colors.text }}>{data.sentBy}</p>
            </div>
          )}
          {data?.completedAt && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Received</p>
              <p style={{ fontSize: 13, color: THEME.colors.success, fontWeight: 600 }}>{new Date(data.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          )}
        </div>
      )}

      {data?.token && status !== 'not_sent' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={handleCopyLink}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${THEME.colors.border}`, background: copied ? THEME.colors.successBg : THEME.colors.surface,
              color: copied ? THEME.colors.success : THEME.colors.textMuted,
            }}>
            {copied ? '✓ Copied!' : 'Copy Form Link'}
          </button>
          {status === 'sent' && (
            <button onClick={handleSend} disabled={sending}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${THEME.colors.border}`, background: THEME.colors.surface, color: THEME.colors.textMuted,
                opacity: sending ? 0.7 : 1,
              }}>
              {sending ? 'Resending...' : 'Resend Email'}
            </button>
          )}
        </div>
      )}
    </Section>
  );
}

// ── Tech Intake Card ──────────────────────────────────────────────────────────
function TechIntakeCard({ dealId, contactId, contactEmail, advisorName }: { dealId: string; contactId: string | null; contactEmail: string | null; advisorName: string }) {
  const { THEME } = useTheme();
  const { data, mutate } = useSWR(dealId ? `/api/command-center/advisor/${dealId}/tech-intake` : null, fetcher);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const status = data?.status ?? 'not_sent';
  const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    not_sent: { label: 'Not Sent', color: '#94a3b8', bg: 'rgba(148,163,184,0.18)' },
    sent: { label: 'Awaiting Advisor', color: '#fbbf24', bg: 'rgba(251,191,36,0.18)' },
    completed: { label: 'Received', color: '#4ade80', bg: 'rgba(74,222,128,0.18)' },
    expired: { label: 'Expired', color: '#f87171', bg: 'rgba(248,113,113,0.18)' },
  };

  const cfg = statusConfig[status] || statusConfig.not_sent;

  const handleSend = async () => {
    if (!contactEmail) return;
    setSending(true);
    try {
      await fetch('/api/tech-intake/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, contactId, contactEmail, advisorName }),
      });
      mutate();
    } catch { /* silent */ }
    setSending(false);
  };

  const handleCopyLink = async () => {
    if (!data?.token) return;
    await navigator.clipboard.writeText(`${APP_URL}/forms/tech-intake/${data.token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Section title="Technology Intake Form" highlight icon="◎">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: THEME.colors.textMuted }}>Status:</span>
          <span style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: 6,
            background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 700,
            border: `1px solid ${cfg.color}40`,
          }}>{cfg.label}</span>
        </div>

        {(status === 'not_sent' || status === 'expired') && contactEmail && (
          <button onClick={handleSend} disabled={sending}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer',
              border: 'none', background: `linear-gradient(135deg, ${THEME.colors.teal}, #3B5A69)`, color: '#fff',
              boxShadow: '0 4px 16px rgba(29,118,130,0.3)', opacity: sending ? 0.7 : 1,
            }}>
            {sending ? 'Sending...' : (status === 'expired' ? 'Resend Form' : 'Send Tech Intake')}
          </button>
        )}

        {!contactEmail && status === 'not_sent' && (
          <span style={{ fontSize: 12, color: THEME.colors.warning }}>No email on file — cannot send form</span>
        )}
      </div>

      {(status === 'sent' || status === 'completed' || status === 'expired') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 20px' }}>
          {data?.sentAt && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Sent</p>
              <p style={{ fontSize: 13, color: THEME.colors.text }}>{new Date(data.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          )}
          {data?.sentBy && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Sent By</p>
              <p style={{ fontSize: 13, color: THEME.colors.text }}>{data.sentBy}</p>
            </div>
          )}
          {data?.completedAt && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Received</p>
              <p style={{ fontSize: 13, color: THEME.colors.success, fontWeight: 600 }}>{new Date(data.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          )}
        </div>
      )}

      {data?.token && status !== 'not_sent' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={handleCopyLink}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${THEME.colors.border}`, background: copied ? THEME.colors.successBg : THEME.colors.surface,
              color: copied ? THEME.colors.success : THEME.colors.textMuted,
            }}>
            {copied ? '✓ Copied!' : 'Copy Form Link'}
          </button>
          {status === 'sent' && (
            <button onClick={handleSend} disabled={sending}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${THEME.colors.border}`, background: THEME.colors.surface, color: THEME.colors.textMuted,
                opacity: sending ? 0.7 : 1,
              }}>
              {sending ? 'Resending...' : 'Resend Email'}
            </button>
          )}
        </div>
      )}
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB CONTENT COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OverviewTab({ deal, contact, extracted, dealId }: { deal: Record<string, any>; contact: Record<string, any> | null; extracted: Record<string, any> | null; dealId: string }) {
  const { THEME } = useTheme();
  const cp = extracted?.candidate_profile;
  const motives = extracted?.motives;
  const personal = extracted?.personal;

  return (
    <>
      <U4Card
        dealId={dealId}
        contactId={contact?.vid?.toString() || contact?.id?.toString() || null}
        contactEmail={contact?.email || null}
        advisorName={deal.dealname || 'Advisor'}
      />

      <TechIntakeCard
        dealId={dealId}
        contactId={contact?.vid?.toString() || contact?.id?.toString() || null}
        contactEmail={contact?.email || null}
        advisorName={deal.dealname || 'Advisor'}
      />

      <Section title="Candidate Profile" icon="◈">
        <Grid>
          <Field label="Candidate Type" value={cp?.candidate_type} />
          <Field label="Lead Source" value={cp?.lead_source || deal.advisor_recruiting_lead_source} />
          <Field label="Location" value={cp?.location || (contact?.city && contact?.state ? `${contact.city}, ${contact.state}` : contact?.city || contact?.state)} />
          <Field label="Current Firm" value={cp?.current_firm || deal.current_firm__cloned_} />
          <Field label="Title" value={cp?.title} />
          <Field label="Website" value={cp?.website ? <a href={cp.website} target="_blank" rel="noopener noreferrer" style={{ color: THEME.colors.teal, textDecoration: 'none' }}>{cp.website}</a> : null} />
          <Field label="CRD Number" value={cp?.crd_number} highlight />
          <Field label="Length of Experience" value={cp?.loe_years ? `${cp.loe_years} years` : null} />
          <Field label="Length of Service" value={cp?.los_years ? `${cp.los_years} years at current firm` : null} />
          <Field label="Disclosures" value={cp?.disclosures} />
          <Field label="Referred By" value={deal.referred_by__cloned_} />
          <Field label="Deal Owner" value={deal.hubspot_owner_id} />
        </Grid>
        {((cp?.licenses?.length > 0) || (cp?.designations?.length > 0)) && (
          <div style={{ marginTop: 12 }}>
            {cp?.licenses?.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Licenses</p>
                {cp.licenses.map((l: string, i: number) => <Badge key={i} label={l.match(/\d/) ? `Series ${l}` : l} color={THEME.colors.teal} />)}
              </div>
            )}
            {cp?.designations?.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Designations</p>
                {cp.designations.map((d: string, i: number) => <Badge key={i} label={d} color={THEME.colors.bronze400} />)}
              </div>
            )}
          </div>
        )}
      </Section>

      {cp?.previous_experience?.length > 0 && (
        <Section title="Professional Experience" icon="▸">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cp.previous_experience.map((exp: { firm: string; role: string; years: number | null; notes: string | null }, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '10px 14px', borderRadius: 6, background: i === 0 ? 'rgba(29,118,130,0.04)' : 'transparent', border: `1px solid ${i === 0 ? 'rgba(29,118,130,0.12)' : THEME.colors.border}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: `${THEME.colors.teal}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: THEME.colors.teal, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: THEME.colors.text }}>{exp.firm}</p>
                  <p style={{ fontSize: 12, color: THEME.colors.textMuted }}>{exp.role}{exp.years ? ` · ${exp.years} years` : ''}</p>
                  {exp.notes && <p style={{ fontSize: 12, color: THEME.colors.textMuted, marginTop: 4 }}>{exp.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {extracted && extracted.team_members && extracted.team_members.length > 0 && (
        <Section title="Advisor's Team" icon="●">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.colors.border}` }}>
                  {['Name', 'Title', 'Licenses', 'Compensation', 'Notes'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: THEME.colors.textMuted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(extracted.team_members as Array<{ name: string; title: string | null; licenses: string | null; compensation: string | null; notes: string | null; staying: boolean | null }>).map((m, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${THEME.colors.border}`, background: i % 2 === 0 ? THEME.colors.surface : '#262626' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{m.name}</td>
                    <td style={{ padding: '8px 12px', color: THEME.colors.textMuted }}>{m.title ?? '—'}</td>
                    <td style={{ padding: '8px 12px' }}>{m.licenses ? <Badge label={m.licenses} /> : '—'}</td>
                    <td style={{ padding: '8px 12px', color: THEME.colors.textMuted }}>{m.compensation ?? '—'}</td>
                    <td style={{ padding: '8px 12px', color: THEME.colors.textMuted, fontSize: 12 }}>
                      {m.notes ?? '—'}
                      {m.staying === false && <span style={{ color: THEME.colors.error, fontWeight: 600, marginLeft: 6 }}>May leave</span>}
                      {m.staying === true && <span style={{ color: THEME.colors.success, fontWeight: 600, marginLeft: 6 }}>Staying</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {motives && (motives.pain_points?.length > 0 || motives.top_care_abouts?.length > 0 || motives.goals?.length > 0) && (
        <Section title="Motives & Goals" icon="◎">
          <IntelCard label="Pain Points / Concerns" items={motives.pain_points} color={THEME.colors.warning} icon="⚠" />
          <IntelCard label="Top Care Abouts" items={motives.top_care_abouts} color={THEME.colors.teal} icon="★" />
          <IntelCard label="Goals" items={motives.goals} color={THEME.colors.success} icon="◎" />
        </Section>
      )}

      {personal && (personal.married || personal.kids || personal.notes?.length > 0) && (
        <Section title="Personal Details" icon="♦">
          <Grid cols={2}>
            <Field label="Married" value={personal.married} />
            <Field label="Kids" value={personal.kids} />
          </Grid>
          {personal.notes?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {personal.notes.map((n: string, i: number) => (
                <p key={i} style={{ fontSize: 13, color: THEME.colors.text, lineHeight: 1.6, marginBottom: 4 }}>{n}</p>
              ))}
            </div>
          )}
        </Section>
      )}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FinancialsTab({ deal, team, extracted }: { deal: Record<string, any>; team: Record<string, any> | null; extracted: Record<string, any> | null }) {
  const { THEME } = useTheme();
  const book = extracted?.book_analysis;
  const fin = extracted?.financials;
  const port = extracted?.portability;

  return (
    <>
      <Section title="Book Analysis" icon="◈">
        <Grid>
          <Field label="Total AUM" value={formatAUM(book?.total_aum || deal.aum || team?.aum)} highlight />
          <Field label="Transferable AUM" value={formatAUM(port?.transferable_aum || deal.transferable_aum || team?.transferable_aum)} highlight />
          <Field label="T12 Revenue" value={formatAUM(book?.t12_revenue || deal.t12_revenue || team?.t12_revenue)} />
          <Field label="Avg Fee" value={book?.avg_fee_bps ? `${book.avg_fee_bps} bps` : formatPct(team?.average_fee_rate)} />
          <Field label="Households" value={book?.households || deal.client_households || team?.client_households} />
          <Field label="Accounts" value={book?.accounts || team?.client_accounts} />
          <Field label="Avg HH Size" value={formatAUM(book?.avg_hh_size || deal.average_household_assets || team?.average_household_assets)} />
          <Field label="Largest Client" value={formatAUM(book?.largest_client || team?.largest_client_assets)} />
          <Field label="Fee-Based Revenue" value={formatAUM(deal.fee_based_revenue || team?.fee_based_revenue)} />
          <Field label="BD Revenue" value={formatAUM(book?.bd_revenue || deal.broker_dealer_revenue || team?.broker_dealer_revenue)} />
          <Field label="Insurance/Annuity" value={book?.insurance_annuity || formatAUM(deal.insurance_annuity_revenue || team?.insurance_annuity_revenue)} />
          <Field label="401k AUM & Revenue" value={book?.n401k_aum_revenue || formatAUM(deal.n401k_aum || team?.n401k_aum)} />
          <Field label="Organically Grown" value={book?.organically_grown_pct != null ? `${book.organically_grown_pct}%` : formatPct(team?.book_organically_generated__)} />
          <Field label="Acquired/Inherited" value={book?.acquired_inherited_pct != null ? `${book.acquired_inherited_pct}%` : formatPct(deal.book_acquired___inherited__ || team?.book_acquired___inherited__)} />
          <Field label="Investment Products" value={book?.investment_products || team?.investment_products} />
          <Field label="Alt Assets %" value={book?.alt_assets_pct != null ? `${book.alt_assets_pct}%` : formatPct(team?.alternative_assets__)} />
        </Grid>
        {book?.obas && (
          <div style={{ marginTop: 12, padding: '12px 14px', background: THEME.colors.warningBg, border: `1px solid ${THEME.colors.warningBorder}`, borderRadius: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: THEME.colors.warning, marginBottom: 4 }}>OBAs</p>
            <p style={{ fontSize: 13, color: THEME.colors.text, lineHeight: 1.6 }}>{book.obas}</p>
          </div>
        )}
      </Section>

      <Section title="Current Financials" icon="▲">
        <Grid>
          <Field label="Employment Type" value={fin?.employment_type} />
          <Field label="Payout Rate" value={fin?.payout_rate || formatPct(team?.payout_rate)} />
          <Field label="Annualized Income" value={formatAUM(fin?.annualized_income || team?.annualized_income)} highlight />
          <Field label="Annualized Expenses" value={formatAUM(fin?.annualized_expenses || team?.annualized_expenses)} />
          <Field label="Office Expense" value={formatAUM(fin?.office_expense || team?.office_expense)} />
          <Field label="Marketing Spend" value={formatAUM(fin?.marketing_spend || team?.marketing_expense)} />
          <Field label="Debt" value={fin?.debt || deal.advisor_debt || team?.advisor_debt} />
          <Field label="Contract Restrictions" value={fin?.contract_restrictions || team?.restrictive_covenants} />
          <Field label="Employment Contract" value={team?.employment_contract} />
        </Grid>
        {fin?.expense_details?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Expense Breakdown</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {fin.expense_details.map((e: string, i: number) => (
                <li key={i} style={{ fontSize: 13, color: THEME.colors.text, lineHeight: 1.6 }}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {(fin?.competing_firms?.length > 0 || fin?.competing_offers?.length > 0) && (
        <Section title="Competition" icon="⚑">
          {fin.competing_firms?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Competing Firms</p>
              {fin.competing_firms.map((f: string, i: number) => <p key={i} style={{ fontSize: 13, color: THEME.colors.text, lineHeight: 1.6 }}>{f}</p>)}
            </div>
          )}
          {fin.competing_offers?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Competing Offers</p>
              {fin.competing_offers.map((o: string, i: number) => <p key={i} style={{ fontSize: 13, color: THEME.colors.text, lineHeight: 1.6 }}>{o}</p>)}
            </div>
          )}
        </Section>
      )}

      {extracted?.deal_structure_notes && (
        <Section title="Deal Structure Notes" icon="✦">
          <p style={{ fontSize: 14, color: THEME.colors.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{extracted.deal_structure_notes}</p>
        </Section>
      )}

      <Section title="Portability & Transition" icon="▸">
        <Grid>
          <Field label="Transition Type" value={port?.transition_type || deal.transition_type || team?.transition_type} />
          <Field label="Owns Master Code" value={port?.owns_master_code != null ? (port.owns_master_code ? 'Yes' : 'No') : null} />
          <Field label="Previous Transitions" value={port?.previous_transitions != null ? (port.previous_transitions ? 'Yes' : 'No') : deal.prior_transitions} />
          <Field label="% Transferable" value={port?.transferable_pct != null ? `${port.transferable_pct}%` : null} />
          <Field label="Transferable AUM" value={formatAUM(port?.transferable_aum || deal.transferable_aum || team?.transferable_aum)} highlight />
          <Field label="Transferable Revenue" value={formatAUM(port?.transferable_revenue)} />
          <Field label="Transferable HH" value={port?.transferable_households || deal.transferable_households || team?.transferable_households} />
          <Field label="Billing Cycle" value={port?.billing_cycle || team?.billing_cycle} />
          <Field label="Transition Owner" value={deal.transition_owner} />
          <Field label="Onboarder" value={deal.onboarder} />
        </Grid>
        {port?.previous_transition_notes && <Field label="Previous Transition Notes" value={port.previous_transition_notes} wide />}
        {port?.transition_notes && <Field label="Transition Notes" value={port.transition_notes} wide />}
      </Section>

      {team && (team.ye_aum || team.n1yrago_aum) && (
        <Section title="Historical Performance" icon="▲">
          <Grid cols={4}>
            <Field label="YE AUM" value={formatAUM(team.ye_aum)} />
            <Field label="YE Revenue" value={formatAUM(team.ye_revenue)} />
            <Field label="1YrAgo AUM" value={formatAUM(team.n1yrago_aum)} />
            <Field label="1YrAgo Revenue" value={formatAUM(team.n1yrago_revenue)} />
            <Field label="2YrAgo AUM" value={formatAUM(team.n2yrago_aum)} />
            <Field label="2YrAgo Revenue" value={formatAUM(team.n2yrago_revenue)} />
            <Field label="Avg AUM Growth" value={formatPct(team.average_aum_growth)} />
            <Field label="Avg Rev Growth" value={formatPct(team.average_revenue_growth)} />
          </Grid>
        </Section>
      )}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EngagementsTab({ engagements, extracted, notes }: { engagements: any[]; extracted: Record<string, any> | null; notes: any[] }) {
  const { THEME } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const emailCount = engagements.filter(e => e.type === 'email').length;
  const callCount = engagements.filter(e => e.type === 'call').length;
  const meetingCount = engagements.filter(e => e.type === 'meeting').length;

  const filtered = engagements.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const text = JSON.stringify(e.properties).toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const salesProcess = extracted?.sales_process;
  const typeColors: Record<string, string> = { email: '#3b82f6', call: THEME.colors.success, meeting: THEME.colors.teal };
  const typeIcons: Record<string, string> = { email: '✉', call: '☎', meeting: '◈' };

  function getTitle(e: { type: string; properties: Record<string, string> }): string {
    if (e.type === 'email') return e.properties.hs_email_subject || 'Email';
    if (e.type === 'call') return e.properties.hs_call_title || 'Call';
    if (e.type === 'meeting') return e.properties.hs_meeting_title || 'Meeting';
    return 'Activity';
  }

  function getBody(e: { type: string; properties: Record<string, string> }): string {
    if (e.type === 'email') return e.properties.hs_email_text || '';
    if (e.type === 'call') return e.properties.hs_call_body || '';
    if (e.type === 'meeting') return e.properties.hs_meeting_body || '';
    return '';
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Activities" value={engagements.length} color={THEME.colors.teal} />
        <StatCard label="Emails" value={emailCount} color="#3b82f6" />
        <StatCard label="Calls" value={callCount} color={THEME.colors.success} />
        <StatCard label="Meetings" value={meetingCount} color={THEME.colors.teal} />
      </div>

      {salesProcess?.next_steps?.length > 0 && (
        <Section title="Sales Process Timeline" icon="▸">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {salesProcess.next_steps.map((step: { step: string; date: string | null }, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 6, background: i === salesProcess.next_steps.length - 1 ? 'rgba(29,118,130,0.06)' : 'transparent', border: `1px solid ${i === salesProcess.next_steps.length - 1 ? 'rgba(29,118,130,0.15)' : THEME.colors.border}` }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${THEME.colors.teal}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: THEME.colors.teal, flexShrink: 0 }}>{i + 1}</div>
                <p style={{ fontSize: 13, color: THEME.colors.text, fontWeight: 500, flex: 1 }}>{step.step}</p>
                {step.date && <span style={{ fontSize: 12, color: THEME.colors.textMuted, flexShrink: 0 }}>{step.date}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {(salesProcess?.intro_call_notes || salesProcess?.first_meeting_notes || salesProcess?.financial_model_notes || salesProcess?.offer_notes) && (
        <Section title="Sales Notes" icon="✦">
          {salesProcess.intro_call_notes && <Field label="Intro Call Notes" value={salesProcess.intro_call_notes} wide />}
          {salesProcess.first_meeting_notes && <Field label="First Meeting Notes" value={salesProcess.first_meeting_notes} wide />}
          {salesProcess.financial_model_notes && <Field label="Financial Model Notes" value={salesProcess.financial_model_notes} wide />}
          {salesProcess.offer_notes && <Field label="Offer Notes" value={salesProcess.offer_notes} wide />}
        </Section>
      )}

      <Section title="Activity Timeline" icon="◉">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search activities..." style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: `1px solid ${THEME.colors.border}`, fontSize: 13, color: THEME.colors.text, background: THEME.colors.surface, outline: 'none', fontFamily: "'Inter', system-ui, sans-serif" , fontVariantNumeric: 'tabular-nums' }} />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: THEME.colors.textMuted }}>⌕</span>
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${THEME.colors.border}`, fontSize: 12, color: THEME.colors.text, background: THEME.colors.surface, cursor: 'pointer' }}>
            <option value="all">All Types</option>
            <option value="email">Emails</option>
            <option value="call">Calls</option>
            <option value="meeting">Meetings</option>
          </select>
          <span style={{ fontSize: 12, color: THEME.colors.textMuted }}>{filtered.length} activities</span>
        </div>
        {filtered.length === 0 ? (
          <EmptyState message="No engagements found" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflowY: 'auto' }}>
            {filtered.map((e, i) => {
              const body = getBody(e).replace(/<[^>]+>/g, '').trim();
              return (
                <div key={e.id || i} style={{ padding: '12px 16px', borderRadius: 8, border: `1px solid ${THEME.colors.border}`, background: i % 2 === 0 ? THEME.colors.surface : '#262626' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: body ? 6 : 0 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: `${typeColors[e.type] || THEME.colors.textMuted}15`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: typeColors[e.type] || THEME.colors.textMuted }}>{typeIcons[e.type] || '●'}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: THEME.colors.text, flex: 1 }}>{getTitle(e)}</span>
                    <span style={{ fontSize: 11, color: THEME.colors.textMuted }}>{e.timestamp ? new Date(e.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                    <Badge label={e.type} color={typeColors[e.type]} />
                  </div>
                  {body && <p style={{ fontSize: 12, color: THEME.colors.textMuted, lineHeight: 1.5, maxHeight: 60, overflow: 'hidden' }}>{body.slice(0, 300)}{body.length > 300 ? '...' : ''}</p>}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {notes.length > 0 && (
        <Section title={`HubSpot Notes (${notes.length})`} icon="✎">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {notes.slice(0, 10).map((note: { properties: { hs_note_body: string; hs_timestamp: string } }, i: number) => (
              <div key={i} style={{ borderBottom: i < Math.min(notes.length, 10) - 1 ? `1px solid ${THEME.colors.border}` : 'none', paddingBottom: i < Math.min(notes.length, 10) - 1 ? 16 : 0 }}>
                <p style={{ fontSize: 11, color: THEME.colors.textMuted, marginBottom: 6 }}>{note.properties.hs_timestamp ? new Date(note.properties.hs_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unknown'}</p>
                <p style={{ fontSize: 13, color: THEME.colors.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{note.properties.hs_note_body?.replace(/<[^>]+>/g, '') ?? ''}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TechComplexityTab({ deal, team, extracted, dealId }: { deal: Record<string, any>; team: Record<string, any> | null; extracted: Record<string, any> | null; dealId: string }) {
  const { THEME } = useTheme();
  const ts = extracted?.tech_stack;
  const custodian = ts?.custodian || team?.custodian || deal.custodian__cloned_;
  const crm = ts?.crm_platform || team?.crm_platform || deal.crm_platform__cloned_;
  const fp = ts?.financial_planning_platform || team?.financial_planning_platform || deal.financial_planning_platform__cloned_;
  const perf = ts?.performance_platform || team?.performance_platform || deal.performance_platform__cloned_;
  const tamp = team?.tamp;
  const additional = ts?.additional_tech || team?.technology_platforms_being_used || deal.technology_platforms_being_used__cloned_;
  const techNotes = team?.additional_tech_stack_notes;

  return (
    <>
      <Section title="Technology Stack" highlight icon="◉">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: additional || techNotes ? 16 : 0 }}>
          {[
            { label: 'Custodian', value: custodian, accent: true },
            { label: 'CRM Platform', value: crm },
            { label: 'Financial Planning', value: fp },
            { label: 'Performance Reporting', value: perf },
            { label: 'TAMP', value: tamp },
          ].filter(item => item.value).map(item => (
            <div key={item.label} style={{ padding: '12px 14px', borderRadius: 8, background: item.accent ? 'rgba(29,118,130,0.04)' : 'rgba(91,106,113,0.04)', border: `1px solid ${item.accent ? 'rgba(29,118,130,0.12)' : THEME.colors.border}` }}>
              <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</p>
              <p style={{ fontSize: 14, fontWeight: item.accent ? 600 : 500, color: item.accent ? THEME.colors.teal : THEME.colors.text }}>{item.value}</p>
            </div>
          ))}
        </div>
        {additional && (
          <div style={{ marginBottom: techNotes ? 12 : 0 }}>
            <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>All Platforms</p>
            <p style={{ fontSize: 13, color: THEME.colors.text, lineHeight: 1.6 }}>{additional}</p>
          </div>
        )}
        {techNotes && (
          <div>
            <p style={{ fontSize: 11, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Additional Notes</p>
            <p style={{ fontSize: 13, color: THEME.colors.text, lineHeight: 1.6 }}>{techNotes}</p>
          </div>
        )}
      </Section>
      <ComplexityPanel dealId={dealId} />
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TeamContactsTab({ dealId, allContacts }: { dealId: string; allContacts: any[] }) {
  const { THEME } = useTheme();
  return (
    <>
      <TeamAssignments dealId={dealId} />
      {allContacts.length > 0 && (
        <Section title={`Associated Contacts (${allContacts.length})`} icon="●">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {allContacts.map((c, i) => (
              <div key={c.id || i} style={{ padding: '14px 16px', borderRadius: 8, border: `1px solid ${THEME.colors.border}`, background: i === 0 ? 'rgba(29,118,130,0.04)' : THEME.colors.surface }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${THEME.colors.teal}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: THEME.colors.teal }}>{(c.firstname?.[0] ?? '').toUpperCase()}{(c.lastname?.[0] ?? '').toUpperCase()}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: THEME.colors.text }}>{[c.firstname, c.lastname].filter(Boolean).join(' ') || 'Unknown'}</p>
                    {c.company && <p style={{ fontSize: 12, color: THEME.colors.textMuted }}>{c.company}</p>}
                  </div>
                  {i === 0 && <Badge label="Primary" color={THEME.colors.teal} />}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {c.email && <a href={`mailto:${c.email}`} style={{ fontSize: 12, color: THEME.colors.teal, textDecoration: 'none' }}>✉ {c.email}</a>}
                  {c.phone && <a href={`tel:${c.phone}`} style={{ fontSize: 12, color: THEME.colors.teal, textDecoration: 'none' }}>☎ {c.phone}</a>}
                  {c.city && c.state && <span style={{ fontSize: 12, color: THEME.colors.textMuted }}>{c.city}, {c.state}</span>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ONBOARDING TASKS TAB (93-task checklist across 8 phases)
// ══════════════════════════════════════════════════════════════════════════════

const PHASE_CONFIG: Record<Phase, { label: string; color: string; bg: string; border: string }> = {
  phase_0: { label: PHASES.phase_0.label, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' }, // Purple - Sales Handoff
  phase_1: { label: PHASES.phase_1.label, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' }, // Blue - Post-Signing Prep
  phase_2: { label: PHASES.phase_2.label, color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.2)' }, // Cyan - Onboarding Kick-Off
  phase_3: { label: PHASES.phase_3.label, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' }, // Teal - Pre-Launch Build
  phase_4: { label: PHASES.phase_4.label, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' }, // Amber - T-7 Final Countdown
  phase_5: { label: PHASES.phase_5.label, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' }, // Red - Launch Day
  phase_6: { label: PHASES.phase_6.label, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' }, // Green - Active Transition
  phase_7: { label: PHASES.phase_7.label, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' }, // Violet - Graduation
};

interface ChecklistTask {
  id: string; label: string; phase: Phase; owner: string; timing: string; is_hard_gate: boolean; resources: string | null;
  completed: boolean; completed_by: string | null; completed_at: string | null; notes: string | null;
  due_date: string | null;
  responsible_person: { name: string; email: string; role: string } | null;
  countdown_display: string;
  days_remaining: number | null;
  status: 'upcoming' | 'due_soon' | 'overdue' | 'critical' | 'completed' | 'no_due_date';
}

function OnboardingTasksTab({ dealId }: { dealId: string }) {
  const { THEME } = useTheme();
  const { data, error, isLoading, mutate } = useSWR<{ dealId: string; tasks: ChecklistTask[] }>(
    dealId ? `/api/command-center/checklist/${dealId}` : null, fetcher
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [toggling, setToggling] = useState<string | null>(null);

  const togglePhase = (phase: string) => setCollapsed(prev => ({ ...prev, [phase]: !prev[phase] }));

  const handleToggle = useCallback(async (taskId: string, currentCompleted: boolean) => {
    if (!data) return;
    setToggling(taskId);
    const newCompleted = !currentCompleted;
    // Optimistic update
    mutate(
      { ...data, tasks: data.tasks.map(t => t.id === taskId ? { ...t, completed: newCompleted, completed_by: newCompleted ? 'you' : null, completed_at: newCompleted ? new Date().toISOString() : null } : t) },
      false
    );
    try {
      await fetch(`/api/command-center/checklist/${dealId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed: newCompleted }),
      });
      mutate();
    } catch { mutate(); }
    setToggling(null);
  }, [data, dealId, mutate]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1, 2, 3].map(i => <div key={i} style={{ height: 80, borderRadius: 10, background: 'rgba(91,106,113,0.06)', animation: 'shimmer 1.5s infinite' }} />)}
      </div>
    );
  }
  if (error || !data) return <EmptyState message="Failed to load onboarding tasks." />;

  const tasks = data.tasks;
  const totalCompleted = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const pctComplete = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  // Group tasks by phase using the correct phase keys from lib/onboarding-tasks
  const phases: { key: Phase; tasks: ChecklistTask[] }[] = PHASE_ORDER.map(phaseKey => ({
    key: phaseKey,
    tasks: tasks.filter(t => t.phase === phaseKey),
  }));

  return (
    <>
      {/* Summary row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: '18px 24px', borderRadius: 10, background: THEME.colors.surface, border: `1px solid ${THEME.colors.border}` }}>
        {/* Progress ring */}
        <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke={THEME.colors.border} strokeWidth="4" />
            <circle cx="28" cy="28" r="24" fill="none" stroke="#f59e0b" strokeWidth="4"
              strokeDasharray={`${(pctComplete / 100) * 150.8} 150.8`}
              strokeLinecap="round" transform="rotate(-90 28 28)" style={{ transition: 'stroke-dasharray 0.4s ease' }} />
          </svg>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{pctComplete}%</span>
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: THEME.colors.text, fontFamily: "'Inter', system-ui, sans-serif" , fontVariantNumeric: 'tabular-nums' }}>{totalCompleted} / {totalTasks} Tasks Complete</p>
          <p style={{ fontSize: 12, color: THEME.colors.textMuted, marginTop: 2 }}>Advisor onboarding checklist progress</p>
        </div>
        {/* Phase mini stats */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          {phases.map(p => {
            const cfg = PHASE_CONFIG[p.key];
            const done = p.tasks.filter(t => t.completed).length;
            return (
              <div key={p.key} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: cfg.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cfg.label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: THEME.colors.text }}>{done}/{p.tasks.length}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase sections */}
      {phases.map(p => {
        const cfg = PHASE_CONFIG[p.key];
        const done = p.tasks.filter(t => t.completed).length;
        const phasePct = p.tasks.length > 0 ? Math.round((done / p.tasks.length) * 100) : 0;
        const isCollapsed = collapsed[p.key] ?? false;

        return (
          <div key={p.key} style={{ marginBottom: 16, borderRadius: 10, border: `1px solid ${cfg.border}`, overflow: 'hidden', background: THEME.colors.surface }}>
            {/* Phase header */}
            <button onClick={() => togglePhase(p.key)} style={{
              width: '100%', padding: '14px 20px', background: cfg.bg, border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 14, color: cfg.color, transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cfg.label}</span>
              <span style={{ fontSize: 12, color: THEME.colors.textMuted }}>{done} / {p.tasks.length}</span>
              {/* Progress bar */}
              <div style={{ flex: 1, height: 5, background: 'rgba(91,106,113,0.08)', borderRadius: 3, overflow: 'hidden', marginLeft: 8 }}>
                <div style={{ height: '100%', width: `${phasePct}%`, background: cfg.color, borderRadius: 3, transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color, minWidth: 36, textAlign: 'right' }}>{phasePct}%</span>
            </button>

            {/* Task list */}
            {!isCollapsed && (
              <div style={{ padding: '8px 0' }}>
                {p.tasks.map((task, ti) => {
                  // Determine status color and styling
                  const statusColors = {
                    upcoming: { color: THEME.colors.textMuted, bg: 'rgba(91,106,113,0.08)', border: 'rgba(91,106,113,0.15)' },
                    due_soon: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
                    overdue: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
                    critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.2)', border: 'rgba(220,38,38,0.4)' },
                    completed: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
                    no_due_date: { color: THEME.colors.textMuted, bg: 'rgba(91,106,113,0.08)', border: 'rgba(91,106,113,0.15)' },
                  };
                  const statusStyle = statusColors[task.status] || statusColors.no_due_date;

                  return (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
                      borderBottom: ti < p.tasks.length - 1 ? `1px solid ${THEME.colors.border}` : 'none',
                      opacity: toggling === task.id ? 0.6 : 1, transition: 'opacity 0.15s',
                    }}>
                      {/* Checkbox */}
                      <button onClick={() => handleToggle(task.id, task.completed)} style={{
                        width: 22, height: 22, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
                        border: `2px solid ${task.completed ? cfg.color : 'rgba(248,244,240,0.2)'}`,
                        background: task.completed ? cfg.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}>
                        {task.completed && <span style={{ fontSize: 13, color: '#fff', lineHeight: 1 }}>✓</span>}
                      </button>

                      {/* Label and details */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{
                          fontSize: 13, color: task.completed ? THEME.colors.textMuted : THEME.colors.text,
                          textDecoration: task.completed ? 'line-through' : 'none',
                          textDecorationColor: 'rgba(248,244,240,0.3)',
                        }}>{task.label}</span>

                        {/* Responsible person and countdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: THEME.colors.textMuted }}>
                          {task.responsible_person && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ opacity: 0.6 }}>👤</span>
                              <span>{task.responsible_person.name}</span>
                            </span>
                          )}
                          {task.due_date && (
                            <>
                              {task.responsible_person && <span style={{ opacity: 0.3 }}>•</span>}
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ opacity: 0.6 }}>📅</span>
                                <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* Countdown/status badge */}
                        {!task.completed && task.status !== 'no_due_date' && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                            background: statusStyle.bg, color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                            whiteSpace: 'nowrap',
                          }}>
                            {task.countdown_display}
                          </span>
                        )}

                        {/* Optional badge (for non-hard-gate tasks) */}
                        {!task.is_hard_gate && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(91,106,113,0.08)', color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Optional</span>
                        )}

                        {/* Completed info */}
                        {task.completed && task.completed_at && (
                          <span style={{ fontSize: 11, color: THEME.colors.textMuted, whiteSpace: 'nowrap' }}>
                            {new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {task.completed_by && task.completed_by !== 'you' && task.completed_by !== 'system-auto' && ` · ${task.completed_by.split('@')[0]}`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CLIENT ONBOARDING TAB
// ══════════════════════════════════════════════════════════════════════════════

const PILL_COLORS: Record<string, { color: string; bg: string }> = {
  completed: { color: '#4ade80', bg: 'rgba(74,222,128,0.2)' },
  signed: { color: '#4ade80', bg: 'rgba(74,222,128,0.2)' },
  sent: { color: '#fbbf24', bg: 'rgba(251,191,36,0.2)' },
  delivered: { color: '#60a5fa', bg: 'rgba(96,165,250,0.2)' },
  declined: { color: '#f87171', bg: 'rgba(248,113,113,0.2)' },
  voided: { color: '#f87171', bg: 'rgba(248,113,113,0.2)' },
};

function StatusPill({ status }: { status: string | null | undefined }) {
  const { THEME } = useTheme();
  const s = (status ?? '').toLowerCase().trim();
  const match = PILL_COLORS[s];
  const color = match?.color ?? '#94a3b8';
  const bg = match?.bg ?? 'rgba(148,163,184,0.18)';
  const label = s || 'not sent';
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 6,
      background: bg, color, fontSize: 12, fontWeight: 600,
      border: `1px solid ${color}40`, textTransform: 'capitalize',
    }}>{label}</span>
  );
}

function deriveDocuSignStatus(envelopes: Array<{ status: string }>) {
  if (!envelopes || envelopes.length === 0) return null;
  if (envelopes.some(e => e.status === 'completed')) return 'completed';
  if (envelopes.some(e => e.status === 'delivered')) return 'delivered';
  if (envelopes.some(e => e.status === 'sent')) return 'sent';
  if (envelopes.some(e => e.status === 'declined')) return 'declined';
  if (envelopes.some(e => e.status === 'voided')) return 'voided';
  return envelopes[0].status;
}

function latestEnvelopeDate(envelopes: Array<{ statusChangedDateTime?: string; completedDateTime?: string; sentDateTime?: string }>) {
  let latest = '';
  for (const e of envelopes) {
    const d = e.completedDateTime || e.statusChangedDateTime || e.sentDateTime || '';
    if (d > latest) latest = d;
  }
  return latest ? new Date(latest).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ClientOnboardingTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  const { THEME } = useTheme();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1, 2, 3].map(i => <div key={i} style={{ height: 80, borderRadius: 10, background: 'rgba(91,106,113,0.06)', animation: 'shimmer 1.5s infinite' }} />)}
      </div>
    );
  }

  if (!data || data.error) {
    return <EmptyState message={data?.error || 'No client onboarding data available. Ensure transition data has been synced.'} />;
  }

  const { summary, clients, docusign_connected } = data;

  return (
    <>
      {/* DocuSign connection banner */}
      {!docusign_connected && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 20,
          background: THEME.colors.warningBg, border: `1px solid ${THEME.colors.warningBorder}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <span style={{ fontSize: 13, color: THEME.colors.warning, fontWeight: 500 }}>
            DocuSign not connected — showing sheet data only. Connect via Transitions page for signing status.
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Accounts" value={summary?.total_accounts ?? 0} color={THEME.colors.teal} />
        <StatCard label="IAAs Signed" value={summary?.iaa_signed ?? 0} color={THEME.colors.success} />
        <StatCard label="Paperwork Complete" value={summary?.paperwork_complete ?? 0} color={THEME.colors.success} />
        <StatCard label="Pending" value={summary?.pending ?? 0} color={THEME.colors.warning} />
      </div>

      {/* Client Table */}
      {(!clients || clients.length === 0) ? (
        <EmptyState message="No transition clients found for this advisor." />
      ) : (
        <Section title={`Transition Clients (${clients.length})`} icon="◎">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.colors.border}` }}>
                  {['Client Name', 'Account Type', 'Custodian', 'IAA Status', 'Paperwork', 'DocuSign', 'Last Updated'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: THEME.colors.textMuted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {clients.map((client: any, i: number) => {
                  const isExpanded = expandedRow === client.id;
                  const dsStatus = deriveDocuSignStatus(client.envelopes ?? []);
                  const iaaDisplayStatus = client.docusign_iaa_status || client.status_of_iaa;

                  return (
                    <>{/* Fragment for row + expansion */}
                      <tr
                        key={client.id}
                        onClick={() => setExpandedRow(isExpanded ? null : client.id)}
                        style={{
                          borderBottom: `1px solid ${THEME.colors.border}`,
                          background: isExpanded ? 'rgba(29,118,130,0.04)' : (i % 2 === 0 ? THEME.colors.surface : '#262626'),
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                      >
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, color: THEME.colors.text }}>
                            {[client.primary_first_name, client.primary_last_name].filter(Boolean).join(' ') || '—'}
                          </div>
                          {client.household_name && (
                            <div style={{ fontSize: 11, color: THEME.colors.textMuted, marginTop: 2 }}>{client.household_name}</div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', color: THEME.colors.textMuted }}>{client.account_type ?? '—'}</td>
                        <td style={{ padding: '10px 12px', color: THEME.colors.textMuted }}>{client.custodian ?? '—'}</td>
                        <td style={{ padding: '10px 12px' }}><StatusPill status={iaaDisplayStatus} /></td>
                        <td style={{ padding: '10px 12px' }}><StatusPill status={client.status_of_account_paperwork} /></td>
                        <td style={{ padding: '10px 12px' }}>
                          {docusign_connected ? <StatusPill status={dsStatus} /> : <span style={{ fontSize: 12, color: THEME.colors.textMuted }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: THEME.colors.textMuted }}>
                          {latestEnvelopeDate(client.envelopes ?? [])}
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {isExpanded && (
                        <tr key={`${client.id}-expand`} style={{ background: 'rgba(29,118,130,0.02)' }}>
                          <td colSpan={7} style={{ padding: '16px 20px' }}>
                            {/* Client details */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 20px', marginBottom: 16 }}>
                              {client.primary_email && (
                                <div>
                                  <span style={{ fontSize: 10, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</span>
                                  <p style={{ fontSize: 13, color: THEME.colors.teal }}>{client.primary_email}</p>
                                </div>
                              )}
                              {client.primary_phone && (
                                <div>
                                  <span style={{ fontSize: 10, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phone</span>
                                  <p style={{ fontSize: 13, color: THEME.colors.text }}>{client.primary_phone}</p>
                                </div>
                              )}
                              {client.fee_schedule && (
                                <div>
                                  <span style={{ fontSize: 10, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fee Schedule</span>
                                  <p style={{ fontSize: 13, color: THEME.colors.text }}>{client.fee_schedule}</p>
                                </div>
                              )}
                              {client.document_readiness && (
                                <div>
                                  <span style={{ fontSize: 10, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Doc Readiness</span>
                                  <p style={{ fontSize: 13, color: THEME.colors.text }}>{client.document_readiness}</p>
                                </div>
                              )}
                              {client.notes && (
                                <div style={{ gridColumn: 'span 4' }}>
                                  <span style={{ fontSize: 10, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes</span>
                                  <p style={{ fontSize: 13, color: THEME.colors.text, lineHeight: 1.5 }}>{client.notes}</p>
                                </div>
                              )}
                            </div>

                            {/* DocuSign envelope details */}
                            {!docusign_connected ? (
                              <div style={{ padding: '10px 14px', borderRadius: 6, background: THEME.colors.warningBg, border: `1px solid ${THEME.colors.warningBorder}` }}>
                                <span style={{ fontSize: 12, color: THEME.colors.warning }}>DocuSign not connected</span>
                              </div>
                            ) : (!client.envelopes || client.envelopes.length === 0) ? (
                              <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(91,106,113,0.04)', border: `1px solid ${THEME.colors.border}` }}>
                                <span style={{ fontSize: 12, color: THEME.colors.textMuted }}>No DocuSign envelopes found for this client</span>
                              </div>
                            ) : (
                              <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                  DocuSign Envelopes ({client.envelopes.length})
                                </p>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                  <thead>
                                    <tr style={{ borderBottom: `1px solid ${THEME.colors.border}` }}>
                                      {['Subject', 'Status', 'Sent', 'Completed'].map(h => (
                                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: THEME.colors.textMuted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {client.envelopes.map((env: any) => (
                                      <tr key={env.envelopeId} style={{ borderBottom: `1px solid ${THEME.colors.border}` }}>
                                        <td style={{ padding: '6px 10px', color: THEME.colors.text }}>{env.emailSubject || '—'}</td>
                                        <td style={{ padding: '6px 10px' }}><StatusPill status={env.status} /></td>
                                        <td style={{ padding: '6px 10px', color: THEME.colors.textMuted }}>
                                          {env.sentDateTime ? new Date(env.sentDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                                        </td>
                                        <td style={{ padding: '6px 10px', color: THEME.colors.textMuted }}>
                                          {env.completedDateTime ? new Date(env.completedDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>

                                {/* Signers for the first envelope */}
                                {client.envelopes[0]?.signers?.length > 0 && (
                                  <div style={{ marginTop: 10 }}>
                                    <p style={{ fontSize: 10, fontWeight: 600, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Signers</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                      {client.envelopes[0].signers.map((signer: any, si: number) => (
                                        <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', borderRadius: 4, background: 'rgba(91,106,113,0.04)' }}>
                                          <span style={{ fontSize: 12, color: THEME.colors.text, fontWeight: 500, flex: 1 }}>{signer.name}</span>
                                          <span style={{ fontSize: 11, color: THEME.colors.textMuted }}>{signer.email}</span>
                                          <StatusPill status={signer.signedDateTime ? 'signed' : signer.status} />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ADVISOR PROFILE PAGE
// ══════════════════════════════════════════════════════════════════════════════
// ProfileTab imported from types

export default function AdvisorProfilePage() {
  const { THEME } = useTheme();

  const params = useParams();
  const id = params.id as string;
  const { data, error, isLoading } = useSWR(id ? `/api/command-center/advisor/${id}` : null, fetcher);
  const { data: pipelineData } = useSWR('/api/command-center/pipeline', fetcher);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [extracted, setExtracted] = useState<Record<string, any> | null>(null);
  const [parseLoading, setParseLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showRawNote, setShowRawNote] = useState(false);

  // Parse pinned note with AI when data arrives
  const pinnedNoteBody = data?.pinnedNote?.body;
  useEffect(() => {
    if (!pinnedNoteBody || extracted || parseLoading) return;
    setParseLoading(true);
    fetch('/api/command-center/advisor/parse-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteBody: pinnedNoteBody }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.extracted) setExtracted(d.extracted);
        else setParseError(d.error || 'Failed to parse note');
      })
      .catch(() => setParseError('Failed to connect to AI'))
      .finally(() => setParseLoading(false));
  }, [pinnedNoteBody, extracted, parseLoading]);

  // Client onboarding data (conditional on deal name being available)
  const dealName = data?.deal?.properties?.dealname;
  const { data: clientsData, isLoading: clientsLoading } = useSWR(
    dealName ? `/api/command-center/advisor/${id}/clients?dealName=${encodeURIComponent(dealName)}` : null,
    fetcher,
  );

  if (isLoading) return <div style={{ padding: '60px 40px', color: THEME.colors.textMuted }}>Loading advisor profile...</div>;
  if (error || data?.error) return <div style={{ padding: '60px 40px', color: THEME.colors.error }}>Failed to load advisor data.</div>;

  const deal = { ...(data?.deal?.properties ?? {}), id: data?.deal?.id };
  const team = data?.team ?? null;
  const contact = data?.contact ?? null;
  const notes: Array<{ properties: { hs_note_body: string; hs_timestamp: string } }> = data?.notes ?? [];
  const engagements = data?.engagements ?? [];
  const allContacts = data?.allContacts ?? [];
  const stageId = deal.dealstage ?? '';
  const si = stageIndex(stageId);

  const rawNoteText = pinnedNoteBody
    ? pinnedNoteBody.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
    : null;

  const tabs: { key: ProfileTab; label: string; icon: string; color: string }[] = [
    { key: 'overview', label: 'Overview', icon: '◈', color: '#3B5A69' },
    { key: 'financials', label: 'Financials', icon: '▲', color: '#10b981' },
    { key: 'engagements', label: 'Engagements', icon: '◉', color: '#3b82f6' },
    { key: 'tech', label: 'Tech & Complexity', icon: '◎', color: '#8b5cf6' },
    { key: 'team', label: 'Team & Contacts', icon: '●', color: '#c8a951' },
    { key: 'tasks', label: 'Onboarding Tasks', icon: '✦', color: '#f59e0b' },
    { key: 'onboarding', label: 'Client Onboarding', icon: '◎', color: '#ef4444' },
  ];

  return (
    <div style={{ padding: '32px 40px', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" , fontVariantNumeric: 'tabular-nums', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Navigation: Back + Next Advisor */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Link href="/command-center/advisor-hub" style={{ fontSize: 13, color: THEME.colors.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          &larr; Back to Advisor Hub
        </Link>
        {(() => {
          if (!pipelineData?.deals) return null;
          const sorted = [...pipelineData.deals]
            .filter((d: { dealname?: string }) => d.dealname && !d.dealname.toLowerCase().includes('test'))
            .sort((a: { dealname: string }, b: { dealname: string }) => a.dealname.localeCompare(b.dealname));
          const idx = sorted.findIndex((d: { id: string }) => d.id === id);
          const next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : sorted[0];
          if (!next || next.id === id) return null;
          return (
            <Link href={`/command-center/advisor/${next.id}`} style={{ textDecoration: 'none', textAlign: 'right' }}>
              <span style={{ fontSize: 12, color: THEME.colors.textMuted, display: 'block' }}>Next Advisor &rarr;</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: THEME.colors.teal }}>{next.dealname}</span>
            </Link>
          );
        })()}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: THEME.colors.text, fontFamily: "'Inter', system-ui, sans-serif" , fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>
            {deal.dealname ?? 'Advisor Profile'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <StageBadge stageId={stageId} />
            {deal.current_firm__cloned_ && <span style={{ fontSize: 13, color: THEME.colors.textMuted }}>from {deal.current_firm__cloned_}</span>}
            {deal.firm_type && <span style={{ fontSize: 13, color: THEME.colors.textMuted }}>· {deal.firm_type}</span>}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            {contact?.email && <a href={`mailto:${contact.email}`} style={{ fontSize: 13, color: THEME.colors.teal, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>✉ {contact.email}</a>}
            {(contact?.phone || contact?.mobilephone) && <a href={`tel:${contact.phone || contact.mobilephone}`} style={{ fontSize: 13, color: THEME.colors.teal, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>☎ {contact.phone || contact.mobilephone}</a>}
            {(contact?.city || contact?.state) && <span style={{ fontSize: 13, color: THEME.colors.textMuted }}>{[contact.city, contact.state].filter(Boolean).join(', ')}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: THEME.colors.teal, fontFamily: "'Inter', system-ui, sans-serif" , fontVariantNumeric: 'tabular-nums' }}>
            {formatAUM(deal.transferable_aum || team?.transferable_aum)}
          </p>
          <p style={{ fontSize: 12, color: THEME.colors.textMuted }}>Transferable AUM</p>
        </div>
      </div>

      {/* Stage Progress */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {STAGE_ORDER.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= si ? THEME.colors.teal : THEME.colors.border, transition: 'background 0.3s' }} />
        ))}
      </div>

      {/* AI Status + Raw Note Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {parseLoading && (
            <span style={{ fontSize: 12, color: THEME.colors.teal, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, border: `2px solid ${THEME.colors.teal}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              AI extracting recruiter notes...
            </span>
          )}
          {parseError && <span style={{ fontSize: 12, color: THEME.colors.warning }}>Note parsing: {parseError}</span>}
          {extracted && !parseLoading && <span style={{ fontSize: 12, color: THEME.colors.success }}>✓ Recruiter notes parsed</span>}
          {!pinnedNoteBody && !parseLoading && <span style={{ fontSize: 12, color: THEME.colors.textMuted }}>No pinned note found</span>}
        </div>
        {rawNoteText && (
          <button onClick={() => setShowRawNote(!showRawNote)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, background: showRawNote ? THEME.colors.teal : THEME.colors.surface, color: showRawNote ? THEME.colors.textSecondary : THEME.colors.textMuted, border: `1px solid ${showRawNote ? THEME.colors.teal : THEME.colors.border}`, cursor: 'pointer' }}>
            {showRawNote ? 'Hide Raw Note' : 'View Raw Note'}
          </button>
        )}
      </div>

      {showRawNote && rawNoteText && (
        <div style={{ background: THEME.colors.surface, border: `1px solid ${THEME.colors.border}`, borderRadius: 10, padding: '20px 24px', marginBottom: 20, maxHeight: 500, overflowY: 'auto' }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Pinned Note (Raw)</h3>
          <pre style={{ fontSize: 13, color: THEME.colors.text, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: "'Inter', system-ui, sans-serif" , fontVariantNumeric: 'tabular-nums', margin: 0 }}>{rawNoteText}</pre>
        </div>
      )}

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${THEME.colors.border}`, marginBottom: 24 }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '10px 20px', background: 'none', border: 'none',
              borderBottom: `2px solid ${isActive ? tab.color : 'transparent'}`,
              marginBottom: -2, cursor: 'pointer', transition: 'all 150ms ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 14, color: tab.color, opacity: isActive ? 1 : 0.5 }}>{tab.icon}</span>
              <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? tab.color : THEME.colors.textMuted, fontFamily: "'Inter', system-ui, sans-serif" , fontVariantNumeric: 'tabular-nums' }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && <OverviewTab deal={deal} contact={contact} extracted={extracted} dealId={id} />}
      {activeTab === 'financials' && <FinancialsTab deal={deal} team={team} extracted={extracted} />}
      {activeTab === 'engagements' && <EngagementsTab engagements={engagements} extracted={extracted} notes={notes} />}
      {activeTab === 'tech' && <TechComplexityTab deal={deal} team={team} extracted={extracted} dealId={id} />}
      {activeTab === 'team' && <TeamContactsTab dealId={id} allContacts={allContacts} />}
      {activeTab === 'tasks' && <OnboardingTasksTab dealId={id} />}
      {activeTab === 'onboarding' && <ClientOnboardingTab data={clientsData} isLoading={clientsLoading} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes shimmer { 0% { opacity: 0.5; } 50% { opacity: 0.8; } 100% { opacity: 0.5; } }`}</style>
    </div>
  );
}
