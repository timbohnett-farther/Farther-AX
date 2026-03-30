'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import { SearchSelect } from './SearchSelect';
import { useTheme } from '@/lib/theme-provider';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Filters {
  advisor: string;
  iaa_status: string;
  pw_status: string;
  portal_status: string;
  household: string;
}

interface FilterPanelProps {
  filters: Filters;
  onChange: (updates: Partial<Filters>) => void;
  onReset: () => void;
}

export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const { THEME } = useTheme();

  const { data: advisorData } = useSWR('/api/command-center/transitions/filters/advisors', fetcher, {
    revalidateOnFocus: false,
  });
  const optionsUrl = filters.advisor
    ? `/api/command-center/transitions/filters/options?advisor=${encodeURIComponent(filters.advisor)}`
    : '/api/command-center/transitions/filters/options';
  const { data: optionsData } = useSWR(optionsUrl, fetcher, { revalidateOnFocus: false });

  // Reset downstream filters when advisor changes
  useEffect(() => {
    // Only runs on advisor change — intentional dependency
  }, [filters.advisor]);

  const advisorOptions = (advisorData?.advisors ?? []).map((a: { name: string; label: string }) => ({
    name: a.name,
    label: a.label,
  }));

  const hasActiveFilters = filters.advisor || filters.iaa_status || filters.pw_status || filters.portal_status || filters.household;

  const selectStyle: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 8, border: `1px solid ${THEME.colors.border}`,
    fontSize: 13, background: THEME.colors.surface, color: THEME.colors.text, cursor: 'pointer',
    outline: 'none', fontFamily: "'Inter', system-ui, sans-serif",
    minWidth: 140,
  };

  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap',
    }}>
      {/* Advisor SearchSelect */}
      <SearchSelect
        options={advisorOptions}
        value={filters.advisor}
        onChange={val => onChange({ advisor: val, iaa_status: '', pw_status: '', portal_status: '' })}
        placeholder="All Advisors"
      />

      {/* IAA Status */}
      <select
        value={filters.iaa_status}
        onChange={e => onChange({ iaa_status: e.target.value })}
        style={selectStyle}
      >
        <option value="">All IAA Statuses</option>
        {(optionsData?.iaa_statuses ?? []).map((s: string) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Paperwork Status */}
      <select
        value={filters.pw_status}
        onChange={e => onChange({ pw_status: e.target.value })}
        style={selectStyle}
      >
        <option value="">All Paperwork</option>
        {(optionsData?.paperwork_statuses ?? []).map((s: string) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Portal Status */}
      <select
        value={filters.portal_status}
        onChange={e => onChange({ portal_status: e.target.value })}
        style={selectStyle}
      >
        <option value="">All Portal</option>
        {(optionsData?.portal_statuses ?? []).map((s: string) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Household Search */}
      <input
        type="text"
        placeholder="Search households..."
        value={filters.household}
        onChange={e => onChange({ household: e.target.value })}
        style={{
          padding: '9px 12px', borderRadius: 8, border: `1px solid ${THEME.colors.border}`,
          fontSize: 13, background: THEME.colors.surface, color: THEME.colors.text, outline: 'none',
          fontFamily: "'Inter', system-ui, sans-serif", minWidth: 180,
        }}
      />

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          style={{
            padding: '9px 14px', borderRadius: 8, border: `1px solid ${THEME.colors.border}`,
            background: 'transparent', color: THEME.colors.textSecondary, fontSize: 12, cursor: 'pointer',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
