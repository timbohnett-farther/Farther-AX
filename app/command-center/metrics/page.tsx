'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const C = {
  dark: '#333333', white: '#ffffff', slate: '#5b6a71',
  lightBlue: '#b6d0ed', teal: '#1d7682', bg: '#FAF7F2',
  cardBg: '#ffffff', border: '#e8e2d9',
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

function formatAUM(n: number): string {
  if (!n || isNaN(n)) return '$0';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? C.teal : C.cardBg,
      border: `1px solid ${accent ? C.teal : C.border}`,
      borderRadius: 8, padding: '20px 24px',
    }}>
      <p style={{ fontSize: 11, color: accent ? 'rgba(255,255,255,0.7)' : C.slate, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color: accent ? C.white : C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: accent ? 'rgba(255,255,255,0.6)' : C.slate, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function BarRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <span style={{ width: 200, fontSize: 13, color: C.dark, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: '#e8e2d9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 12, color: C.slate, minWidth: 50, textAlign: 'right' }}>{count} ({pct}%)</span>
    </div>
  );
}

export default function MetricsDashboard() {
  const { data, error, isLoading } = useSWR('/api/command-center/metrics', fetcher, { refreshInterval: 43_200_000 });

  if (isLoading) return <div style={{ padding: '60px 40px', color: C.slate }}>Loading metrics…</div>;
  if (error || data?.error) return <div style={{ padding: '60px 40px', color: '#c0392b' }}>Failed to load metrics.</div>;

  const m = data ?? {};
  const cap = m.capacity ?? {};
  const avgAUMPerStaff = cap.totalAUM && cap.axmCount ? cap.totalAUM / cap.axmCount : 0;

  const transitionTotal = Object.values((m.transitionBreakdown ?? {}) as Record<string, number>).reduce((a, b) => a + b, 0);
  const stageTotal = Object.values((m.stageBreakdown ?? {}) as Record<string, number>).reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: '40px 40px', minHeight: '100vh', background: C.bg, fontFamily: "'Fakt', system-ui, sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 6 }}>
          AX Metrics
        </h1>
        <p style={{ color: C.slate, fontSize: 14 }}>Live pipeline metrics · refreshes every 30s</p>
      </div>

      {/* Team Capacity */}
      <h2 style={{ fontSize: 12, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Team Capacity</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <MetricCard label="AXM/AXA Staff" value={String(cap.axmCount ?? 9)} sub="managing onboarding" />
        <MetricCard label="Total AUM" value={formatAUM(cap.totalAUM ?? 15e9)} sub="under management" accent />
        <MetricCard label="Advisors" value={String(cap.advisorCount ?? 240)} sub="Farther platform" />
        <MetricCard label="AUM per Staff" value={formatAUM(avgAUMPerStaff)} sub="avg load" />
      </div>

      {/* Onboarded AUM */}
      <h2 style={{ fontSize: 12, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Onboarded AUM</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <MetricCard label="This Month" value={formatAUM(m.onboardedThisMonth?.aum ?? 0)} sub={`${m.onboardedThisMonth?.count ?? 0} advisors`} />
        <MetricCard label="This Quarter" value={formatAUM(m.onboardedThisQuarter?.aum ?? 0)} sub={`${m.onboardedThisQuarter?.count ?? 0} advisors`} />
        <MetricCard label="This Year" value={formatAUM(m.onboardedThisYear?.aum ?? 0)} sub={`${m.onboardedThisYear?.count ?? 0} advisors`} accent />
      </div>

      {/* Pipeline AUM */}
      <h2 style={{ fontSize: 12, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Upcoming Pipeline AUM</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <MetricCard label="Next 30 Days" value={formatAUM(m.pipeline30?.aum ?? 0)} sub={`${m.pipeline30?.count ?? 0} expected`} />
        <MetricCard label="Next 60 Days" value={formatAUM(m.pipeline60?.aum ?? 0)} sub={`${m.pipeline60?.count ?? 0} expected`} />
        <MetricCard label="Next 90 Days" value={formatAUM(m.pipeline90?.aum ?? 0)} sub={`${m.pipeline90?.count ?? 0} expected`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Transition Type Breakdown */}
        {m.transitionBreakdown && Object.keys(m.transitionBreakdown).length > 0 && (
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 24px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 16 }}>Transition Type Breakdown</h3>
            {Object.entries(m.transitionBreakdown as Record<string, number>)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <BarRow key={type} label={type || 'Not set'} count={count} total={transitionTotal} color={C.teal} />
              ))}
          </div>
        )}

        {/* Stage Breakdown */}
        {m.stageBreakdown && (
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 24px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 16 }}>Pipeline by Stage</h3>
            {Object.entries(m.stageBreakdown as Record<string, number>)
              .sort((a, b) => {
                const order = ['2496931','2496932','2496934','100409509','2496935','2496936','100411705','31214941','2496937','26572965'];
                return order.indexOf(a[0]) - order.indexOf(b[0]);
              })
              .map(([stageId, count]) => (
                <BarRow
                  key={stageId}
                  label={STAGE_LABELS[stageId] ?? stageId}
                  count={count}
                  total={stageTotal}
                  color={stageId === '100411705' ? C.teal : C.lightBlue}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
