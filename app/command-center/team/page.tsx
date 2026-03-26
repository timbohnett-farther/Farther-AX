'use client';

import { useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import Image from 'next/image';
import { DataCard, StatusBadge } from '@/components/ui';
import { useTheme } from '@/lib/theme-provider';
import { getThemeColors } from '@/lib/design-tokens';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const ROLES = ['AXM', 'AXA', 'CTM', 'CTA', 'Recruiter', 'CX Manager', 'Compliance', 'RIA Leadership', 'Director'] as const;

const ROLE_COLORS: Record<string, { bg: string; color: string; border: string; hex: string }> = {
  'AXM':            { bg: 'bg-teal/10', color: 'text-teal', border: 'border-teal', hex: '#2bb8c4' },
  'AXA':            { bg: 'bg-cyan-500/10', color: 'text-cyan-400', border: 'border-cyan-400', hex: '#22d3ee' },
  'CTM':            { bg: 'bg-amber-500/10', color: 'text-amber-400', border: 'border-amber-400', hex: '#fbbf24' },
  'CTA':            { bg: 'bg-yellow-600/10', color: 'text-yellow-500', border: 'border-yellow-500', hex: '#eab308' },
  'Recruiter':      { bg: 'bg-blue-500/10', color: 'text-blue-400', border: 'border-blue-400', hex: '#60a5fa' },
  'CX Manager':     { bg: 'bg-pink-500/10', color: 'text-pink-400', border: 'border-pink-400', hex: '#f472b6' },
  'Compliance':     { bg: 'bg-orange-500/10', color: 'text-orange-400', border: 'border-orange-400', hex: '#fb923c' },
  'RIA Leadership': { bg: 'bg-emerald-500/10', color: 'text-emerald-400', border: 'border-emerald-400', hex: '#34d399' },
  'Director':       { bg: 'bg-purple-500/10', color: 'text-purple-400', border: 'border-purple-400', hex: '#a78bfa' },
  'Unassigned':     { bg: 'bg-slate/10', color: 'text-slate', border: 'border-slate', hex: '#94a3b8' },
};

// Unique colors for each team member name
const NAME_PALETTE = [
  '#5ec4cf', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#3b82f6',
  '#ec4899', '#f97316', '#06b6d4', '#84cc16', '#a78bfa', '#fb923c',
  '#14b8a6', '#e879f9', '#fbbf24', '#6366f1', '#22d3ee', '#f43f5e',
  '#a3e635', '#c084fc', '#38bdf8', '#facc15', '#4ade80', '#f87171',
];
const nameColorMap: Record<string, string> = {};
function getNameColor(name: string): string {
  if (!name) return '#94a3b8';
  if (nameColorMap[name]) return nameColorMap[name];
  const idx = Object.keys(nameColorMap).length % NAME_PALETTE.length;
  nameColorMap[name] = NAME_PALETTE[idx];
  return nameColorMap[name];
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  'AXM':            'Advisor Experience Manager – Primary onboarding lead',
  'AXA':            'Advisor Experience Associate – Supports AXM through onboarding',
  'CTM':            'Customer Transition Manager – Manages asset transfer process',
  'CTA':            'Customer Transition Associate – Supports CTM on transitions',
  'Recruiter':      'Advisor Business Development – Recruiting pipeline management',
  'CX Manager':     'Customer Experience Manager – Post-launch advisor support',
  'Compliance':     'Compliance Officer – Regulatory and compliance oversight',
  'RIA Leadership': 'RIA Manager/Leader – Senior RIA oversight',
  'Director':       'AX Director – Team leadership and staffing oversight',
  'Unassigned':     'No role assigned yet',
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

// Add/Edit Form Component
function MemberForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: TeamMember;
  onSave: (data: Partial<TeamMember>) => Promise<void>;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  const C = useMemo(() => getThemeColors(theme === 'dark'), [theme]);

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

  return (
    <DataCard className="mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold" style={{ color: C.cream }}>
            {initial ? 'Edit Team Member' : 'Add Team Member'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="bg-transparent border-none text-lg cursor-pointer"
            style={{ color: C.slate }}
            onMouseEnter={(e) => e.currentTarget.style.color = C.cream}
            onMouseLeave={(e) => e.currentTarget.style.color = C.slate}
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.slate }}>
              Full Name *
            </label>
            <input
              className="w-full px-3 py-2 rounded-md border text-sm focus:border-teal focus:ring-1 focus:ring-teal outline-hidden"
              style={{
                backgroundColor: C.cardBg,
                color: C.cream,
                borderColor: C.border
              }}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.slate }}>
              Email *
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 rounded-md border text-sm focus:border-teal focus:ring-1 focus:ring-teal outline-hidden"
              style={{
                backgroundColor: C.cardBg,
                color: C.cream,
                borderColor: C.border
              }}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@farther.com"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.slate }}>
              Role *
            </label>
            <select
              className="w-full px-3 py-2 rounded-md border text-sm focus:border-teal focus:ring-1 focus:ring-teal outline-hidden"
              style={{
                backgroundColor: C.cardBg,
                color: C.cream,
                borderColor: C.border
              }}
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.slate }}>
              Phone
            </label>
            <input
              className="w-full px-3 py-2 rounded-md border text-sm focus:border-teal focus:ring-1 focus:ring-teal outline-hidden"
              style={{
                backgroundColor: C.cardBg,
                color: C.cream,
                borderColor: C.border
              }}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.slate }}>
              Calendar Link
            </label>
            <input
              className="w-full px-3 py-2 rounded-md border text-sm focus:border-teal focus:ring-1 focus:ring-teal outline-hidden"
              style={{
                backgroundColor: C.cardBg,
                color: C.cream,
                borderColor: C.border
              }}
              value={calendarLink}
              onChange={e => setCalendarLink(e.target.value)}
              placeholder="https://calendar.google.com/..."
            />
          </div>
        </div>

        {error && <p style={{ color: C.red }} className="text-xs mb-3">{error}</p>}

        <div className="flex gap-2.5">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-md text-sm font-semibold border-none cursor-pointer hover:opacity-90 transition-smooth disabled:opacity-70 disabled:cursor-wait"
            style={{
              backgroundColor: C.teal,
              color: C.white
            }}
          >
            {saving ? 'Saving…' : initial ? 'Update' : 'Add Member'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-md text-sm font-medium border cursor-pointer hover:opacity-80 transition-smooth"
            style={{
              backgroundColor: C.cardBg,
              color: C.slate,
              borderColor: C.border
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </DataCard>
  );
}

/**
 * Team Management Page - Team member directory
 *
 * Migrated to Tremor components and Tailwind utilities
 */
export default function TeamPage() {
  const { theme } = useTheme();
  const C = useMemo(() => getThemeColors(theme === 'dark'), [theme]);

  const { data, error, isLoading } = useSWR('/api/command-center/team', fetcher, { refreshInterval: 43_200_000 });

  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  const members: TeamMember[] = useMemo(() => data?.members ?? [], [data]);

  const filteredMembers = useMemo(() => {
    const knownRoles = new Set(ROLES as readonly string[]);
    return members.filter(m => {
      if (!showInactive && !m.active) return false;
      if (filterRole === 'all') return true;
      if (filterRole === 'Unassigned') return !m.role || !knownRoles.has(m.role);
      return m.role === filterRole;
    });
  }, [members, filterRole, showInactive]);

  // Group by role for the summary cards
  const roleCounts = useMemo(() => {
    const active = members.filter(m => m.active);
    const counts: Record<string, number> = {};
    for (const r of ROLES) counts[r] = 0;
    counts['Unassigned'] = 0;
    const knownRoles = new Set(ROLES as readonly string[]);
    for (const m of active) {
      if (m.role && knownRoles.has(m.role)) {
        counts[m.role] = (counts[m.role] ?? 0) + 1;
      } else {
        counts['Unassigned'] = (counts['Unassigned'] ?? 0) + 1;
      }
    }
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

  if (isLoading) return <div className="px-10 py-16" style={{ color: C.slate }}>Loading team…</div>;
  if (error) return <div className="px-10 py-16" style={{ color: C.red }}>Failed to load team data.</div>;

  return (
    <div className="px-10 py-10 min-h-screen bg-transparent font-sans">
      {/* Header */}
      <div className="relative mb-6">
        <Image src="/images/Farther_Symbol_RGB_Cream.svg" alt="" width={32} height={32} className="absolute top-0 right-0 opacity-50" />
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold font-serif mb-2" style={{ color: C.cream }}>
            Team Management
          </h1>
          <p className="text-sm" style={{ color: C.slate }}>
            Manage AX team members · Assign to advisors
          </p>
        </div>
        {!showForm && !editMember && (
          <div className="flex justify-center">
            <button
              onClick={() => { setShowForm(true); setEditMember(null); }}
              className="px-5 py-2.5 rounded-md text-sm font-semibold border-none cursor-pointer hover:opacity-90 transition-smooth"
              style={{
                backgroundColor: C.teal,
                color: C.white
              }}
            >
              + Add Team Member
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showForm || editMember) && (
        <MemberForm
          key={editMember?.id ?? 'new'}
          initial={editMember ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditMember(null); }}
        />
      )}

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2.5 mb-6">
        {[...ROLES, 'Unassigned' as const].map(role => {
          const style = ROLE_COLORS[role];
          const isActive = filterRole === role;
          return (
            <button
              key={role}
              onClick={() => setFilterRole(isActive ? 'all' : role)}
              className="px-3 py-3.5 rounded-lg border text-center cursor-pointer transition-smooth"
              style={{
                backgroundColor: isActive ? style.bg.replace('bg-', '').replace('/10', '') + '10' : C.cardBg,
                borderColor: isActive ? style.hex : C.border
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = C.cardBgHover;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = C.cardBg;
              }}
            >
              <div className="text-2xl font-bold font-serif" style={{ color: style.hex }}>
                {roleCounts[role]}
              </div>
              <div className="text-[11px] font-semibold mt-0.5" style={{ color: isActive ? style.hex : C.slate }}>
                {role}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm" style={{ color: C.slate }}>
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
          {filterRole !== 'all' && ` · filtered by ${filterRole}`}
        </div>
        <label className="text-xs cursor-pointer flex items-center gap-1.5" style={{ color: C.slate }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            className="accent-teal"
          />
          Show inactive
        </label>
      </div>

      {/* Team Members */}
      {filteredMembers.length === 0 ? (
        <DataCard className="text-center py-10">
          <p className="text-sm" style={{ color: C.slate }}>
            {members.length === 0 ? 'No team members yet. Click "Add Team Member" to get started.' : 'No members match the current filter.'}
          </p>
        </DataCard>
      ) : (
        <div className="flex flex-col gap-5">
          {(() => {
            // Group filtered members by role (including Unassigned for empty/unknown roles)
            const grouped: { role: string; members: TeamMember[] }[] = [];
            const knownRoles = new Set(ROLES as readonly string[]);
            for (const role of ROLES) {
              const roleMembers = filteredMembers.filter(m => m.role === role);
              if (roleMembers.length > 0) {
                grouped.push({ role, members: roleMembers });
              }
            }
            // Collect members with empty or unrecognized roles
            const unassigned = filteredMembers.filter(m => !m.role || !knownRoles.has(m.role));
            if (unassigned.length > 0) {
              grouped.push({ role: 'Unassigned', members: unassigned });
            }

            return grouped.map(group => {
              const roleStyle = ROLE_COLORS[group.role] ?? { bg: 'bg-slate/10', color: 'text-slate', border: 'border-slate', hex: '#94a3b8' };
              const roleDesc = ROLE_DESCRIPTIONS[group.role] ?? '';
              return (
                <DataCard key={group.role} className="p-0 overflow-hidden">
                  {/* Role group header */}
                  <div
                    className="px-5 py-3.5 border-b flex items-center justify-between"
                    style={{
                      backgroundColor: roleStyle.hex + '15',
                      borderColor: C.border
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold font-serif" style={{ color: roleStyle.hex }}>
                        {group.role}
                      </span>
                      <span className="text-xs" style={{ color: C.slate }}>
                        {roleDesc}
                      </span>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: C.tableHeaderBg,
                        color: roleStyle.hex
                      }}
                    >
                      {group.members.length}
                    </span>
                  </div>
                  {/* Members table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                          {['Name', 'Email', 'Phone', 'Calendar', 'Status', ''].map(h => (
                            <th
                              key={h}
                              className="px-3.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                              style={{ color: C.slate }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.members.map((member, i) => {
                          const rowBg = i % 2 === 0 ? C.cardBg : C.cardBgAlt;
                          return (
                            <tr
                              key={member.id}
                              className={!member.active ? 'opacity-50' : ''}
                              style={{
                                borderBottom: `1px solid ${C.border}`,
                                background: rowBg
                              }}
                            >
                              <td className="px-3.5 py-2.5 font-semibold" style={{ color: getNameColor(member.name) }}>
                                {member.name}
                              </td>
                              <td className="px-3.5 py-2.5">
                                <a href={`mailto:${member.email}`} className="no-underline hover:underline" style={{ color: C.teal }}>
                                  {member.email}
                                </a>
                              </td>
                              <td className="px-3.5 py-2.5" style={{ color: C.slate }}>
                                {member.phone || '—'}
                              </td>
                              <td className="px-3.5 py-2.5">
                                {member.calendar_link ? (
                                  <a href={member.calendar_link} target="_blank" rel="noopener noreferrer"
                                    className="no-underline text-xs hover:underline" style={{ color: C.teal }}>
                                    View Calendar
                                  </a>
                                ) : (
                                  <span style={{ color: C.slate }}>—</span>
                                )}
                              </td>
                              <td className="px-3.5 py-2.5">
                                <StatusBadge
                                  status={member.active ? 'active' : 'inactive'}
                                  size="sm"
                                />
                              </td>
                              <td className="px-3.5 py-2.5 whitespace-nowrap">
                                <button
                                  onClick={() => { setEditMember(member); setShowForm(false); }}
                                  className="bg-transparent border-none text-xs font-medium cursor-pointer mr-3 hover:underline"
                                  style={{ color: C.teal }}
                                >
                                  Edit
                                </button>
                                {member.active ? (
                                  <button
                                    onClick={() => handleDeactivate(member)}
                                    className="bg-transparent border-none text-xs font-medium cursor-pointer hover:underline"
                                    style={{ color: C.red }}
                                  >
                                    Deactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReactivate(member)}
                                    className="bg-transparent border-none text-xs font-medium cursor-pointer hover:underline"
                                    style={{ color: C.green }}
                                  >
                                    Reactivate
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </DataCard>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
