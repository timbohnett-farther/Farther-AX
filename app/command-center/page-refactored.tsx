'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from '@/lib/theme-provider';
import { AcquisitionsTab } from '@/components/command-center/AcquisitionsTab';

// Import new refactored components
import { fetcher, SWR_OPTS } from '@/components/command-center';

// TEMPORARY: Import the large sections from separate files
// TODO: Further refactor CommandDashboard and RecruitingTab into smaller pieces
import { CommandDashboard } from '@/components/command-center/CommandDashboard';
import { RecruitingTab } from '@/components/command-center/RecruitingTab';

type TabKey = 'recruiting' | 'acquisitions';

export default function PipelineDashboard() {
  const { THEME } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('recruiting');

  // Fire-and-forget: warm all caches in background on first load
  useEffect(() => {
    fetch('/api/command-center/warm', { method: 'POST' }).catch(() => {});
  }, []);

  const tabs: { key: TabKey; label: string; sublabel: string }[] = [
    { key: 'recruiting', label: 'Advisor Recruiting', sublabel: 'Advisor Pipeline' },
    { key: 'acquisitions', label: 'Acquisitions', sublabel: 'M&A Pipeline' },
  ];

  return (
    <div style={{ padding: '40px 40px', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Header */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Image src="/images/Farther_Symbol_RGB_Cream.svg" alt="" width={32} height={32} style={{ position: 'absolute', top: 0, right: 0, opacity: 0.5 }} />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: THEME.colors.text, fontFamily: "'Inter', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>
            Pipeline Dashboard
          </h1>
          <p style={{ color: THEME.colors.textSecondary, fontSize: 14 }}>
            Live HubSpot data · refreshes every 30s
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${THEME.colors.border}`, marginBottom: 32 }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 24px', background: 'none', border: 'none',
                borderBottom: `2px solid ${isActive ? THEME.colors.teal : 'transparent'}`,
                marginBottom: -2, cursor: 'pointer', transition: 'all 150ms ease',
              }}
            >
              <span style={{
                fontSize: 14, fontWeight: isActive ? 600 : 400,
                color: isActive ? THEME.colors.teal : THEME.colors.textSecondary,
                fontFamily: "'Inter', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums',
              }}>
                {tab.label}
              </span>
              <span style={{
                display: 'block', fontSize: 11,
                color: isActive ? THEME.colors.teal : THEME.colors.textSecondary,
                opacity: 0.6, marginTop: 2,
              }}>
                {tab.sublabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'recruiting' && <RecruitingTab />}
      {activeTab === 'acquisitions' && <AcquisitionsTab />}
    </div>
  );
}
