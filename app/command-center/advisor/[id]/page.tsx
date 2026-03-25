'use client';

import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PHASES, PHASE_ORDER, type Phase } from '@/lib/onboarding-tasks-v2';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  dark: '#FAF7F2', white: '#1a1a1a', slate: 'rgba(250,247,242,0.5)',
  lightBlue: '#b6d0ed',
  teal: '#2bb8c4', bg: '#111111',
  cardBg: '#2f2f2f', border: 'rgba(250,247,242,0.08)',
  green: '#10b981', greenBg: 'rgba(16,185,129,0.15)',
  amber: '#f59e0b', amberBg: 'rgba(245,158,11,0.15)', amberBorder: 'rgba(245,158,11,0.3)',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.15)', redBorder: 'rgba(239,68,68,0.3)',
  gold: '#f59e0b', goldBg: 'rgba(245,158,11,0.15)',
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

const STAGE_ORDER = ['2496931', '2496932', '2496934', '100409509', '2496935', '2496936', '100411705'];

function stageIndex(stageId: string) {
  return STAGE_ORDER.indexOf(stageId);
}

function formatAUM(n: string | number | null | undefined): string {
  const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  if (!v || isNaN(v)) return '—';
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

function formatPct(n: string | number | null | undefined): string {
  const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  if (!v || isNaN(v)) return '—';
  return `${v.toFixed(1)}%`;
}

// ── Shared UI Components ──────────────────────────────────────────────────────
function Section({ title, children, highlight, icon }: { title: string; children: React.ReactNode; highlight?: boolean; icon?: string }) {
  return (
    <div style={{
      background: C.cardBg, border: `1px solid ${highlight ? C.teal : C.border}`,
      borderRadius: 10, marginBottom: 20, overflow: 'hidden',
      boxShadow: highlight ? '0 0 0 1px rgba(29,118,130,0.2)' : undefined,
    }}>
      <div style={{
        padding: '12px 20px', borderBottom: `1px solid ${highlight ? 'rgba(29,118,130,0.15)' : C.border}`,
        background: highlight ? 'rgba(29,118,130,0.05)' : '#2a2a2a',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <h3 style={{ fontSize: 12, fontWeight: 700, color: highlight ? C.teal : C.slate, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title}
        </h3>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

function Field({ label, value, wide, highlight }: { label: string; value: React.ReactNode; wide?: boolean; highlight?: boolean }) {
  if (!value || value === '—' || value === 'null') return null;
  return (
    <div style={{ marginBottom: 12, gridColumn: wide ? 'span 2' : undefined }}>
      <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 14, color: highlight ? C.teal : C.dark, fontWeight: highlight ? 600 : 400, lineHeight: 1.5 }}>{value}</p>
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

function Badge({ label, color }: { label: string; color?: string }) {
  const c = color ?? C.teal;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 6,
      background: `${c}28`, color: c, fontSize: 12, fontWeight: 600,
      marginRight: 6, marginBottom: 6, border: `1px solid ${c}40`,
    }}>{label}</span>
  );
}

function StageBadge({ stageId }: { stageId: string }) {
  const isLate = ['2496936', '100411705'].includes(stageId);
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: 20,
      background: isLate ? 'rgba(29,118,130,0.22)' : 'rgba(91,106,113,0.18)',
      color: isLate ? '#5ec4cf' : C.dark, fontSize: 12, fontWeight: 600,
      border: `1px solid ${isLate ? 'rgba(29,118,130,0.35)' : 'rgba(91,106,113,0.25)'}`,
    }}>
      {STAGE_LABELS[stageId] ?? stageId}
    </span>
  );
}

function IntelCard({ label, items, color, icon }: { label: string; items: string[]; color: string; icon: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 8, border: `1px solid ${color}22`,
      background: `${color}08`, marginBottom: 12,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {icon} {label}
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 13, color: C.dark, lineHeight: 1.6, marginBottom: 4 }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p style={{ fontSize: 13, color: C.slate, textAlign: 'center', padding: '24px 0' }}>{message}</p>;
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      padding: '16px 20px', borderRadius: 8, background: 'rgba(91,106,113,0.04)',
      border: `1px solid ${C.border}`, textAlign: 'center',
    }}>
      <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color: color ?? C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>{value}</p>
    </div>
  );
}

// ── Complexity Panel ──────────────────────────────────────────────────────────
interface ComplexityFactor { category: string; factor: string; points: number; maxPoints: number; detail: string; }
interface ComplexityData { score: number; tier: string; tierColor: string; factors: ComplexityFactor[]; staffingRec: string; estimatedDays: number; }

function ComplexityPanel({ dealId }: { dealId: string }) {
  const { data, isLoading } = useSWR<ComplexityData>(
    dealId ? `/api/command-center/complexity?dealId=${dealId}` : null, fetcher
  );
  const [expanded, setExpanded] = useState(false);
  if (isLoading || !data || !data.score) return null;
  const { score, tier, tierColor, factors, staffingRec, estimatedDays } = data;

  return (
    <Section title="Transition Complexity" highlight icon="◉">
      <div onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: `${tierColor}18`, border: `1px solid ${tierColor}30` }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: tierColor, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>{score}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: tierColor }}>{tier}</span>
          </div>
          <div style={{ width: 80, height: 6, background: 'rgba(91,106,113,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min((score / 105) * 100, 100)}%`, background: tierColor, borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: C.slate }}>Est. {estimatedDays} days</span>
          <span style={{ fontSize: 14, color: C.slate }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {expanded && (
        <>
          <div style={{ padding: '10px 14px', borderRadius: 6, marginBottom: 16, background: `${tierColor}08`, border: `1px solid ${tierColor}15` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: tierColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Staffing Recommendation</p>
            <p style={{ fontSize: 13, color: C.dark, lineHeight: 1.5 }}>{staffingRec}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {factors.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: i < factors.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 90, fontSize: 10, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.category}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{f.factor}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: f.points > 0 ? tierColor : C.slate }}>{f.points}/{f.maxPoints}</span>
                  </div>
                  <p style={{ fontSize: 11, color: C.slate, lineHeight: 1.4 }}>{f.detail}</p>
                </div>
                <div style={{ width: 50, height: 4, background: 'rgba(91,106,113,0.08)', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ height: '100%', borderRadius: 2, width: f.maxPoints > 0 ? `${(f.points / f.maxPoints) * 100}%` : '0%', background: f.points > 0 ? tierColor : 'transparent' }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}

// ── Team Assignment Panel ─────────────────────────────────────────────────────
const ASSIGNMENT_ROLES = ['AXM', 'AXA', 'CTM', 'CTA'] as const;
const ROLE_LABELS: Record<string, string> = { 'AXM': 'Advisor Experience Manager', 'AXA': 'Advisor Experience Associate', 'CTM': 'Customer Transition Manager', 'CTA': 'Customer Transition Associate' };
const ROLE_COLORS_MAP: Record<string, string> = { 'AXM': C.teal, 'AXA': C.teal, 'CTM': '#c8a951', 'CTA': '#c8a951' };

interface AssignmentRow { deal_id: string; role: string; member_id: string; member_name: string; member_email: string; member_phone: string | null; member_calendar: string | null; member_role: string; }
interface AssignmentMember { id: string; name: string; email: string; role: string; phone: string | null; calendar_link: string | null; }
interface StaffRec { role: string; recommended: AssignmentMember | null; alternatives: AssignmentMember[]; reason: string; current_load: number; projected_load: number; capacity_status: 'green' | 'amber' | 'red'; }

function TeamAssignmentPanel({ dealId }: { dealId: string }) {
  const { data: assignmentData, mutate: mutateAssignments } = useSWR<{ assignments: AssignmentRow[] }>(`/api/command-center/assignments?dealId=${dealId}`, fetcher);
  const { data: teamData } = useSWR<{ members: AssignmentMember[] }>('/api/command-center/team?active=true', fetcher);
  const { data: recData } = useSWR<{ recommendations: StaffRec[] }>(`/api/command-center/staff-recommendation?dealId=${dealId}`, fetcher);
  const [saving, setSaving] = useState<string | null>(null);
  const [showRec, setShowRec] = useState(false);

  const assignments = assignmentData?.assignments ?? [];
  const allMembers = teamData?.members ?? [];
  const recommendations = recData?.recommendations ?? [];

  const getAssignedMemberId = (role: string): string | null => {
    const a = assignments.find(a => a.role === role);
    return a ? a.member_id : null;
  };

  const handleAssign = useCallback(async (role: string, memberId: string | null) => {
    if (!memberId) return;
    setSaving(role);
    try {
      await fetch('/api/command-center/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deal_id: dealId, role, member_id: memberId }) });
      mutateAssignments();
    } catch { /* silent */ }
    setSaving(null);
  }, [dealId, mutateAssignments]);

  const handleRemove = useCallback(async (role: string) => {
    setSaving(role);
    await fetch(`/api/command-center/assignments?dealId=${dealId}&role=${role}`, { method: 'DELETE' });
    mutateAssignments();
    setSaving(null);
  }, [dealId, mutateAssignments]);

  return (
    <Section title="Team Assignments" highlight icon="●">
      {recommendations.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setShowRec(!showRec)} style={{ width: '100%', padding: '10px 14px', borderRadius: 6, background: 'rgba(142,68,173,0.06)', border: '1px solid rgba(142,68,173,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#8e44ad' }}>AI Staffing Recommendations Available</span>
            <span style={{ fontSize: 12, color: '#8e44ad' }}>{showRec ? '▲' : '▼'}</span>
          </button>
          {showRec && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recommendations.map(rec => (
                <div key={rec.role} style={{ padding: '10px 14px', borderRadius: 6, background: rec.capacity_status === 'red' ? 'rgba(192,57,43,0.04)' : rec.capacity_status === 'amber' ? 'rgba(178,125,46,0.04)' : 'rgba(39,174,96,0.04)', border: `1px solid ${rec.capacity_status === 'red' ? 'rgba(192,57,43,0.15)' : rec.capacity_status === 'amber' ? 'rgba(178,125,46,0.15)' : 'rgba(39,174,96,0.15)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ROLE_COLORS_MAP[rec.role] || C.slate }}>{rec.role}</span>
                    {rec.recommended && (
                      <button onClick={() => handleAssign(rec.role, rec.recommended!.id)} style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: C.teal, color: C.white, border: 'none', cursor: 'pointer' }}>
                        Assign {rec.recommended.name.split(' ')[0]}
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: C.slate, lineHeight: 1.4 }}>{rec.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {ASSIGNMENT_ROLES.map(role => {
          const currentMemberId = getAssignedMemberId(role);
          const roleMembers = allMembers.filter(m => m.role === role);
          const roleColor = ROLE_COLORS_MAP[role] || C.slate;
          const currentAssignment = assignments.find(a => a.role === role);
          return (
            <div key={role} style={{ padding: '12px 14px', borderRadius: 8, background: currentMemberId ? `${roleColor}08` : C.cardBg, border: `1px solid ${currentMemberId ? `${roleColor}25` : C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: roleColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{role}</span>
                  <p style={{ fontSize: 10, color: C.slate }}>{ROLE_LABELS[role]}</p>
                </div>
                {currentMemberId && <button onClick={() => handleRemove(role)} style={{ fontSize: 10, color: C.red, background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>}
              </div>
              <select value={currentMemberId ?? ''} onChange={e => { const val = e.target.value || null; if (val) handleAssign(role, val); }} disabled={saving === role} style={{ width: '100%', padding: '7px 10px', borderRadius: 5, border: `1px solid ${C.border}`, background: C.white, fontSize: 13, color: C.dark, cursor: 'pointer' }}>
                <option value="">— Select {role} —</option>
                {roleMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {currentAssignment && (
                <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {currentAssignment.member_email && <a href={`mailto:${currentAssignment.member_email}`} style={{ fontSize: 10, color: C.teal, textDecoration: 'none' }}>Email</a>}
                  {currentAssignment.member_phone && <a href={`tel:${currentAssignment.member_phone}`} style={{ fontSize: 10, color: C.teal, textDecoration: 'none' }}>{currentAssignment.member_phone}</a>}
                  {currentAssignment.member_calendar && <a href={currentAssignment.member_calendar} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: C.teal, textDecoration: 'none' }}>Calendar</a>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ── U4 & 2B Intake Card ──────────────────────────────────────────────────────
function U4Card({ dealId, contactId, contactEmail, advisorName }: { dealId: string; contactId: string | null; contactEmail: string | null; advisorName: string }) {
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
          <span style={{ fontSize: 12, fontWeight: 600, color: C.slate }}>Status:</span>
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
              border: 'none', background: `linear-gradient(135deg, ${C.teal}, #28a1af)`, color: '#fff',
              boxShadow: '0 4px 16px rgba(29,118,130,0.3)', opacity: sending ? 0.7 : 1,
            }}>
            {sending ? 'Sending...' : (status === 'expired' ? 'Resend Form' : 'Send U4 & 2B Form')}
          </button>
        )}

        {!contactEmail && status === 'not_sent' && (
          <span style={{ fontSize: 12, color: C.amber }}>No email on file — cannot send form</span>
        )}
      </div>

      {(status === 'sent' || status === 'completed' || status === 'expired') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 20px' }}>
          {data?.sentAt && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Sent</p>
              <p style={{ fontSize: 13, color: C.dark }}>{new Date(data.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          )}
          {data?.sentBy && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Sent By</p>
              <p style={{ fontSize: 13, color: C.dark }}>{data.sentBy}</p>
            </div>
          )}
          {data?.completedAt && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Received</p>
              <p style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>{new Date(data.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          )}
        </div>
      )}

      {data?.token && status !== 'not_sent' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={handleCopyLink}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${C.border}`, background: copied ? C.greenBg : C.cardBg,
              color: copied ? C.green : C.slate,
            }}>
            {copied ? '✓ Copied!' : 'Copy Form Link'}
          </button>
          {status === 'sent' && (
            <button onClick={handleSend} disabled={sending}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${C.border}`, background: C.cardBg, color: C.slate,
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
          <span style={{ fontSize: 12, fontWeight: 600, color: C.slate }}>Status:</span>
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
              border: 'none', background: `linear-gradient(135deg, ${C.teal}, #28a1af)`, color: '#fff',
              boxShadow: '0 4px 16px rgba(29,118,130,0.3)', opacity: sending ? 0.7 : 1,
            }}>
            {sending ? 'Sending...' : (status === 'expired' ? 'Resend Form' : 'Send Tech Intake')}
          </button>
        )}

        {!contactEmail && status === 'not_sent' && (
          <span style={{ fontSize: 12, color: C.amber }}>No email on file — cannot send form</span>
        )}
      </div>

      {(status === 'sent' || status === 'completed' || status === 'expired') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 20px' }}>
          {data?.sentAt && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Sent</p>
              <p style={{ fontSize: 13, color: C.dark }}>{new Date(data.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          )}
          {data?.sentBy && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Sent By</p>
              <p style={{ fontSize: 13, color: C.dark }}>{data.sentBy}</p>
            </div>
          )}
          {data?.completedAt && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Received</p>
              <p style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>{new Date(data.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          )}
        </div>
      )}

      {data?.token && status !== 'not_sent' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={handleCopyLink}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${C.border}`, background: copied ? C.greenBg : C.cardBg,
              color: copied ? C.green : C.slate,
            }}>
            {copied ? '✓ Copied!' : 'Copy Form Link'}
          </button>
          {status === 'sent' && (
            <button onClick={handleSend} disabled={sending}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${C.border}`, background: C.cardBg, color: C.slate,
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
          <Field label="Website" value={cp?.website ? <a href={cp.website} target="_blank" rel="noopener noreferrer" style={{ color: C.teal, textDecoration: 'none' }}>{cp.website}</a> : null} />
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
                <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Licenses</p>
                {cp.licenses.map((l: string, i: number) => <Badge key={i} label={l.match(/\d/) ? `Series ${l}` : l} color={C.teal} />)}
              </div>
            )}
            {cp?.designations?.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Designations</p>
                {cp.designations.map((d: string, i: number) => <Badge key={i} label={d} color={C.gold} />)}
              </div>
            )}
          </div>
        )}
      </Section>

      {cp?.previous_experience?.length > 0 && (
        <Section title="Professional Experience" icon="▸">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cp.previous_experience.map((exp: { firm: string; role: string; years: number | null; notes: string | null }, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '10px 14px', borderRadius: 6, background: i === 0 ? 'rgba(29,118,130,0.04)' : 'transparent', border: `1px solid ${i === 0 ? 'rgba(29,118,130,0.12)' : C.border}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: `${C.teal}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: C.teal, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{exp.firm}</p>
                  <p style={{ fontSize: 12, color: C.slate }}>{exp.role}{exp.years ? ` · ${exp.years} years` : ''}</p>
                  {exp.notes && <p style={{ fontSize: 12, color: C.slate, marginTop: 4 }}>{exp.notes}</p>}
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
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Name', 'Title', 'Licenses', 'Compensation', 'Notes'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: C.slate, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(extracted.team_members as Array<{ name: string; title: string | null; licenses: string | null; compensation: string | null; notes: string | null; staying: boolean | null }>).map((m, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.cardBg : '#262626' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{m.name}</td>
                    <td style={{ padding: '8px 12px', color: C.slate }}>{m.title ?? '—'}</td>
                    <td style={{ padding: '8px 12px' }}>{m.licenses ? <Badge label={m.licenses} /> : '—'}</td>
                    <td style={{ padding: '8px 12px', color: C.slate }}>{m.compensation ?? '—'}</td>
                    <td style={{ padding: '8px 12px', color: C.slate, fontSize: 12 }}>
                      {m.notes ?? '—'}
                      {m.staying === false && <span style={{ color: C.red, fontWeight: 600, marginLeft: 6 }}>May leave</span>}
                      {m.staying === true && <span style={{ color: C.green, fontWeight: 600, marginLeft: 6 }}>Staying</span>}
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
          <IntelCard label="Pain Points / Concerns" items={motives.pain_points} color={C.amber} icon="⚠" />
          <IntelCard label="Top Care Abouts" items={motives.top_care_abouts} color={C.teal} icon="★" />
          <IntelCard label="Goals" items={motives.goals} color={C.green} icon="◎" />
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
                <p key={i} style={{ fontSize: 13, color: C.dark, lineHeight: 1.6, marginBottom: 4 }}>{n}</p>
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
          <div style={{ marginTop: 12, padding: '12px 14px', background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.amber, marginBottom: 4 }}>OBAs</p>
            <p style={{ fontSize: 13, color: C.dark, lineHeight: 1.6 }}>{book.obas}</p>
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
            <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Expense Breakdown</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {fin.expense_details.map((e: string, i: number) => (
                <li key={i} style={{ fontSize: 13, color: C.dark, lineHeight: 1.6 }}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {(fin?.competing_firms?.length > 0 || fin?.competing_offers?.length > 0) && (
        <Section title="Competition" icon="⚑">
          {fin.competing_firms?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Competing Firms</p>
              {fin.competing_firms.map((f: string, i: number) => <p key={i} style={{ fontSize: 13, color: C.dark, lineHeight: 1.6 }}>{f}</p>)}
            </div>
          )}
          {fin.competing_offers?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Competing Offers</p>
              {fin.competing_offers.map((o: string, i: number) => <p key={i} style={{ fontSize: 13, color: C.dark, lineHeight: 1.6 }}>{o}</p>)}
            </div>
          )}
        </Section>
      )}

      {extracted?.deal_structure_notes && (
        <Section title="Deal Structure Notes" icon="✦">
          <p style={{ fontSize: 14, color: C.dark, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{extracted.deal_structure_notes}</p>
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
  const typeColors: Record<string, string> = { email: '#3b82f6', call: C.green, meeting: C.teal };
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
        <StatCard label="Total Activities" value={engagements.length} color={C.teal} />
        <StatCard label="Emails" value={emailCount} color="#3b82f6" />
        <StatCard label="Calls" value={callCount} color={C.green} />
        <StatCard label="Meetings" value={meetingCount} color={C.teal} />
      </div>

      {salesProcess?.next_steps?.length > 0 && (
        <Section title="Sales Process Timeline" icon="▸">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {salesProcess.next_steps.map((step: { step: string; date: string | null }, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 6, background: i === salesProcess.next_steps.length - 1 ? 'rgba(29,118,130,0.06)' : 'transparent', border: `1px solid ${i === salesProcess.next_steps.length - 1 ? 'rgba(29,118,130,0.15)' : C.border}` }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${C.teal}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.teal, flexShrink: 0 }}>{i + 1}</div>
                <p style={{ fontSize: 13, color: C.dark, fontWeight: 500, flex: 1 }}>{step.step}</p>
                {step.date && <span style={{ fontSize: 12, color: C.slate, flexShrink: 0 }}>{step.date}</span>}
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
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search activities..." style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.dark, background: C.cardBg, outline: 'none', fontFamily: "'Fakt', system-ui, sans-serif" }} />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.slate }}>⌕</span>
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.dark, background: C.cardBg, cursor: 'pointer' }}>
            <option value="all">All Types</option>
            <option value="email">Emails</option>
            <option value="call">Calls</option>
            <option value="meeting">Meetings</option>
          </select>
          <span style={{ fontSize: 12, color: C.slate }}>{filtered.length} activities</span>
        </div>
        {filtered.length === 0 ? (
          <EmptyState message="No engagements found" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflowY: 'auto' }}>
            {filtered.map((e, i) => {
              const body = getBody(e).replace(/<[^>]+>/g, '').trim();
              return (
                <div key={e.id || i} style={{ padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: i % 2 === 0 ? C.cardBg : '#262626' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: body ? 6 : 0 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: `${typeColors[e.type] || C.slate}15`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: typeColors[e.type] || C.slate }}>{typeIcons[e.type] || '●'}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.dark, flex: 1 }}>{getTitle(e)}</span>
                    <span style={{ fontSize: 11, color: C.slate }}>{e.timestamp ? new Date(e.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                    <Badge label={e.type} color={typeColors[e.type]} />
                  </div>
                  {body && <p style={{ fontSize: 12, color: C.slate, lineHeight: 1.5, maxHeight: 60, overflow: 'hidden' }}>{body.slice(0, 300)}{body.length > 300 ? '...' : ''}</p>}
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
              <div key={i} style={{ borderBottom: i < Math.min(notes.length, 10) - 1 ? `1px solid ${C.border}` : 'none', paddingBottom: i < Math.min(notes.length, 10) - 1 ? 16 : 0 }}>
                <p style={{ fontSize: 11, color: C.slate, marginBottom: 6 }}>{note.properties.hs_timestamp ? new Date(note.properties.hs_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unknown'}</p>
                <p style={{ fontSize: 13, color: C.dark, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{note.properties.hs_note_body?.replace(/<[^>]+>/g, '') ?? ''}</p>
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
            <div key={item.label} style={{ padding: '12px 14px', borderRadius: 8, background: item.accent ? 'rgba(29,118,130,0.04)' : 'rgba(91,106,113,0.04)', border: `1px solid ${item.accent ? 'rgba(29,118,130,0.12)' : C.border}` }}>
              <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</p>
              <p style={{ fontSize: 14, fontWeight: item.accent ? 600 : 500, color: item.accent ? C.teal : C.dark }}>{item.value}</p>
            </div>
          ))}
        </div>
        {additional && (
          <div style={{ marginBottom: techNotes ? 12 : 0 }}>
            <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>All Platforms</p>
            <p style={{ fontSize: 13, color: C.dark, lineHeight: 1.6 }}>{additional}</p>
          </div>
        )}
        {techNotes && (
          <div>
            <p style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Additional Notes</p>
            <p style={{ fontSize: 13, color: C.dark, lineHeight: 1.6 }}>{techNotes}</p>
          </div>
        )}
      </Section>
      <ComplexityPanel dealId={dealId} />
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TeamContactsTab({ dealId, allContacts }: { dealId: string; allContacts: any[] }) {
  return (
    <>
      <TeamAssignmentPanel dealId={dealId} />
      {allContacts.length > 0 && (
        <Section title={`Associated Contacts (${allContacts.length})`} icon="●">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {allContacts.map((c, i) => (
              <div key={c.id || i} style={{ padding: '14px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: i === 0 ? 'rgba(29,118,130,0.04)' : C.cardBg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${C.teal}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: C.teal }}>{(c.firstname?.[0] ?? '').toUpperCase()}{(c.lastname?.[0] ?? '').toUpperCase()}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{[c.firstname, c.lastname].filter(Boolean).join(' ') || 'Unknown'}</p>
                    {c.company && <p style={{ fontSize: 12, color: C.slate }}>{c.company}</p>}
                  </div>
                  {i === 0 && <Badge label="Primary" color={C.teal} />}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {c.email && <a href={`mailto:${c.email}`} style={{ fontSize: 12, color: C.teal, textDecoration: 'none' }}>✉ {c.email}</a>}
                  {c.phone && <a href={`tel:${c.phone}`} style={{ fontSize: 12, color: C.teal, textDecoration: 'none' }}>☎ {c.phone}</a>}
                  {c.city && c.state && <span style={{ fontSize: 12, color: C.slate }}>{c.city}, {c.state}</span>}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: '18px 24px', borderRadius: 10, background: C.cardBg, border: `1px solid ${C.border}` }}>
        {/* Progress ring */}
        <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke={C.border} strokeWidth="4" />
            <circle cx="28" cy="28" r="24" fill="none" stroke="#f59e0b" strokeWidth="4"
              strokeDasharray={`${(pctComplete / 100) * 150.8} 150.8`}
              strokeLinecap="round" transform="rotate(-90 28 28)" style={{ transition: 'stroke-dasharray 0.4s ease' }} />
          </svg>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{pctComplete}%</span>
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>{totalCompleted} / {totalTasks} Tasks Complete</p>
          <p style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>Advisor onboarding checklist progress</p>
        </div>
        {/* Phase mini stats */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          {phases.map(p => {
            const cfg = PHASE_CONFIG[p.key];
            const done = p.tasks.filter(t => t.completed).length;
            return (
              <div key={p.key} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: cfg.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cfg.label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>{done}/{p.tasks.length}</p>
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
          <div key={p.key} style={{ marginBottom: 16, borderRadius: 10, border: `1px solid ${cfg.border}`, overflow: 'hidden', background: C.cardBg }}>
            {/* Phase header */}
            <button onClick={() => togglePhase(p.key)} style={{
              width: '100%', padding: '14px 20px', background: cfg.bg, border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 14, color: cfg.color, transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cfg.label}</span>
              <span style={{ fontSize: 12, color: C.slate }}>{done} / {p.tasks.length}</span>
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
                    upcoming: { color: C.slate, bg: 'rgba(91,106,113,0.08)', border: 'rgba(91,106,113,0.15)' },
                    due_soon: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
                    overdue: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
                    critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.2)', border: 'rgba(220,38,38,0.4)' },
                    completed: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
                    no_due_date: { color: C.slate, bg: 'rgba(91,106,113,0.08)', border: 'rgba(91,106,113,0.15)' },
                  };
                  const statusStyle = statusColors[task.status] || statusColors.no_due_date;

                  return (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
                      borderBottom: ti < p.tasks.length - 1 ? `1px solid ${C.border}` : 'none',
                      opacity: toggling === task.id ? 0.6 : 1, transition: 'opacity 0.15s',
                    }}>
                      {/* Checkbox */}
                      <button onClick={() => handleToggle(task.id, task.completed)} style={{
                        width: 22, height: 22, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
                        border: `2px solid ${task.completed ? cfg.color : 'rgba(250,247,242,0.2)'}`,
                        background: task.completed ? cfg.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}>
                        {task.completed && <span style={{ fontSize: 13, color: '#fff', lineHeight: 1 }}>✓</span>}
                      </button>

                      {/* Label and details */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{
                          fontSize: 13, color: task.completed ? C.slate : C.dark,
                          textDecoration: task.completed ? 'line-through' : 'none',
                          textDecorationColor: 'rgba(250,247,242,0.3)',
                        }}>{task.label}</span>

                        {/* Responsible person and countdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.slate }}>
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
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(91,106,113,0.08)', color: C.slate, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Optional</span>
                        )}

                        {/* Completed info */}
                        {task.completed && task.completed_at && (
                          <span style={{ fontSize: 11, color: C.slate, whiteSpace: 'nowrap' }}>
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
          background: C.amberBg, border: `1px solid ${C.amberBorder}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <span style={{ fontSize: 13, color: C.amber, fontWeight: 500 }}>
            DocuSign not connected — showing sheet data only. Connect via Transitions page for signing status.
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Accounts" value={summary?.total_accounts ?? 0} color={C.teal} />
        <StatCard label="IAAs Signed" value={summary?.iaa_signed ?? 0} color={C.green} />
        <StatCard label="Paperwork Complete" value={summary?.paperwork_complete ?? 0} color={C.green} />
        <StatCard label="Pending" value={summary?.pending ?? 0} color={C.amber} />
      </div>

      {/* Client Table */}
      {(!clients || clients.length === 0) ? (
        <EmptyState message="No transition clients found for this advisor." />
      ) : (
        <Section title={`Transition Clients (${clients.length})`} icon="◎">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Client Name', 'Account Type', 'Custodian', 'IAA Status', 'Paperwork', 'DocuSign', 'Last Updated'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: C.slate, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
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
                          borderBottom: `1px solid ${C.border}`,
                          background: isExpanded ? 'rgba(29,118,130,0.04)' : (i % 2 === 0 ? C.cardBg : '#262626'),
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                      >
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, color: C.dark }}>
                            {[client.primary_first_name, client.primary_last_name].filter(Boolean).join(' ') || '—'}
                          </div>
                          {client.household_name && (
                            <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>{client.household_name}</div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', color: C.slate }}>{client.account_type ?? '—'}</td>
                        <td style={{ padding: '10px 12px', color: C.slate }}>{client.custodian ?? '—'}</td>
                        <td style={{ padding: '10px 12px' }}><StatusPill status={iaaDisplayStatus} /></td>
                        <td style={{ padding: '10px 12px' }}><StatusPill status={client.status_of_account_paperwork} /></td>
                        <td style={{ padding: '10px 12px' }}>
                          {docusign_connected ? <StatusPill status={dsStatus} /> : <span style={{ fontSize: 12, color: C.slate }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: C.slate }}>
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
                                  <span style={{ fontSize: 10, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</span>
                                  <p style={{ fontSize: 13, color: C.teal }}>{client.primary_email}</p>
                                </div>
                              )}
                              {client.primary_phone && (
                                <div>
                                  <span style={{ fontSize: 10, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phone</span>
                                  <p style={{ fontSize: 13, color: C.dark }}>{client.primary_phone}</p>
                                </div>
                              )}
                              {client.fee_schedule && (
                                <div>
                                  <span style={{ fontSize: 10, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fee Schedule</span>
                                  <p style={{ fontSize: 13, color: C.dark }}>{client.fee_schedule}</p>
                                </div>
                              )}
                              {client.document_readiness && (
                                <div>
                                  <span style={{ fontSize: 10, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Doc Readiness</span>
                                  <p style={{ fontSize: 13, color: C.dark }}>{client.document_readiness}</p>
                                </div>
                              )}
                              {client.notes && (
                                <div style={{ gridColumn: 'span 4' }}>
                                  <span style={{ fontSize: 10, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes</span>
                                  <p style={{ fontSize: 13, color: C.dark, lineHeight: 1.5 }}>{client.notes}</p>
                                </div>
                              )}
                            </div>

                            {/* DocuSign envelope details */}
                            {!docusign_connected ? (
                              <div style={{ padding: '10px 14px', borderRadius: 6, background: C.amberBg, border: `1px solid ${C.amberBorder}` }}>
                                <span style={{ fontSize: 12, color: C.amber }}>DocuSign not connected</span>
                              </div>
                            ) : (!client.envelopes || client.envelopes.length === 0) ? (
                              <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(91,106,113,0.04)', border: `1px solid ${C.border}` }}>
                                <span style={{ fontSize: 12, color: C.slate }}>No DocuSign envelopes found for this client</span>
                              </div>
                            ) : (
                              <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                  DocuSign Envelopes ({client.envelopes.length})
                                </p>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                  <thead>
                                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                                      {['Subject', 'Status', 'Sent', 'Completed'].map(h => (
                                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: C.slate, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {client.envelopes.map((env: any) => (
                                      <tr key={env.envelopeId} style={{ borderBottom: `1px solid ${C.border}` }}>
                                        <td style={{ padding: '6px 10px', color: C.dark }}>{env.emailSubject || '—'}</td>
                                        <td style={{ padding: '6px 10px' }}><StatusPill status={env.status} /></td>
                                        <td style={{ padding: '6px 10px', color: C.slate }}>
                                          {env.sentDateTime ? new Date(env.sentDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                                        </td>
                                        <td style={{ padding: '6px 10px', color: C.slate }}>
                                          {env.completedDateTime ? new Date(env.completedDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>

                                {/* Signers for the first envelope */}
                                {client.envelopes[0]?.signers?.length > 0 && (
                                  <div style={{ marginTop: 10 }}>
                                    <p style={{ fontSize: 10, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Signers</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                      {client.envelopes[0].signers.map((signer: any, si: number) => (
                                        <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', borderRadius: 4, background: 'rgba(91,106,113,0.04)' }}>
                                          <span style={{ fontSize: 12, color: C.dark, fontWeight: 500, flex: 1 }}>{signer.name}</span>
                                          <span style={{ fontSize: 11, color: C.slate }}>{signer.email}</span>
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
type ProfileTab = 'overview' | 'financials' | 'engagements' | 'tech' | 'team' | 'tasks' | 'onboarding';

export default function AdvisorProfilePage() {
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

  if (isLoading) return <div style={{ padding: '60px 40px', color: C.slate }}>Loading advisor profile...</div>;
  if (error || data?.error) return <div style={{ padding: '60px 40px', color: C.red }}>Failed to load advisor data.</div>;

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
    { key: 'overview', label: 'Overview', icon: '◈', color: '#28a1af' },
    { key: 'financials', label: 'Financials', icon: '▲', color: '#10b981' },
    { key: 'engagements', label: 'Engagements', icon: '◉', color: '#3b82f6' },
    { key: 'tech', label: 'Tech & Complexity', icon: '◎', color: '#8b5cf6' },
    { key: 'team', label: 'Team & Contacts', icon: '●', color: '#c8a951' },
    { key: 'tasks', label: 'Onboarding Tasks', icon: '✦', color: '#f59e0b' },
    { key: 'onboarding', label: 'Client Onboarding', icon: '◎', color: '#ef4444' },
  ];

  return (
    <div style={{ padding: '32px 40px', minHeight: '100vh', fontFamily: "'Fakt', system-ui, sans-serif", maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Navigation: Back + Next Advisor */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Link href="/command-center/advisor-hub" style={{ fontSize: 13, color: C.slate, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
              <span style={{ fontSize: 12, color: C.slate, display: 'block' }}>Next Advisor &rarr;</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.teal }}>{next.dealname}</span>
            </Link>
          );
        })()}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 8 }}>
            {deal.dealname ?? 'Advisor Profile'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <StageBadge stageId={stageId} />
            {deal.current_firm__cloned_ && <span style={{ fontSize: 13, color: C.slate }}>from {deal.current_firm__cloned_}</span>}
            {deal.firm_type && <span style={{ fontSize: 13, color: C.slate }}>· {deal.firm_type}</span>}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            {contact?.email && <a href={`mailto:${contact.email}`} style={{ fontSize: 13, color: C.teal, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>✉ {contact.email}</a>}
            {(contact?.phone || contact?.mobilephone) && <a href={`tel:${contact.phone || contact.mobilephone}`} style={{ fontSize: 13, color: C.teal, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>☎ {contact.phone || contact.mobilephone}</a>}
            {(contact?.city || contact?.state) && <span style={{ fontSize: 13, color: C.slate }}>{[contact.city, contact.state].filter(Boolean).join(', ')}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: C.teal, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
            {formatAUM(deal.transferable_aum || team?.transferable_aum)}
          </p>
          <p style={{ fontSize: 12, color: C.slate }}>Transferable AUM</p>
        </div>
      </div>

      {/* Stage Progress */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {STAGE_ORDER.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= si ? C.teal : C.border, transition: 'background 0.3s' }} />
        ))}
      </div>

      {/* AI Status + Raw Note Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {parseLoading && (
            <span style={{ fontSize: 12, color: C.teal, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, border: `2px solid ${C.teal}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              AI extracting recruiter notes...
            </span>
          )}
          {parseError && <span style={{ fontSize: 12, color: C.amber }}>Note parsing: {parseError}</span>}
          {extracted && !parseLoading && <span style={{ fontSize: 12, color: C.green }}>✓ Recruiter notes parsed</span>}
          {!pinnedNoteBody && !parseLoading && <span style={{ fontSize: 12, color: C.slate }}>No pinned note found</span>}
        </div>
        {rawNoteText && (
          <button onClick={() => setShowRawNote(!showRawNote)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, background: showRawNote ? C.teal : C.cardBg, color: showRawNote ? C.white : C.slate, border: `1px solid ${showRawNote ? C.teal : C.border}`, cursor: 'pointer' }}>
            {showRawNote ? 'Hide Raw Note' : 'View Raw Note'}
          </button>
        )}
      </div>

      {showRawNote && rawNoteText && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px', marginBottom: 20, maxHeight: 500, overflowY: 'auto' }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Pinned Note (Raw)</h3>
          <pre style={{ fontSize: 13, color: C.dark, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: "'Fakt', system-ui, sans-serif", margin: 0 }}>{rawNoteText}</pre>
        </div>
      )}

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${C.border}`, marginBottom: 24 }}>
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
              <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? tab.color : C.slate, fontFamily: "'Fakt', system-ui, sans-serif" }}>{tab.label}</span>
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
