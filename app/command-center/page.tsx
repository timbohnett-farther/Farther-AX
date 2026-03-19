'use client';

import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const C = {
  dark: '#333333', white: '#ffffff', slate: '#5b6a71',
  lightBlue: '#b6d0ed', teal: '#1d7682', bg: '#FAF7F2',
  cardBg: '#ffffff', border: '#e8e2d9',
};

const STAGE_LABELS: Record<string, string> = {
  '2496931':  'Step 1 – First Meeting',
  '2496932':  'Step 2 – Financial Model',
  '2496934':  'Step 3 – Advisor Demo',
  '100409509':'Step 4 – Discovery Day',
  '2496935':  'Step 5 – Offer Review',
  '2496936':  'Step 6 – Offer Accepted',
  '100411705':'Step 7 – Launched',
  '31214941': 'Holding Pattern',
  '2496937':  'Prospect Passed',
  '26572965': 'Farther Passed',
};

const ACTIVE_STAGE_IDS = ['2496931','2496932','2496934','100409509','2496935','2496936','100411705'];

function formatAUM(n: number | null | undefined): string {
  if (!n || isNaN(n)) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

interface Deal {
  id: string;
  dealname: string;
  transferable_aum: string | null;
  dealstage: string;
  current_firm__cloned_: string | null;
  custodian__cloned_: string | null;
  transition_type: string | null;
  firm_type: string | null;
  onboarder: string | null;
  transition_owner: string | null;
  desired_start_date: string | null;
  actual_launch_date: string | null;
  client_households: string | null;
  ownerName: string | null;
}

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? C.teal : C.cardBg,
      border: `1px solid ${accent ? C.teal : C.border}`,
      borderRadius: 8, padding: '20px 24px',
    }}>
      <p style={{ fontSize: 11, color: accent ? 'rgba(255,255,255,0.7)' : C.slate, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: accent ? C.white : C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: accent ? 'rgba(255,255,255,0.6)' : C.slate, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export default function PipelineDashboard() {
  const { data, error, isLoading } = useSWR('/api/command-center/pipeline', fetcher, { refreshInterval: 30_000 });

  if (isLoading) return (
    <div style={{ padding: '60px 40px', color: C.slate, fontFamily: "'Fakt', system-ui, sans-serif" }}>Loading pipeline…</div>
  );
  if (error || data?.error) return (
    <div style={{ padding: '60px 40px', color: '#c0392b' }}>Failed to load pipeline data.</div>
  );

  const deals: Deal[] = data?.deals ?? [];
  const activeDeals = deals.filter(d => ACTIVE_STAGE_IDS.includes(d.dealstage));
  const totalAUM = activeDeals.reduce((acc, d) => acc + parseFloat(d.transferable_aum ?? '0'), 0);
  const launchedDeals = deals.filter(d => d.dealstage === '100411705');

  const byStageCounts: Record<string, number> = {};
  for (const d of activeDeals) {
    byStageCounts[d.dealstage] = (byStageCounts[d.dealstage] ?? 0) + 1;
  }

  const STAGE_ORDER = ['2496931','2496932','2496934','100409509','2496935','2496936','100411705'];

  return (
    <div style={{ padding: '40px 40px', minHeight: '100vh', background: C.bg, fontFamily: "'Fakt', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 6 }}>
          Advisor Recruiting Pipeline
        </h1>
        <p style={{ color: C.slate, fontSize: 14 }}>
          Live HubSpot data · refreshes every 30s · {activeDeals.length} active deals
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <SummaryCard label="Total Pipeline AUM" value={formatAUM(totalAUM)} sub={`${activeDeals.length} active deals`} accent />
        <SummaryCard label="Active Deals" value={String(activeDeals.length)} sub="Steps 1–7" />
        <SummaryCard label="Launched" value={String(launchedDeals.length)} sub="Step 7" />
        <SummaryCard
          label="Avg Deal Size"
          value={activeDeals.length ? formatAUM(totalAUM / activeDeals.length) : '—'}
          sub="transferable AUM"
        />
      </div>

      {/* Stage Funnel Pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
        {STAGE_ORDER.map(stageId => {
          const count = byStageCounts[stageId] ?? 0;
          if (!count) return null;
          return (
            <div key={stageId} style={{
              padding: '5px 12px', borderRadius: 20,
              background: stageId === '100411705' ? 'rgba(29,118,130,0.15)' : 'rgba(91,106,113,0.08)',
              color: stageId === '100411705' ? C.teal : C.slate,
              fontSize: 12, fontWeight: 500,
            }}>
              {STAGE_LABELS[stageId]} · {count}
            </div>
          );
        })}
      </div>

      {/* Deals Table */}
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#f7f4ef' }}>
                {['Advisor / Deal', 'Prior Firm', 'Type', 'Custodian', 'Stage', 'Exp. AUM', 'Target Launch', 'Owner'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: C.slate, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeDeals.map((deal, i) => (
                <tr key={deal.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.cardBg : '#faf7f2' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <Link
                      href={`/command-center/advisor/${deal.id}`}
                      style={{ fontWeight: 600, color: C.teal, textDecoration: 'none' }}
                    >
                      {deal.dealname}
                    </Link>
                  </td>
                  <td style={{ padding: '10px 14px', color: C.slate }}>{deal.current_firm__cloned_ ?? '—'}</td>
                  <td style={{ padding: '10px 14px', color: C.slate }}>{deal.firm_type ?? '—'}</td>
                  <td style={{ padding: '10px 14px', color: C.slate }}>{deal.custodian__cloned_ || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                      background: deal.dealstage === '100411705' ? 'rgba(29,118,130,0.1)' : 'rgba(91,106,113,0.1)',
                      color: deal.dealstage === '100411705' ? C.teal : C.slate,
                    }}>
                      {STAGE_LABELS[deal.dealstage] ?? deal.dealstage}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: C.teal, fontWeight: 600 }}>
                    {formatAUM(parseFloat(deal.transferable_aum ?? '0'))}
                  </td>
                  <td style={{ padding: '10px 14px', color: C.slate }}>
                    {deal.desired_start_date
                      ? new Date(deal.desired_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: C.slate }}>{deal.ownerName ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
