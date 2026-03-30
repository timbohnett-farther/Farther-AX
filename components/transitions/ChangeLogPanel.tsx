'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useTheme } from '@/lib/theme-provider';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface ChangeEvent {
  id: number;
  change_type: string;
  entity_type: string;
  entity_id: string | null;
  advisor_name: string | null;
  old_value: string | null;
  new_value: string | null;
  details: Record<string, unknown> | null;
  detected_at: string;
}

export function ChangeLogPanel() {
  const { THEME } = useTheme();

  const CHANGE_TYPE_STYLES: Record<string, { color: string; bg: string; icon: string }> = {
    new_household: { color: THEME.colors.success, bg: THEME.colors.successBg, icon: '+' },
    removed_household: { color: THEME.colors.error, bg: THEME.colors.errorBg, icon: '-' },
    status_change: { color: THEME.colors.warning, bg: THEME.colors.warningBg, icon: '\u2192' },
    new_envelope: { color: THEME.colors.steelBlue400, bg: 'rgba(124,164,180,0.15)', icon: '\u2709' },
    completed_envelope: { color: THEME.colors.success, bg: THEME.colors.successBg, icon: '\u2713' },
  };

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const limit = 30;
  const offset = (page - 1) * limit;

  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (typeFilter) params.set('type', typeFilter);

  const { data, isLoading } = useSWR(
    `/api/command-center/transitions/changelog?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const changes: ChangeEvent[] = data?.changes ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px', borderRadius: 8, border: `1px solid ${THEME.colors.border}`,
            fontSize: 13, background: THEME.colors.surface, color: THEME.colors.text, cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">All Changes</option>
          <option value="new_household">New Households</option>
          <option value="removed_household">Removed Households</option>
          <option value="status_change">Status Changes</option>
          <option value="new_envelope">New Envelopes</option>
          <option value="completed_envelope">Completed Envelopes</option>
        </select>
        <span style={{ fontSize: 12, color: THEME.colors.textSecondary }}>{total} change{total !== 1 ? 's' : ''}</span>
      </div>

      {isLoading && <div style={{ padding: 40, color: THEME.colors.textSecondary, textAlign: 'center' }}>Loading changes...</div>}

      {/* Timeline */}
      {!isLoading && changes.length === 0 && (
        <div style={{ padding: 40, color: THEME.colors.textSecondary, textAlign: 'center' }}>
          No changes detected yet. Changes appear after the first DocuSign sync comparison.
        </div>
      )}

      {changes.map(change => {
        const style = CHANGE_TYPE_STYLES[change.change_type] ?? { color: THEME.colors.textSecondary, bg: 'transparent', icon: '?' };
        return (
          <div key={change.id} style={{
            display: 'flex', gap: 12, padding: '10px 0',
            borderBottom: `1px solid ${THEME.colors.border}`,
          }}>
            {/* Icon */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: style.color,
            }}>
              {style.icon}
            </div>
            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: THEME.colors.text }}>
                <span style={{ fontWeight: 600, color: style.color }}>
                  {change.change_type.replace(/_/g, ' ')}
                </span>
                {change.advisor_name && (
                  <span style={{ color: THEME.colors.teal, marginLeft: 6 }}>{change.advisor_name}</span>
                )}
              </div>
              {change.entity_id && (
                <div style={{ fontSize: 12, color: THEME.colors.textSecondary, marginTop: 2 }}>
                  {change.entity_type}: {change.entity_id}
                </div>
              )}
              {(change.old_value || change.new_value) && (
                <div style={{ fontSize: 12, color: THEME.colors.textSecondary, marginTop: 2 }}>
                  {change.old_value && <span style={{ color: THEME.colors.error, textDecoration: 'line-through' }}>{change.old_value}</span>}
                  {change.old_value && change.new_value && ' \u2192 '}
                  {change.new_value && <span style={{ color: THEME.colors.success }}>{change.new_value}</span>}
                </div>
              )}
            </div>
            {/* Timestamp */}
            <div style={{ fontSize: 11, color: THEME.colors.textSecondary, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {fmtDate(change.detected_at)}
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${THEME.colors.border}`, background: THEME.colors.surface, color: page <= 1 ? THEME.colors.textSecondary : THEME.colors.text, fontSize: 12, cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
            Prev
          </button>
          <span style={{ padding: '4px 8px', fontSize: 12, color: THEME.colors.text }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${THEME.colors.border}`, background: THEME.colors.surface, color: page >= totalPages ? THEME.colors.textSecondary : THEME.colors.text, fontSize: 12, cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
