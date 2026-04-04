'use client';

import type { Deal, TabKey } from './types';

interface AdvisorFiltersProps {
  activeTab: TabKey;
  transitionFilter: string;
  setTransitionFilter: (v: string) => void;
  aumTierFilter: string;
  setAumTierFilter: (v: string) => void;
  sentimentFilter: string;
  setSentimentFilter: (v: string) => void;
  taskPhaseFilter: string;
  setTaskPhaseFilter: (v: string) => void;
  alertFilter: string;
  setAlertFilter: (v: string) => void;
  deals: Deal[];
  resultCount: number;
}

export function AdvisorFilters({
  activeTab,
  transitionFilter,
  setTransitionFilter,
  aumTierFilter,
  setAumTierFilter,
  sentimentFilter,
  setSentimentFilter,
  taskPhaseFilter,
  setTaskPhaseFilter,
  alertFilter,
  setAlertFilter,
  deals,
  resultCount,
}: AdvisorFiltersProps) {
  const showSentiment = activeTab === 'launch' || activeTab === 'completed';

  // Extract unique transition types from deals
  const transitionTypes = Array.from(
    new Set(deals.map(d => d.transition_type).filter(Boolean))
  ).sort() as string[];

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
      {/* Transition Type */}
      <select
        value={transitionFilter}
        onChange={e => setTransitionFilter(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
          fontSize: 12,
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="all">All Merge Types</option>
        {transitionTypes.map(t => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* AUM Tier */}
      <select
        value={aumTierFilter}
        onChange={e => setAumTierFilter(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
          fontSize: 12,
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="all">All AUM Tiers</option>
        <option value="0-50">$0 - $50M</option>
        <option value="50-100">$50M - $100M</option>
        <option value="100-200">$100M - $200M</option>
        <option value="200+">$200M+</option>
      </select>

      {/* Sentiment */}
      {showSentiment && (
        <select
          value={sentimentFilter}
          onChange={e => setSentimentFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            fontSize: 12,
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">All Sentiment</option>
          <option value="Advocate">Advocate</option>
          <option value="Positive">Positive</option>
          <option value="Neutral">Neutral</option>
          <option value="At Risk">At Risk</option>
          <option value="High Risk">High Risk</option>
          <option value="unscored">Not Scored</option>
        </select>
      )}

      {/* Task Phase */}
      <select
        value={taskPhaseFilter}
        onChange={e => setTaskPhaseFilter(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
          fontSize: 12,
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="all">All Task Phases</option>
        <option value="phase_0">Phase 0 - Sales Handoff</option>
        <option value="phase_1">Phase 1 - Post-Signing</option>
        <option value="phase_2">Phase 2 - Kick-Off</option>
        <option value="phase_3">Phase 3 - Pre-Launch</option>
        <option value="phase_4">Phase 4 - Final Countdown</option>
        <option value="phase_5">Phase 5 - Launch Day</option>
        <option value="phase_6">Phase 6 - Active Transition</option>
        <option value="phase_7">Phase 7 - Graduation</option>
      </select>

      {/* Open Alerts */}
      <select
        value={alertFilter}
        onChange={e => setAlertFilter(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
          fontSize: 12,
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="all">All Alerts</option>
        <option value="has_alerts">Has Alerts</option>
        <option value="no_alerts">No Alerts</option>
      </select>

      {/* Result count */}
      <span
        style={{
          fontSize: 12,
          color: 'var(--color-text-secondary)',
          padding: '8px 0',
          marginLeft: 'auto',
        }}
      >
        {resultCount} advisor{resultCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
