'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';

/* ── Design tokens ────────────────────────────────────────── */
const C = {
  dark: '#333333', white: '#ffffff', slate: '#5b6a71',
  teal: '#1d7682', bg: '#FAF7F2',
  cardBg: '#ffffff', border: '#e8e2d9',
  red: '#c0392b', redBg: 'rgba(192,57,43,0.08)',
  amber: '#b27d2e', amberBg: 'rgba(178,125,46,0.08)',
  green: '#27ae60', greenBg: 'rgba(39,174,96,0.10)',
  tealBg: 'rgba(29,118,130,0.08)',
};

const font = { serif: "'ABC Arizona Text', Georgia, serif", sans: "'Fakt', system-ui, sans-serif" };

/* ── Types ────────────────────────────────────────────────── */
interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  yearsInIndustry: string | null;
  licenses: string | null;
}

interface Note { id: string; body: string; timestamp: string | null; }
interface Call { id: string; title: string | null; body: string; status: string | null; timestamp: string | null; duration: string | null; recordingUrl: string | null; }
interface Email { id: string; subject: string | null; body: string; direction: string | null; timestamp: string | null; }

interface Deal {
  id: string;
  properties: Record<string, string | null>;
  stageLabel: string;
  contacts: Contact[];
  notes: Note[];
  calls: Call[];
  emails: Email[];
  team: Record<string, string | null> | null;
}

interface EmailTemplate { key: string; label: string; subject: string; }

type SummaryType = 'briefing' | 'activities' | 'emails' | 'engagements';
type DealTab = 'overview' | 'briefing' | 'activities' | 'emails' | 'engagements' | 'compose' | 'drive';

/* ── Helpers ──────────────────────────────────────────────── */
const fetcher = (url: string) => fetch(url).then(r => r.json());
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtAum = (v: string | null) => v ? `$${(parseFloat(v) / 1e6).toFixed(0)}M` : '—';
const contactName = (c: Contact) => [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unknown';

/* ── Pill / Badge ─────────────────────────────────────────── */
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: bg, color }}>
      {label}
    </span>
  );
}

/* ── Field ────────────────────────────────────────────────── */
function Field({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  if (!value || value === '—') return null;
  return (
    <div style={{ marginBottom: 12, gridColumn: wide ? 'span 2' : undefined }}>
      <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 14, color: C.dark, lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}

/* ── Tab Button ───────────────────────────────────────────── */
function TabBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 150ms',
      background: active ? C.teal : 'transparent', color: active ? C.white : C.slate,
    }}>
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   AI Summary Panel
   ═══════════════════════════════════════════════════════════ */
function SummaryPanel({ deal, summaryType }: { deal: Deal; summaryType: SummaryType }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch('/api/command-center/ria-hub/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryType,
          deal: { ...deal.properties, stageLabel: deal.stageLabel },
          contacts: deal.contacts,
          notes: deal.notes,
          calls: deal.calls,
          emails: deal.emails,
          team: deal.team,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setLoading(false);
    }
  }, [deal, summaryType]);

  const labels: Record<SummaryType, string> = {
    briefing: 'Relationship Briefing',
    activities: 'Activity Summary',
    emails: 'Email Digest',
    engagements: 'Engagement Overview',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{labels[summaryType]}</h4>
        <button onClick={generate} disabled={loading} style={{
          padding: '5px 14px', borderRadius: 5, fontSize: 12, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          background: C.teal, color: C.white, opacity: loading ? 0.6 : 1,
        }}>
          {loading ? 'Generating…' : summary ? 'Regenerate' : 'Generate with AI'}
        </button>
      </div>
      {error && <p style={{ fontSize: 13, color: C.red, marginBottom: 12 }}>{error}</p>}
      {summary ? (
        <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.7, whiteSpace: 'pre-wrap', background: C.tealBg, borderRadius: 8, padding: '14px 18px', borderLeft: `3px solid ${C.teal}` }}>
          {summary}
        </div>
      ) : !loading ? (
        <p style={{ fontSize: 13, color: C.slate, fontStyle: 'italic' }}>Click &ldquo;Generate with AI&rdquo; to create an AI-powered {labels[summaryType].toLowerCase()} for this advisor.</p>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Email Composer
   ═══════════════════════════════════════════════════════════ */
function EmailComposer({ deal }: { deal: Deal }) {
  const { data: templateData } = useSWR<{ templates: EmailTemplate[] }>('/api/command-center/ria-hub/email', fetcher);
  const templates = templateData?.templates ?? [];

  const primaryContact = deal.contacts[0];
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  const applyTemplate = (key: string) => {
    setSelectedTemplate(key);
    setResult(null);
    if (!key) { setSubject(''); setBody(''); return; }
    const t = templates.find(t => t.key === key);
    if (t) {
      setSubject(t.subject
        .replace(/\{\{dealName\}\}/g, deal.properties.dealname || '')
        .replace(/\{\{firstName\}\}/g, primaryContact?.firstName || '')
      );
      setBody(`[Template: ${t.label}]\n\nVariables will be auto-filled when sent.`);
    }
  };

  const send = async () => {
    if (!primaryContact?.email) { setResult({ error: 'No contact email available' }); return; }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/command-center/ria-hub/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          contactId: primaryContact.id,
          contactEmail: primaryContact.email,
          templateKey: selectedTemplate || undefined,
          customSubject: !selectedTemplate ? subject : undefined,
          customBody: !selectedTemplate ? body : undefined,
          templateVars: {
            firstName: primaryContact.firstName || '',
            dealName: deal.properties.dealname || '',
            stage: deal.stageLabel,
            launchDate: deal.properties.desired_start_date || deal.properties.actual_launch_date || 'TBD',
            transitionType: deal.properties.transition_type || 'Standard',
            senderName: 'Farther AX Team',
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult({ success: true });
      setSubject('');
      setBody('');
      setSelectedTemplate('');
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Send failed' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h4 style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 12 }}>Email Composer</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* To */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, marginBottom: 4, display: 'block' }}>To</label>
          <p style={{ fontSize: 13, color: C.slate, padding: '8px 12px', background: '#f7f4ef', borderRadius: 6 }}>
            {primaryContact ? `${contactName(primaryContact)} <${primaryContact.email || 'no email'}>` : 'No contacts available'}
          </p>
        </div>

        {/* Template Picker */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, marginBottom: 4, display: 'block' }}>Template</label>
          <select value={selectedTemplate} onChange={e => applyTemplate(e.target.value)} style={{
            width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: font.sans, background: C.white,
          }}>
            <option value="">Custom Email</option>
            {templates.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, marginBottom: 4, display: 'block' }}>Subject</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject…" style={{
            width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: font.sans,
          }} />
        </div>

        {/* Body */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, marginBottom: 4, display: 'block' }}>Body</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} placeholder="Write your email here…" style={{
            width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: font.sans, resize: 'vertical', lineHeight: 1.6,
          }} />
        </div>

        {/* Send */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={send} disabled={sending || (!selectedTemplate && (!subject || !body))} style={{
            padding: '8px 20px', background: C.teal, color: C.white, border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600,
            cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.6 : 1,
          }}>
            {sending ? 'Sending…' : 'Send Email'}
          </button>
          {result?.success && <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>Sent successfully!</span>}
          {result?.error && <span style={{ fontSize: 12, color: C.red }}>{result.error}</span>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Drive Link Manager
   ═══════════════════════════════════════════════════════════ */
function DriveLinkPanel({ dealId }: { dealId: string }) {
  const { data, mutate } = useSWR<{ link: { folder_url: string; folder_name: string; updated_by: string; updated_at: string } | null }>(
    `/api/command-center/ria-hub/drive-link?dealId=${dealId}`, fetcher
  );
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!url) return;
    setSaving(true);
    await fetch('/api/command-center/ria-hub/drive-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId, folderUrl: url, folderName: name || 'Advisor Folder' }),
    });
    mutate();
    setSaving(false);
    setUrl('');
    setName('');
  };

  const remove = async () => {
    await fetch(`/api/command-center/ria-hub/drive-link?dealId=${dealId}`, { method: 'DELETE' });
    mutate();
  };

  const link = data?.link;

  return (
    <div>
      <h4 style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 12 }}>Shared Drive Folder</h4>
      {link ? (
        <div style={{ background: C.tealBg, borderRadius: 8, padding: '14px 18px', borderLeft: `3px solid ${C.teal}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <a href={link.folder_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: C.teal, textDecoration: 'none' }}>
              ↗ {link.folder_name}
            </a>
            <button onClick={remove} style={{ fontSize: 11, color: C.red, background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
          </div>
          <p style={{ fontSize: 11, color: C.slate }}>Updated by {link.updated_by} on {fmtDate(link.updated_at)}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="Google Drive folder URL…" style={{
            width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: font.sans,
          }} />
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Folder name (optional)" style={{
            width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: font.sans,
          }} />
          <button onClick={save} disabled={saving || !url} style={{
            padding: '8px 16px', background: C.teal, color: C.white, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving || !url ? 0.5 : 1, alignSelf: 'flex-start',
          }}>
            {saving ? 'Saving…' : 'Save Link'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Overview Tab (contacts, notes, calls, recent emails)
   ═══════════════════════════════════════════════════════════ */
function OverviewTab({ deal }: { deal: Deal }) {
  const p = deal.properties;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Transferable AUM', value: fmtAum(p.transferable_aum) },
          { label: 'Households', value: p.client_households || p.transferable_households || '—' },
          { label: 'T12 Revenue', value: p.t12_revenue ? `$${(parseFloat(p.t12_revenue) / 1e3).toFixed(0)}K` : '—' },
          { label: 'Target Launch', value: fmtDate(p.desired_start_date) },
        ].map(m => (
          <div key={m.label} style={{ background: '#f7f4ef', borderRadius: 8, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{m.label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: C.dark, fontFamily: font.serif }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 24px' }}>
        <Field label="Prior Firm" value={p.current_firm__cloned_} />
        <Field label="Firm Type" value={p.firm_type} />
        <Field label="Custodian" value={p.custodian__cloned_} />
        <Field label="Transition Type" value={p.transition_type} />
        <Field label="CRM Platform" value={p.crm_platform__cloned_} />
        <Field label="Financial Planning" value={p.financial_planning_platform__cloned_} />
        <Field label="Lead Source" value={p.advisor_recruiting_lead_source} />
        <Field label="Referred By" value={p.referred_by__cloned_} />
        <Field label="Actual Launch" value={fmtDate(p.actual_launch_date)} />
        <Field label="Pain Points" value={p.advisor_pain_points} wide />
        <Field label="Goals" value={p.advisor_goals} />
        <Field label="Care Abouts" value={p.advisor_top_care_abouts} wide />
      </div>

      {/* Contacts */}
      {deal.contacts.length > 0 && (
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 8 }}>Contacts</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {deal.contacts.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#f7f4ef', borderRadius: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.teal, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {(c.firstName || '?')[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{contactName(c)}</p>
                  <p style={{ fontSize: 11, color: C.slate }}>{[c.jobTitle, c.email, c.phone].filter(Boolean).join(' · ')}</p>
                </div>
                {c.yearsInIndustry && <Badge label={`${c.yearsInIndustry}yr`} color={C.teal} bg={C.tealBg} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Notes */}
      {deal.notes.length > 0 && (
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 8 }}>Recent Notes ({deal.notes.length})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {deal.notes.slice(0, 5).map(n => (
              <div key={n.id} style={{ padding: '10px 14px', background: '#f7f4ef', borderRadius: 6, borderLeft: `2px solid ${C.border}` }}>
                <p style={{ fontSize: 11, color: C.slate, marginBottom: 4 }}>{fmtDate(n.timestamp)}</p>
                <p style={{ fontSize: 13, color: C.dark, lineHeight: 1.5 }}>{n.body.slice(0, 400)}{n.body.length > 400 ? '…' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Deal Card (expandable)
   ═══════════════════════════════════════════════════════════ */
function DealCard({ deal, expanded, onToggle }: { deal: Deal; expanded: boolean; onToggle: () => void }) {
  const [tab, setTab] = useState<DealTab>('overview');
  const p = deal.properties;
  const primaryContact = deal.contacts[0];
  const isLaunched = deal.stageLabel.includes('Step 7');

  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', transition: 'box-shadow 150ms', boxShadow: expanded ? '0 2px 12px rgba(0,0,0,0.06)' : 'none' }}>
      {/* Header — always visible */}
      <div onClick={onToggle} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: isLaunched ? C.greenBg : C.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: isLaunched ? C.green : C.teal, flexShrink: 0 }}>
            {(p.dealname || '?')[0]}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.dark, fontFamily: font.serif }}>{p.dealname || 'Unknown'}</p>
            <p style={{ fontSize: 12, color: C.slate }}>
              {[p.current_firm__cloned_, primaryContact ? contactName(primaryContact) : null].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge label={fmtAum(p.transferable_aum)} color={C.dark} bg="#f7f4ef" />
          <Badge label={deal.stageLabel.replace('Step ', 'S').split(' – ')[0]} color={isLaunched ? C.green : C.teal} bg={isLaunched ? C.greenBg : C.tealBg} />
          <span style={{ fontSize: 12, color: C.slate, transition: 'transform 150ms', transform: expanded ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▼</span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          {/* Tabs */}
          <div style={{ padding: '10px 20px', display: 'flex', gap: 4, background: '#f7f4ef', flexWrap: 'wrap' }}>
            {[
              { key: 'overview' as const, label: 'Overview' },
              { key: 'briefing' as const, label: 'AI Briefing' },
              { key: 'activities' as const, label: 'Activities' },
              { key: 'emails' as const, label: 'Email Digest' },
              { key: 'engagements' as const, label: 'Engagements' },
              { key: 'compose' as const, label: 'Compose' },
              { key: 'drive' as const, label: 'Drive' },
            ].map(t => <TabBtn key={t.key} active={tab === t.key} label={t.label} onClick={() => setTab(t.key)} />)}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '20px 24px' }}>
            {tab === 'overview' && <OverviewTab deal={deal} />}
            {tab === 'briefing' && <SummaryPanel deal={deal} summaryType="briefing" />}
            {tab === 'activities' && <SummaryPanel deal={deal} summaryType="activities" />}
            {tab === 'emails' && <SummaryPanel deal={deal} summaryType="emails" />}
            {tab === 'engagements' && <SummaryPanel deal={deal} summaryType="engagements" />}
            {tab === 'compose' && <EmailComposer deal={deal} />}
            {tab === 'drive' && <DriveLinkPanel dealId={deal.id} />}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */
export default function RiaHubPage() {
  const { data, error, isLoading } = useSWR<{ deals: Deal[] }>('/api/command-center/ria-hub', fetcher, { refreshInterval: 300_000 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'step6' | 'step7'>('all');

  if (isLoading) return (
    <div style={{ padding: '80px 40px', color: C.slate, fontFamily: font.sans }}>
      <p style={{ fontSize: 14 }}>Loading advisor relationships…</p>
    </div>
  );

  if (error || !data) return (
    <div style={{ padding: '80px 40px', color: C.red, fontFamily: font.sans }}>
      <p style={{ fontSize: 14 }}>Failed to load advisor data. Please try again.</p>
    </div>
  );

  const deals = data.deals ?? [];

  // Filter
  const filtered = deals.filter(d => {
    const q = search.toLowerCase();
    const matchesSearch = !q || [
      d.properties.dealname,
      d.contacts[0]?.firstName,
      d.contacts[0]?.lastName,
      d.contacts[0]?.email,
      d.properties.current_firm__cloned_,
    ].some(v => v?.toLowerCase().includes(q));

    const matchesStage = stageFilter === 'all'
      || (stageFilter === 'step6' && d.stageLabel.includes('Step 6'))
      || (stageFilter === 'step7' && d.stageLabel.includes('Step 7'));

    return matchesSearch && matchesStage;
  });

  const step6 = deals.filter(d => d.stageLabel.includes('Step 6')).length;
  const step7 = deals.filter(d => d.stageLabel.includes('Step 7')).length;

  return (
    <div style={{ padding: '40px 40px', minHeight: '100vh', background: C.bg, fontFamily: font.sans }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: font.serif, marginBottom: 6 }}>
            RIA Hub
          </h1>
          <p style={{ color: C.slate, fontSize: 14 }}>
            Relationship intelligence for advisors in onboarding — AI briefings, communications, and collaboration tools.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Advisors', value: deals.length, color: C.teal, bg: C.tealBg },
          { label: 'Offer Accepted', value: step6, color: C.amber, bg: C.amberBg },
          { label: 'Launched', value: step7, color: C.green, bg: C.greenBg },
          { label: 'Contacts', value: deals.reduce((s, d) => s + d.contacts.length, 0), color: C.dark, bg: '#f7f4ef' },
        ].map(m => (
          <div key={m.label} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px' }}>
            <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{m.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: m.color, fontFamily: font.serif }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search advisors…" style={{
          padding: '8px 14px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: font.sans, width: 260, background: C.white,
        }} />
        <div style={{ display: 'flex', gap: 4, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 6, padding: 3 }}>
          {[
            { key: 'all' as const, label: `All (${deals.length})` },
            { key: 'step6' as const, label: `Offer Accepted (${step6})` },
            { key: 'step7' as const, label: `Launched (${step7})` },
          ].map(f => <TabBtn key={f.key} active={stageFilter === f.key} label={f.label} onClick={() => setStageFilter(f.key)} />)}
        </div>
      </div>

      {/* Deal Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: C.slate, fontSize: 14 }}>
            No advisors match your search.
          </div>
        ) : (
          filtered.map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              expanded={expandedId === deal.id}
              onToggle={() => setExpandedId(expandedId === deal.id ? null : deal.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
