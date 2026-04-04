'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { useTheme } from '@/lib/theme-provider';
import { Section } from './shared';
import { AssignmentRow, AssignmentMember, StaffRec } from './types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const ASSIGNMENT_ROLES = ['AXM', 'AXA', 'CTM', 'CTA'] as const;
const ROLE_LABELS: Record<string, string> = {
  'AXM': 'Advisor Experience Manager',
  'AXA': 'Advisor Experience Associate',
  'CTM': 'Customer Transition Manager',
  'CTA': 'Customer Transition Associate'
};

interface TeamAssignmentsProps {
  dealId: string;
}

export function TeamAssignments({ dealId }: TeamAssignmentsProps) {
  const { THEME } = useTheme();
  const ROLE_COLORS_MAP: Record<string, string> = {
    'AXM': THEME.colors.teal,
    'AXA': THEME.colors.teal,
    'CTM': '#c8a951',
    'CTA': '#c8a951'
  };

  const { data: assignmentData, mutate: mutateAssignments } = useSWR<{ assignments: AssignmentRow[] }>(
    `/api/command-center/assignments?dealId=${dealId}`,
    fetcher
  );
  const { data: teamData } = useSWR<{ members: AssignmentMember[] }>(
    '/api/command-center/team?active=true',
    fetcher
  );
  const { data: recData } = useSWR<{ recommendations: StaffRec[] }>(
    `/api/command-center/staff-recommendation?dealId=${dealId}`,
    fetcher
  );

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
      await fetch('/api/command-center/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal_id: dealId, role, member_id: memberId })
      });
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
          <button
            onClick={() => setShowRec(!showRec)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 6,
              background: 'rgba(142,68,173,0.06)',
              border: '1px solid rgba(142,68,173,0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: '#8e44ad' }}>AI Staffing Recommendations Available</span>
            <span style={{ fontSize: 12, color: '#8e44ad' }}>{showRec ? '▲' : '▼'}</span>
          </button>
          {showRec && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recommendations.map(rec => (
                <div key={rec.role} style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  background: rec.capacity_status === 'red' ? 'rgba(192,57,43,0.04)' : rec.capacity_status === 'amber' ? 'rgba(178,125,46,0.04)' : 'rgba(39,174,96,0.04)',
                  border: `1px solid ${rec.capacity_status === 'red' ? 'rgba(192,57,43,0.15)' : rec.capacity_status === 'amber' ? 'rgba(178,125,46,0.15)' : 'rgba(39,174,96,0.15)'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ROLE_COLORS_MAP[rec.role] || THEME.colors.textMuted }}>{rec.role}</span>
                    {rec.recommended && (
                      <button
                        onClick={() => handleAssign(rec.role, rec.recommended!.id)}
                        style={{
                          padding: '3px 10px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: THEME.colors.teal,
                          color: THEME.colors.textSecondary,
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Assign {rec.recommended.name.split(' ')[0]}
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: THEME.colors.textMuted, lineHeight: 1.4 }}>{rec.reason}</p>
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
          const roleColor = ROLE_COLORS_MAP[role] || THEME.colors.textMuted;
          const currentAssignment = assignments.find(a => a.role === role);
          return (
            <div key={role} style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: currentMemberId ? `${roleColor}08` : THEME.colors.surface,
              border: `1px solid ${currentMemberId ? `${roleColor}25` : THEME.colors.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: roleColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{role}</span>
                  <p style={{ fontSize: 10, color: THEME.colors.textMuted }}>{ROLE_LABELS[role]}</p>
                </div>
                {currentMemberId && (
                  <button
                    onClick={() => handleRemove(role)}
                    style={{ fontSize: 10, color: THEME.colors.error, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <select
                value={currentMemberId ?? ''}
                onChange={e => { const val = e.target.value || null; if (val) handleAssign(role, val); }}
                disabled={saving === role}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 5,
                  border: `1px solid ${THEME.colors.border}`,
                  background: THEME.colors.textSecondary,
                  fontSize: 13,
                  color: THEME.colors.text,
                  cursor: 'pointer'
                }}
              >
                <option value="">— Select {role} —</option>
                {roleMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {currentAssignment && (
                <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {currentAssignment.member_email && (
                    <a href={`mailto:${currentAssignment.member_email}`} style={{ fontSize: 10, color: THEME.colors.teal, textDecoration: 'none' }}>Email</a>
                  )}
                  {currentAssignment.member_phone && (
                    <a href={`tel:${currentAssignment.member_phone}`} style={{ fontSize: 10, color: THEME.colors.teal, textDecoration: 'none' }}>{currentAssignment.member_phone}</a>
                  )}
                  {currentAssignment.member_calendar && (
                    <a href={currentAssignment.member_calendar} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: THEME.colors.teal, textDecoration: 'none' }}>Calendar</a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
