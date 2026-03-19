'use client';

import { useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  dark: '#333333', white: '#ffffff', slate: '#5b6a71',
  teal: '#1d7682', bg: '#FAF7F2',
  cardBg: '#ffffff', border: '#e8e2d9',
  red: '#c0392b', redBg: 'rgba(192,57,43,0.08)',
  amber: '#b27d2e', amberBg: 'rgba(178,125,46,0.08)',
  gold: '#c8a951', goldBg: 'rgba(200,169,81,0.10)',
  green: '#27ae60', greenBg: 'rgba(39,174,96,0.10)',
};

const ROLES = ['AXM', 'AXA', 'CTM', 'CTA', 'CX Manager', 'Compliance', 'RIA Leadership'] as const;

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  'AXM':            { bg: 'rgba(29,118,130,0.12)', color: C.teal },
  'AXA':            { bg: 'rgba(29,118,130,0.08)', color: C.teal },
  'CTM':            { bg: 'rgba(200,169,81,0.12)', color: C.gold },
  'CTA':            { bg: 'rgba(200,169,81,0.08)', color: C.gold },
  'CX Manager':     { bg: C.greenBg, color: C.green },
  'Compliance':     { bg: C.amberBg, color: C.amber },
  'RIA Leadership': { bg: 'rgba(91,106,113,0.1)', color: C.slate },
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  'AXM':            'Advisor Experience Manager – Primary onboarding lead',
  'AXA':            'Advisor Experience Associate – Supports AXM through onboarding',
  'CTM':            'Customer Transition Manager – Manages asset transfer process',
  'CTA':            'Customer Transition Associate – Supports CTM on transitions',
  'CX Manager':     'Customer Experience Manager – Post-launch advisor support',
  'Compliance':     'Compliance Officer – Regulatory and compliance oversight',
  'RIA Leadership': 'RIA Manager/Leader – Senior RIA oversight',
};

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  calendar_link: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const style = ROLE_COLORS[role] ?? { bg: 'rgba(91,106,113,0.1)', color: C.slate };
  return (
    <span
      title={ROLE_DESCRIPTIONS[role]}
      style={{
        display: 'inline-block', padding: '2px 10px', borderRadius: 4,
        fontSize: 11, fontWeight: 600, background: style.bg, color: style.color,
        cursor: 'help',
      }}
    >
      {role}
    </span>
  );
}

// ── Add/Edit Form ────────────────────────────────────────────────────────────
function MemberForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: TeamMember;
  onSave: (data: Partial<TeamMember>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [role, setRole] = useState(initial?.role ?? 'AXM');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [calendarLink, setCalendarLink] = useState(initial?.calendar_link ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...(initial ? { id: initial.id } : {}),
        name: name.trim(),
        email: email.trim(),
        role,
        phone: phone.trim() || null,
        calendar_link: calendarLink.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 6,
    border: `1px solid ${C.border}`, fontSize: 13,
    fontFamily: "'Fakt', system-ui, sans-serif",
    background: C.white, color: C.dark,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: C.slate,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 4, display: 'block',
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: 24, marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: C.dark, fontFamily: "'Fakt', system-ui, sans-serif" }}>
          {initial ? 'Edit Team Member' : 'Add Team Member'}
        </h3>
        <button type="button" onClick={onCancel} style={{
          background: 'none', border: 'none', fontSize: 18, color: C.slate, cursor: 'pointer',
        }}>×</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
        </div>
        <div>
          <label style={labelStyle}>Email *</label>
          <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@farther.com" />
        </div>
        <div>
          <label style={labelStyle}>Role *</label>
          <select style={inputStyle} value={role} onChange={e => setRole(e.target.value)}>
            {ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Phone</label>
          <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Calendar Link</label>
          <input style={inputStyle} value={calendarLink} onChange={e => setCalendarLink(e.target.value)} placeholder="https://calendar.google.com/..." />
        </div>
      </div>

      {error && <p style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={saving} style={{
          padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600,
          background: C.teal, color: C.white, border: 'none', cursor: saving ? 'wait' : 'pointer',
          opacity: saving ? 0.7 : 1,
        }}>
          {saving ? 'Saving…' : initial ? 'Update' : 'Add Member'}
        </button>
        <button type="button" onClick={onCancel} style={{
          padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 500,
          background: C.cardBg, color: C.slate, border: `1px solid ${C.border}`, cursor: 'pointer',
        }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function TeamPage() {
  const { data, error, isLoading } = useSWR('/api/command-center/team', fetcher, { refreshInterval: 43_200_000 });

  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  const members: TeamMember[] = useMemo(() => data?.members ?? [], [data]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (!showInactive && !m.active) return false;
      if (filterRole !== 'all' && m.role !== filterRole) return false;
      return true;
    });
  }, [members, filterRole, showInactive]);

  // Group by role for the summary cards
  const roleCounts = useMemo(() => {
    const active = members.filter(m => m.active);
    const counts: Record<string, number> = {};
    for (const r of ROLES) counts[r] = 0;
    for (const m of active) counts[m.role] = (counts[m.role] ?? 0) + 1;
    return counts;
  }, [members]);

  const handleSave = async (data: Partial<TeamMember>) => {
    const isEdit = !!data.id;
    const res = await fetch('/api/command-center/team', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    mutate('/api/command-center/team');
    setShowForm(false);
    setEditMember(null);
  };

  const handleDeactivate = async (member: TeamMember) => {
    if (!confirm(`Deactivate ${member.name}? They can be reactivated later.`)) return;
    await fetch(`/api/command-center/team?id=${member.id}`, { method: 'DELETE' });
    mutate('/api/command-center/team');
  };

  const handleReactivate = async (member: TeamMember) => {
    await fetch('/api/command-center/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id, active: true }),
    });
    mutate('/api/command-center/team');
  };

  if (isLoading) return <div style={{ padding: '60px 40px', color: C.slate }}>Loading team…</div>;
  if (error) return <div style={{ padding: '60px 40px', color: C.red }}>Failed to load team data.</div>;

  return (
    <div style={{ padding: '40px 40px', minHeight: '100vh', background: C.bg, fontFamily: "'Fakt', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 6 }}>
            Team Management
          </h1>
          <p style={{ color: C.slate, fontSize: 14 }}>
            Manage AX team members · Assign to advisors
          </p>
        </div>
        {!showForm && !editMember && (
          <button
            onClick={() => { setShowForm(true); setEditMember(null); }}
            style={{
              padding: '10px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              background: C.teal, color: C.white, border: 'none', cursor: 'pointer',
            }}
          >
            + Add Team Member
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showForm || editMember) && (
        <MemberForm
          initial={editMember ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditMember(null); }}
        />
      )}

      {/* Role Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ROLES.length}, 1fr)`, gap: 10, marginBottom: 24 }}>
        {ROLES.map(role => {
          const style = ROLE_COLORS[role];
          const isActive = filterRole === role;
          return (
            <button
              key={role}
              onClick={() => setFilterRole(isActive ? 'all' : role)}
              style={{
                padding: '14px 12px', borderRadius: 8, border: `1px solid ${isActive ? style.color : C.border}`,
                background: isActive ? style.bg : C.cardBg, cursor: 'pointer', textAlign: 'center',
                transition: 'all 150ms ease',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: style.color, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
                {roleCounts[role]}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: isActive ? style.color : C.slate, marginTop: 2 }}>
                {role}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: C.slate }}>
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
          {filterRole !== 'all' && ` · filtered by ${filterRole}`}
        </div>
        <label style={{ fontSize: 12, color: C.slate, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            style={{ accentColor: C.teal }}
          />
          Show inactive
        </label>
      </div>

      {/* Team Table */}
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#f7f4ef' }}>
                {['Name', 'Role', 'Email', 'Phone', 'Calendar', 'Status', ''].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left', color: C.slate,
                    fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 14px', textAlign: 'center', color: C.slate }}>
                    {members.length === 0 ? 'No team members yet. Click "Add Team Member" to get started.' : 'No members match the current filter.'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, i) => (
                  <tr key={member.id} style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: i % 2 === 0 ? C.cardBg : '#faf7f2',
                    opacity: member.active ? 1 : 0.5,
                  }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: C.dark }}>
                      {member.name}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <RoleBadge role={member.role} />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <a href={`mailto:${member.email}`} style={{ color: C.teal, textDecoration: 'none' }}>
                        {member.email}
                      </a>
                    </td>
                    <td style={{ padding: '10px 14px', color: C.slate }}>
                      {member.phone || '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {member.calendar_link ? (
                        <a href={member.calendar_link} target="_blank" rel="noopener noreferrer"
                          style={{ color: C.teal, textDecoration: 'none', fontSize: 12 }}>
                          View Calendar
                        </a>
                      ) : (
                        <span style={{ color: C.slate }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4,
                        background: member.active ? C.greenBg : C.redBg,
                        color: member.active ? C.green : C.red,
                      }}>
                        {member.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => { setEditMember(member); setShowForm(false); }}
                        style={{
                          background: 'none', border: 'none', color: C.teal,
                          fontSize: 12, fontWeight: 500, cursor: 'pointer', marginRight: 12,
                        }}
                      >
                        Edit
                      </button>
                      {member.active ? (
                        <button
                          onClick={() => handleDeactivate(member)}
                          style={{
                            background: 'none', border: 'none', color: C.red,
                            fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          }}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(member)}
                          style={{
                            background: 'none', border: 'none', color: C.green,
                            fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          }}
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
