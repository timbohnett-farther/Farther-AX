'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Card, Text, Badge } from '@tremor/react';
import { StatCard, DataCard, StatusBadge, TabGroup, FilterBar } from '@/components/ui';
import { formatCompactCurrency } from '@/lib/design-tokens';
import {
  UserGroupIcon,
  EnvelopeIcon,
  FolderIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

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

/* ── Helpers ──────────────────────────────────────────────── */
const fetcher = (url: string) => fetch(url).then(r => r.json());
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtAum = (v: string | null) => v ? formatCompactCurrency(parseFloat(v)) : '—';
const contactName = (c: Contact) => [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unknown';

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
      <div className="flex items-center gap-3 mb-4">
        <SparklesIcon className="h-5 w-5 text-teal" />
        <h4 className="text-base font-semibold text-charcoal">{labels[summaryType]}</h4>
        <button onClick={generate} disabled={loading} className="bg-teal hover:bg-teal-dark text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-smooth disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Generating…' : summary ? 'Regenerate' : 'Generate with AI'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {summary ? (
        <div className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap bg-teal/5 rounded-xl p-4 border-l-3 border-teal">
          {summary}
        </div>
      ) : !loading ? (
        <p className="text-sm text-slate italic">Click &ldquo;Generate with AI&rdquo; to create an AI-powered {labels[summaryType].toLowerCase()} for this advisor.</p>
      ) : (
        <div className="shimmer h-24 rounded-lg" />
      )}
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <EnvelopeIcon className="h-5 w-5 text-teal" />
        <h4 className="text-base font-semibold text-charcoal">Email Composer</h4>
      </div>

      {/* To */}
      <div>
        <label className="text-xs font-semibold text-charcoal mb-1 block">To</label>
        <p className="text-sm text-slate bg-cream-dark/50 rounded-lg px-3 py-2">
          {primaryContact ? `${contactName(primaryContact)} <${primaryContact.email || 'no email'}>` : 'No contacts available'}
        </p>
      </div>

      {/* Template */}
      <div>
        <label className="text-xs font-semibold text-charcoal mb-1 block">Template</label>
        <select value={selectedTemplate} onChange={e => applyTemplate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal transition-smooth">
          <option value="">Custom Email</option>
          {templates.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>

      {/* Subject */}
      <div>
        <label className="text-xs font-semibold text-charcoal mb-1 block">Subject</label>
        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject…" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal transition-smooth" />
      </div>

      {/* Body */}
      <div>
        <label className="text-xs font-semibold text-charcoal mb-1 block">Body</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} placeholder="Write your email here…" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal transition-smooth resize-y leading-relaxed" />
      </div>

      {/* Send */}
      <div className="flex items-center gap-3">
        <button onClick={send} disabled={sending || (!selectedTemplate && (!subject || !body))} className="bg-teal hover:bg-teal-dark text-white px-5 py-2 rounded-lg text-sm font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed">
          {sending ? 'Sending…' : 'Send Email'}
        </button>
        {result?.success && <span className="text-xs font-semibold text-emerald-600">Sent successfully!</span>}
        {result?.error && <span className="text-xs text-red-600">{result.error}</span>}
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
      <div className="flex items-center gap-2 mb-4">
        <FolderIcon className="h-5 w-5 text-teal" />
        <h4 className="text-base font-semibold text-charcoal">Shared Drive Folder</h4>
      </div>
      {link ? (
        <div className="bg-teal/5 rounded-xl p-4 border-l-3 border-teal">
          <div className="flex items-center justify-between mb-2">
            <a href={link.folder_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-teal hover:underline">
              ↗ {link.folder_name}
            </a>
            <button onClick={remove} className="text-xs text-red-500 hover:text-red-700 transition-smooth">Remove</button>
          </div>
          <p className="text-xs text-slate">Updated by {link.updated_by} on {fmtDate(link.updated_at)}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="Google Drive folder URL…" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal transition-smooth" />
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Folder name (optional)" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal transition-smooth" />
          <button onClick={save} disabled={saving || !url} className="self-start bg-teal hover:bg-teal-dark text-white px-4 py-2 rounded-lg text-xs font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Saving…' : 'Save Link'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Overview Tab
   ═══════════════════════════════════════════════════════════ */
function OverviewTab({ deal }: { deal: Deal }) {
  const p = deal.properties;
  return (
    <div className="flex flex-col gap-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Transferable AUM" value={fmtAum(p.transferable_aum)} subtitle="expected assets" />
        <StatCard title="Households" value={p.client_households || p.transferable_households || '—'} subtitle="client accounts" />
        <StatCard title="T12 Revenue" value={p.t12_revenue ? formatCompactCurrency(parseFloat(p.t12_revenue)) : '—'} subtitle="trailing twelve months" />
        <StatCard title="Target Launch" value={fmtDate(p.desired_start_date)} subtitle="planned start" />
      </div>

      {/* Detail Fields */}
      <DataCard title="Advisor Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
          {[
            { label: 'Prior Firm', value: p.current_firm__cloned_ },
            { label: 'Firm Type', value: p.firm_type },
            { label: 'Custodian', value: p.custodian__cloned_ },
            { label: 'Transition Type', value: p.transition_type },
            { label: 'CRM Platform', value: p.crm_platform__cloned_ },
            { label: 'Financial Planning', value: p.financial_planning_platform__cloned_ },
            { label: 'Lead Source', value: p.advisor_recruiting_lead_source },
            { label: 'Referred By', value: p.referred_by__cloned_ },
            { label: 'Actual Launch', value: fmtDate(p.actual_launch_date) },
          ].filter(f => f.value && f.value !== '—').map(f => (
            <div key={f.label}>
              <p className="text-xs text-slate uppercase tracking-wider mb-1">{f.label}</p>
              <p className="text-sm text-charcoal">{f.value}</p>
            </div>
          ))}
        </div>
        {(p.advisor_pain_points || p.advisor_goals || p.advisor_top_care_abouts) && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            {p.advisor_pain_points && (
              <div>
                <p className="text-xs text-slate uppercase tracking-wider mb-1">Pain Points</p>
                <p className="text-sm text-charcoal leading-relaxed">{p.advisor_pain_points}</p>
              </div>
            )}
            {p.advisor_goals && (
              <div>
                <p className="text-xs text-slate uppercase tracking-wider mb-1">Goals</p>
                <p className="text-sm text-charcoal leading-relaxed">{p.advisor_goals}</p>
              </div>
            )}
            {p.advisor_top_care_abouts && (
              <div className="md:col-span-2">
                <p className="text-xs text-slate uppercase tracking-wider mb-1">Care Abouts</p>
                <p className="text-sm text-charcoal leading-relaxed">{p.advisor_top_care_abouts}</p>
              </div>
            )}
          </div>
        )}
      </DataCard>

      {/* Contacts */}
      {deal.contacts.length > 0 && (
        <DataCard title="Contacts">
          <div className="flex flex-col gap-2">
            {deal.contacts.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-cream/50 rounded-lg hover:bg-cream transition-smooth">
                <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {(c.firstName || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal">{contactName(c)}</p>
                  <p className="text-xs text-slate truncate">{[c.jobTitle, c.email, c.phone].filter(Boolean).join(' · ')}</p>
                </div>
                {c.yearsInIndustry && <Badge color="teal" size="sm">{c.yearsInIndustry}yr</Badge>}
              </div>
            ))}
          </div>
        </DataCard>
      )}

      {/* Recent Notes */}
      {deal.notes.length > 0 && (
        <DataCard title={`Recent Notes (${deal.notes.length})`}>
          <div className="flex flex-col gap-2">
            {deal.notes.slice(0, 5).map(n => (
              <div key={n.id} className="p-3 bg-cream/50 rounded-lg border-l-2 border-gray-200">
                <p className="text-xs text-slate mb-1">{fmtDate(n.timestamp)}</p>
                <p className="text-sm text-charcoal leading-relaxed">{n.body.slice(0, 400)}{n.body.length > 400 ? '…' : ''}</p>
              </div>
            ))}
          </div>
        </DataCard>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Deal Card (expandable)
   ═══════════════════════════════════════════════════════════ */
function DealCard({ deal, expanded, onToggle }: { deal: Deal; expanded: boolean; onToggle: () => void }) {
  const p = deal.properties;
  const primaryContact = deal.contacts[0];
  const isLaunched = deal.stageLabel.includes('Step 7');

  const dealTabs = [
    { label: 'Overview', content: <OverviewTab deal={deal} /> },
    { label: 'AI Briefing', content: <SummaryPanel deal={deal} summaryType="briefing" />, icon: <SparklesIcon className="h-4 w-4" /> },
    { label: 'Activities', content: <SummaryPanel deal={deal} summaryType="activities" /> },
    { label: 'Email Digest', content: <SummaryPanel deal={deal} summaryType="emails" /> },
    { label: 'Engagements', content: <SummaryPanel deal={deal} summaryType="engagements" /> },
    { label: 'Compose', content: <EmailComposer deal={deal} />, icon: <EnvelopeIcon className="h-4 w-4" /> },
    { label: 'Drive', content: <DriveLinkPanel dealId={deal.id} />, icon: <FolderIcon className="h-4 w-4" /> },
  ];

  return (
    <Card className={`glass-card overflow-hidden transition-smooth ${expanded ? 'shadow-glass-hover' : ''}`}>
      {/* Header — always visible */}
      <div onClick={onToggle} className="cursor-pointer flex items-center justify-between -m-6 p-4 hover:bg-cream/30 transition-smooth">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0 ${isLaunched ? 'bg-emerald-100 text-emerald-700' : 'bg-teal/10 text-teal'}`}>
            {(p.dealname || '?')[0]}
          </div>
          <div>
            <p className="text-base font-semibold text-charcoal font-serif">{p.dealname || 'Unknown'}</p>
            <p className="text-xs text-slate">
              {[p.current_firm__cloned_, primaryContact ? contactName(primaryContact) : null].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="gray" size="sm">{fmtAum(p.transferable_aum)}</Badge>
          <StatusBadge status={isLaunched ? 'success' : 'info'} text={deal.stageLabel.replace('Step ', 'S').split(' – ')[0]} size="sm" />
          <div className="flex items-center gap-1 text-slate">
            {deal.notes.length > 0 && <span className="flex items-center gap-0.5 text-xs"><DocumentTextIcon className="h-3.5 w-3.5" />{deal.notes.length}</span>}
            {deal.calls.length > 0 && <span className="flex items-center gap-0.5 text-xs ml-2"><PhoneIcon className="h-3.5 w-3.5" />{deal.calls.length}</span>}
            {deal.emails.length > 0 && <span className="flex items-center gap-0.5 text-xs ml-2"><ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />{deal.emails.length}</span>}
          </div>
          <span className={`text-xs text-slate transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <TabGroup tabs={dealTabs} />
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */
export default function RiaHubPage() {
  const { data, error, isLoading } = useSWR<{ deals: Deal[] }>('/api/command-center/ria-hub', fetcher, { refreshInterval: 300_000 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  if (isLoading) {
    return (
      <div className="px-10 py-16 text-slate">
        <div className="shimmer h-8 w-64 rounded-lg mb-4" />
        <div className="shimmer h-4 w-96 rounded mb-8" />
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="shimmer h-24 rounded-xl" />)}
        </div>
        {[1,2,3].map(i => <div key={i} className="shimmer h-20 rounded-xl mb-3" />)}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-10 py-16 text-red-600">
        Failed to load advisor data. Please try again.
      </div>
    );
  }

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
    <div className="px-10 py-10 min-h-screen bg-cream font-sans">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-charcoal font-serif mb-2">
          RIA Hub
        </h1>
        <p className="text-slate text-sm">
          Relationship intelligence for advisors in onboarding — AI briefings, communications, and collaboration tools.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Advisors"
          value={String(deals.length)}
          subtitle="in onboarding"
          icon={<UserGroupIcon className="h-6 w-6 text-teal" />}
        />
        <StatCard
          title="Offer Accepted"
          value={String(step6)}
          subtitle="Step 6"
          icon={<DocumentTextIcon className="h-6 w-6 text-amber-600" />}
        />
        <StatCard
          title="Launched"
          value={String(step7)}
          subtitle="Step 7"
          icon={<SparklesIcon className="h-6 w-6 text-white" />}
          className="bg-teal text-white"
        />
        <StatCard
          title="Contacts"
          value={String(deals.reduce((s, d) => s + d.contacts.length, 0))}
          subtitle="associated"
          icon={<ChatBubbleLeftRightIcon className="h-6 w-6 text-teal" />}
        />
      </div>

      {/* Filters */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search advisors…"
        filters={[{
          label: 'Stage',
          value: stageFilter,
          onChange: setStageFilter,
          options: [
            { value: 'all', label: `All (${deals.length})` },
            { value: 'step6', label: `Offer Accepted (${step6})` },
            { value: 'step7', label: `Launched (${step7})` },
          ],
        }]}
        className="mb-6"
      />

      {/* Deal Cards */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <Card className="glass-card text-center py-12">
            <Text className="text-slate">No advisors match your search.</Text>
          </Card>
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
