'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme-provider';

export default function RepaperAcatPage() {
  const { THEME } = useTheme();

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME.colors.bg }}>
      <div className="max-w-5xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-4">
            <span
              className="text-xs uppercase tracking-widest font-semibold"
              style={{ color: THEME.colors.gold }}
            >
              Step 10 / 13
            </span>
          </div>
          <h1
            className="text-5xl font-bold mb-4"
            style={{ color: THEME.colors.text }}
          >
            Repaper / ACAT
          </h1>
          <p className="text-lg" style={{ color: THEME.colors.textSecondary }}>
            Transition Method — Full Re-Documentation (8–12 Weeks)
          </p>
        </div>

        {/* At a Glance Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            { label: 'Timeline', value: '8–12 Weeks' },
            { label: 'Client Action', value: 'Required' },
            { label: 'Use Case', value: 'Universal' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-6 text-center"
              style={{
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
              }}
            >
              <p
                className="text-xs uppercase tracking-wider mb-2"
                style={{ color: THEME.colors.textSecondary }}
              >
                {stat.label}
              </p>
              <p className="text-2xl font-bold" style={{ color: THEME.colors.text }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Coming Soon Banner */}
        <div
          className="rounded-xl p-12 mb-12 text-center"
          style={{
            backgroundColor: THEME.colors.surface,
            border: `1px solid ${THEME.colors.border}`,
          }}
        >
          <div className="text-6xl mb-6" style={{ color: THEME.colors.teal }}>
            ◆
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: THEME.colors.text }}>
            Detailed Content Coming Soon
          </h2>
          <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: THEME.colors.textSecondary }}>
            The Repaper / ACAT section will provide complete guidance for executing
            the most comprehensive transition method — including client paperwork
            workflows, ACAT submission procedures, and timeline management.
          </p>
        </div>

        {/* Preview */}
        <div
          className="rounded-xl p-8"
          style={{
            backgroundColor: THEME.colors.surface,
            border: `1px solid ${THEME.colors.border}`,
          }}
        >
          <h3 className="text-xl font-bold mb-6" style={{ color: THEME.colors.text }}>
            What This Section Will Cover
          </h3>
          <ul className="space-y-3">
            {[
              'New account opening and client re-papering requirements',
              'ACAT submission process and DTCC requirements',
              'Managing client communication throughout the 8–12 week window',
              'Handling ACAT rejections and re-submissions',
              'Account type specific considerations (IRAs, trusts, entities)',
              'Coordinating with custodians on transfer scheduling',
              'Post-transfer reconciliation and account verification',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: THEME.colors.text }}>
                <span style={{ color: THEME.colors.teal }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12">
          <Link
            href="/lpoa"
            className="px-6 py-3 rounded-lg text-sm font-semibold"
            style={{
              border: `1px solid ${THEME.colors.border}`,
              color: THEME.colors.text,
            }}
          >
            ← Back
          </Link>
          <Link
            href="/"
            className="px-8 py-4 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: THEME.colors.gold,
              color: '#FFFFFF',
            }}
          >
            Back to Home →
          </Link>
        </div>
      </div>
    </div>
  );
}
