'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const C = {
  dark: '#333333', white: '#ffffff', slate: '#5b6a71',
  lightBlue: '#b6d0ed', teal: '#1d7682', bg: '#FAF7F2',
  cardBg: '#ffffff', border: '#e8e2d9', amber: '#d97706',
  green: '#059669', red: '#dc2626',
};

const STAGE_LABELS: Record<string, string> = {
  '2496931': 'Step 1 – First Meeting',
  '2496932': 'Step 2 – Financial Model',
  '2496934': 'Step 3 – Advisor Demo',
  '100409509': 'Step 4 – Discovery Day',
  '2496935': 'Step 5 – Offer Review',
  '2496936': 'Step 6 – Offer Accepted',
  '100411705': 'Step 7 – Launched',
  '31214941': 'Holding Pattern',
  '2496937': 'Prospect Passed',
  '26572965': 'Farther Passed',
};

const STAGE_ORDER = ['2496931','2496932','2496934','100409509','2496935','2496936','100411705'];

function stageIndex(stageId: string) {
  return STAGE_ORDER.indexOf(stageId);
}

function formatAUM(n: string | number | null | undefined): string {
  const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  if (!v || isNaN(v)) return '—';
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
}

function formatPct(n: string | number | null | undefined): string {
  const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  if (!v || isNaN(v)) return '—';
  return `${v.toFixed(1)}%`;
}

function Section({ title, children, highlight }: { title: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div style={{
      background: C.cardBg, border: `1px solid ${highlight ? C.teal : C.border}`,
      borderRadius: 10, marginBottom: 20, overflow: 'hidden',
      boxShadow: highlight ? '0 0 0 1px rgba(29,118,130,0.2)' : undefined,
    }}>
      <div style={{
        padding: '12px 20px', borderBottom: `1px solid ${highlight ? 'rgba(29,118,130,0.15)' : C.border}`,
        background: highlight ? 'rgba(29,118,130,0.05)' : '#f7f4ef',
      }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: highlight ? C.teal : C.slate, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title}
        </h3>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  if (!value || value === '—') return null;
  return (
    <div style={{ marginBottom: 12, gridColumn: wide ? 'span 2' : undefined }}>
      <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 14, color: C.dark, lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}

function Grid({ children, cols = 3 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0 24px' }}>
      {children}
    </div>
  );
}

function IntelCard({ label, value, color }: { label: string; value: string; color: string }) {
  if (!value) return null;
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 8, border: `1px solid ${color}22`,
      background: `${color}08`, marginBottom: 12,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 13, color: C.dark, lineHeight: 1.6 }}>{value}</p>
    </div>
  );
}

function TechBadge({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '4px 10px', borderRadius: 6,
      background: 'rgba(29,118,130,0.1)', color: C.teal,
      fontSize: 12, fontWeight: 500, marginRight: 6, marginBottom: 6,
    }}>{label}</span>
  );
}

function StageBadge({ stageId }: { stageId: string }) {
  const isLate = ['2496936','100411705'].includes(stageId);
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: 20,
      background: isLate ? 'rgba(29,118,130,0.15)' : 'rgba(91,106,113,0.1)',
      color: isLate ? C.teal : C.slate, fontSize: 12, fontWeight: 600,
    }}>
      {STAGE_LABELS[stageId] ?? stageId}
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TechStackSection({ deal, team }: { deal: Record<string, any>; team: Record<string, any> | null }) {
  const crm = team?.crm_platform || deal.crm_platform__cloned_;
  const fp = team?.financial_planning_platform || deal.financial_planning_platform__cloned_;
  const perf = team?.performance_platform || deal.performance_platform__cloned_;
  const tamp = team?.tamp;
  const other = team?.technology_platforms_being_used || deal.technology_platforms_being_used__cloned_;
  const notes = team?.additional_tech_stack_notes;
  const investments = team?.investment_products;

  const hasTechData = crm || fp || perf || tamp || other || notes;
  if (!hasTechData) return null;

  return (
    <Section title="Tech Stack" highlight>
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: other || notes ? 12 : 0 }}>
        {crm && <span style={{ marginRight: 16, marginBottom: 8 }}><span style={{ fontSize: 11, color: C.slate }}>CRM · </span><TechBadge label={crm} /></span>}
        {fp && <span style={{ marginRight: 16, marginBottom: 8 }}><span style={{ fontSize: 11, color: C.slate }}>Financial Planning · </span><TechBadge label={fp} /></span>}
        {perf && <span style={{ marginRight: 16, marginBottom: 8 }}><span style={{ fontSize: 11, color: C.slate }}>Performance · </span><TechBadge label={perf} /></span>}
        {tamp && <span style={{ marginRight: 16, marginBottom: 8 }}><span style={{ fontSize: 11, color: C.slate }}>TAMP · </span><TechBadge label={tamp} /></span>}
        {investments && <span style={{ marginRight: 16, marginBottom: 8 }}><span style={{ fontSize: 11, color: C.slate }}>Investment Products · </span><TechBadge label={investments} /></span>}
      </div>
      {other && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 11, color: C.slate, marginBottom: 4 }}>ALL PLATFORMS</p>
          <p style={{ fontSize: 13, color: C.dark, lineHeight: 1.6 }}>{other}</p>
        </div>
      )}
      {notes && (
        <div>
          <p style={{ fontSize: 11, color: C.slate, marginBottom: 4 }}>ADDITIONAL NOTES</p>
          <p style={{ fontSize: 13, color: C.dark, lineHeight: 1.6 }}>{notes}</p>
        </div>
      )}
    </Section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AdvisorIntelSection({ deal }: { deal: Record<string, any> }) {
  const hasIntel = deal.advisor_pain_points || deal.advisor_top_care_abouts || deal.advisor_goals || deal.advisor_go_to_market_strategy;
  if (!hasIntel) return null;
  return (
    <Section title="Advisor Intel" highlight>
      <IntelCard label="Pain Points / Concerns" value={deal.advisor_pain_points} color={C.amber} />
      <IntelCard label="Top Care Abouts" value={deal.advisor_top_care_abouts} color={C.teal} />
      <IntelCard label="Goals" value={deal.advisor_goals} color={C.green} />
      <IntelCard label="Go-to-Market Strategy" value={deal.advisor_go_to_market_strategy} color={C.slate} />
    </Section>
  );
}

export default function AdvisorReportCard() {
  const params = useParams();
  const id = params.id as string;
  const { data, error, isLoading } = useSWR(id ? `/api/command-center/advisor/${id}` : null, fetcher);

  if (isLoading) return <div style={{ padding: '60px 40px', color: C.slate }}>Loading advisor profile…</div>;
  if (error || data?.error) return <div style={{ padding: '60px 40px', color: C.red }}>Failed to load advisor data.</div>;

  const deal = { ...(data?.deal?.properties ?? {}), id: data?.deal?.id };
  const team = data?.team ?? null;
  const notes: Array<{ properties: { hs_note_body: string; hs_timestamp: string } }> = data?.notes ?? [];
  const stageId = deal.dealstage ?? '';
  const si = stageIndex(stageId);

  const atLeast = (stage: string) => si >= stageIndex(stage);

  return (
    <div style={{ padding: '32px 40px', minHeight: '100vh', background: C.bg, fontFamily: "'Fakt', system-ui, sans-serif" }}>
      {/* Back */}
      <Link href="/command-center" style={{ fontSize: 13, color: C.slate, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        ← Back to Pipeline
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 8 }}>
            {deal.dealname ?? 'Advisor Profile'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <StageBadge stageId={stageId} />
            {deal.current_firm__cloned_ && <span style={{ fontSize: 13, color: C.slate }}>from {deal.current_firm__cloned_}</span>}
            {deal.firm_type && <span style={{ fontSize: 13, color: C.slate }}>· {deal.firm_type}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: C.teal, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
            {formatAUM(deal.transferable_aum || team?.transferable_aum)}
          </p>
          <p style={{ fontSize: 12, color: C.slate }}>Transferable AUM</p>
        </div>
      </div>

      {/* Stage Progress Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
        {STAGE_ORDER.map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= si ? C.teal : C.border,
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* STAGE 1+: Basic Info */}
      <Section title="Advisor Overview">
        <Grid>
          <Field label="Deal Name" value={deal.dealname} />
          <Field label="Prior Firm" value={deal.current_firm__cloned_} />
          <Field label="Firm Type" value={deal.firm_type} />
          <Field label="Custodian" value={deal.custodian__cloned_ || team?.custodian} />
          <Field label="IBD" value={deal.ibd} />
          <Field label="Lead Source" value={deal.advisor_recruiting_lead_source} />
          <Field label="Referred By" value={deal.referred_by__cloned_} />
          <Field label="Deal Owner" value={deal.hubspot_owner_id} />
          <Field label="Target Launch" value={deal.desired_start_date ? new Date(deal.desired_start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null} />
          {deal.actual_launch_date && <Field label="Actual Launch" value={new Date(deal.actual_launch_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />}
        </Grid>
      </Section>

      {/* STAGE 2+: Book Analysis */}
      {atLeast('2496932') && (
        <Section title="Book Analysis">
          <Grid>
            <Field label="Transferable AUM" value={formatAUM(deal.transferable_aum || team?.transferable_aum)} />
            <Field label="Total AUM" value={formatAUM(deal.aum || team?.aum)} />
            <Field label="T12 Revenue" value={formatAUM(deal.t12_revenue || team?.t12_revenue)} />
            <Field label="Fee-Based Revenue" value={formatAUM(deal.fee_based_revenue || team?.fee_based_revenue)} />
            <Field label="Transferable Revenue" value={formatAUM(deal.expected_revenue || team?.transferable_revenue)} />
            <Field label="BD Revenue" value={formatAUM(deal.broker_dealer_revenue || team?.broker_dealer_revenue)} />
            <Field label="Insurance/Annuity Rev" value={formatAUM(deal.insurance_annuity_revenue || team?.insurance_annuity_revenue)} />
            <Field label="401k AUM" value={formatAUM(deal.n401k_aum || team?.n401k_aum)} />
            <Field label="Avg Fee Rate" value={formatPct(team?.average_fee_rate)} />
            <Field label="Client Households" value={deal.client_households || team?.client_households} />
            <Field label="Transferable HH" value={deal.transferable_households || team?.transferable_households} />
            <Field label="Avg HH Assets" value={formatAUM(deal.average_household_assets || team?.average_household_assets)} />
            <Field label="Largest Client" value={formatAUM(team?.largest_client_assets)} />
            <Field label="People" value={deal.people || team?.people} />
            <Field label="Book Acquired %" value={formatPct(team?.book_acquired___inherited__)} />
          </Grid>
        </Section>
      )}

      {/* STAGE 3+: Tech Stack + Advisor Intel (PROMINENT) */}
      {atLeast('2496934') && (
        <>
          <AdvisorIntelSection deal={deal} />
          <TechStackSection deal={deal} team={team} />
        </>
      )}

      {/* STAGE 4+: Team & Compensation */}
      {atLeast('100409509') && (
        <Section title="Team & Compensation">
          <Grid>
            <Field label="Total People" value={team?.people} />
            <Field label="Support Staff" value={team?.support_staff} />
            <Field label="Partners/Owners" value={team?.total_number_of_owners_or_partners} />
            <Field label="Payout Rate" value={formatPct(team?.payout_rate)} />
            <Field label="Effective Payout" value={formatPct(team?.effective_payout_rate)} />
            <Field label="Annualized Income" value={formatAUM(team?.annualized_income)} />
            <Field label="Annualized Expenses" value={formatAUM(team?.annualized_expenses)} />
            <Field label="Marketing Expense" value={formatAUM(team?.marketing_expense)} />
            <Field label="Office Expense" value={formatAUM(team?.office_expense)} />
            <Field label="Advisor Debt" value={formatAUM(deal.advisor_debt || team?.advisor_debt)} />
            <Field label="Employment Contract" value={team?.employment_contract} />
            <Field label="Restrictive Covenants" value={team?.restrictive_covenants} />
          </Grid>
          {(team?.obas__yes_no || team?.outside_business_activities) && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: `${C.amber}10`, border: `1px solid ${C.amber}33`, borderRadius: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.amber, marginBottom: 4 }}>OBAs</p>
              <p style={{ fontSize: 13, color: C.dark }}>{team?.obas__yes_no} · {team?.outside_business_activities}</p>
            </div>
          )}
        </Section>
      )}

      {/* STAGE 5+: Deal Structure */}
      {atLeast('2496935') && (
        <Section title="Deal Structure & Process">
          <Grid>
            <Field label="Transition Type" value={deal.transition_type || team?.transition_type} />
            <Field label="Onboarding Custodian" value={deal.onboarding_custodian__select_all_that_apply_} />
            <Field label="Transition Owner" value={deal.transition_owner} />
            <Field label="Onboarder" value={deal.onboarder} />
            <Field label="Prior Transitions" value={deal.prior_transitions || team?.prior_transitions} />
          </Grid>
          {(deal.transition_notes || deal.prior_transitions_notes || team?.prior_transitions_notes) && (
            <Field label="Transition Notes" value={deal.transition_notes || deal.prior_transitions_notes || team?.prior_transitions_notes} wide />
          )}
        </Section>
      )}

      {/* STAGE 6+: Full financials + notes */}
      {atLeast('2496936') && (
        <>
          {team && (
            <Section title="Historical Performance">
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

          {deal.description && (
            <Section title="Deal Description / Notes">
              <p style={{ fontSize: 14, color: C.dark, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{deal.description}</p>
            </Section>
          )}
        </>
      )}

      {/* Notes (all stages — most recent HubSpot notes) */}
      {notes.length > 0 && (
        <Section title={`HubSpot Notes (${notes.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {notes.slice(0, 5).map((note, i) => (
              <div key={i} style={{ borderBottom: i < Math.min(notes.length, 5) - 1 ? `1px solid ${C.border}` : 'none', paddingBottom: i < Math.min(notes.length, 5) - 1 ? 16 : 0 }}>
                <p style={{ fontSize: 11, color: C.slate, marginBottom: 6 }}>
                  {note.properties.hs_timestamp
                    ? new Date(note.properties.hs_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Date unknown'}
                </p>
                <p style={{ fontSize: 13, color: C.dark, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {note.properties.hs_note_body?.replace(/<[^>]+>/g, '') ?? ''}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
