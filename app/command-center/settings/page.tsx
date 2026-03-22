'use client';

import React from 'react';

const C = {
  dark: '#FAF7F2', white: '#1a1a1a', slate: 'rgba(250,247,242,0.5)',
  teal: '#1d7682', bg: '#111111',
  cardBg: '#2f2f2f', border: 'rgba(250,247,242,0.08)',
  green: '#10b981', greenBg: 'rgba(16,185,129,0.15)',
  amber: '#f59e0b', amberBg: 'rgba(245,158,11,0.15)', amberBorder: 'rgba(245,158,11,0.3)',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.15)', redBorder: 'rgba(239,68,68,0.3)',
  gold: '#f59e0b', goldBg: 'rgba(245,158,11,0.15)',
};

const apiConnections = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM & Marketing Automation',
    status: 'Connected',
    apiKey: 'sk-hubspot-prod-a4f2',
    color: '#ff7a59',
    initial: 'H',
  },
  {
    id: 'google',
    name: 'Google Workspace',
    description: 'Docs, Sheets, Drive',
    status: 'Connected',
    apiKey: 'sk-google-oauth-b8c4',
    color: '#4285f4',
    initial: 'G',
  },
  {
    id: 'gamma',
    name: 'Gamma',
    description: 'Presentation Builder',
    status: 'Connected',
    apiKey: 'sk-gamma-api-c3d9',
    color: '#6c5ce7',
    initial: 'Γ',
  },
  {
    id: 'claude',
    name: 'Claude AI',
    description: 'Content Generation',
    status: 'Connected',
    apiKey: 'sk-ant-api03-d4e1',
    color: '#d4a574',
    initial: 'C',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team Communication',
    status: 'Connected',
    apiKey: 'xoxb-slack-token-e5f2',
    color: '#4a154b',
    initial: 'S',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Workflow Automation',
    status: 'Disconnected',
    apiKey: null,
    color: '#ff4a00',
    initial: 'Z',
  },
];

const notificationPreferences = [
  {
    id: 'email',
    label: 'Email Notifications',
    description: 'Receive email for campaign updates',
    enabled: true,
  },
  {
    id: 'slack',
    label: 'Slack Notifications',
    description: 'Post updates to Slack channels',
    enabled: true,
  },
  {
    id: 'compliance',
    label: 'Compliance Alerts',
    description: 'Immediate alerts for flagged content',
    enabled: true,
  },
  {
    id: 'weekly',
    label: 'Weekly Digest',
    description: 'Weekly summary of all activity',
    enabled: true,
  },
  {
    id: 'performance',
    label: 'Performance Reports',
    description: 'Monthly performance summaries',
    enabled: false,
  },
  {
    id: 'team',
    label: 'Team Updates',
    description: 'Notify when team members complete tasks',
    enabled: false,
  },
];

const teamMembers = [
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@farther.com',
    role: 'Content Lead',
    accessLevel: 'Admin',
    status: 'Active',
  },
  {
    name: 'Marcus Rivera',
    email: 'marcus.r@farther.com',
    role: 'Campaign Strategist',
    accessLevel: 'Editor',
    status: 'Active',
  },
  {
    name: 'Priya Patel',
    email: 'priya.p@farther.com',
    role: 'Design Director',
    accessLevel: 'Admin',
    status: 'Active',
  },
  {
    name: 'James O\'Brien',
    email: 'james.ob@farther.com',
    role: 'SEO Specialist',
    accessLevel: 'Editor',
    status: 'Active',
  },
  {
    name: 'Aisha Williams',
    email: 'aisha.w@farther.com',
    role: 'Social Media Manager',
    accessLevel: 'Editor',
    status: 'Active',
  },
  {
    name: 'David Kim',
    email: 'david.k@farther.com',
    role: 'Email Marketing',
    accessLevel: 'Editor',
    status: 'Active',
  },
  {
    name: 'Elena Rodriguez',
    email: 'elena.r@farther.com',
    role: 'Brand Manager',
    accessLevel: 'Admin',
    status: 'Active',
  },
  {
    name: 'Ryan Thompson',
    email: 'ryan.t@farther.com',
    role: 'Analytics Lead',
    accessLevel: 'Viewer',
    status: 'Active',
  },
];

const brandAssets = [
  {
    name: 'Brand Guidelines v3.2.pdf',
    size: '4.2 MB',
    uploadedDate: 'Mar 15',
  },
  {
    name: 'Color Palette Reference.pdf',
    size: '1.8 MB',
    uploadedDate: 'Mar 10',
  },
  {
    name: 'Typography Standards.pdf',
    size: '2.1 MB',
    uploadedDate: 'Feb 28',
  },
  {
    name: 'Logo Usage Guide.pdf',
    size: '3.5 MB',
    uploadedDate: 'Feb 15',
  },
];

export default function SettingsPage() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
        >
          Settings
        </h1>
        <p className="text-lg" style={{ color: C.slate, fontFamily: "'Fakt', system-ui, sans-serif" }}>
          Configure integrations, preferences, and team settings
        </p>
      </div>

      {/* API Connections */}
      <div className="bg-[#2f2f2f] rounded-xl shadow-xs border" style={{ borderColor: C.border }}>
        <div className="p-6 border-b" style={{ borderColor: C.border }}>
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            API Connections
          </h2>
        </div>
        <div className="divide-y" style={{ borderColor: C.border }}>
          {apiConnections.map((connection) => (
            <div
              key={connection.id}
              className="p-6 flex items-center justify-between hover:bg-opacity-50 transition-colors"
              style={{ fontFamily: "'Fakt', system-ui, sans-serif" }}
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: connection.color }}
                >
                  {connection.initial}
                </div>

                {/* Name & Description */}
                <div className="flex-1">
                  <div className="font-semibold text-base" style={{ color: C.dark }}>
                    {connection.name}
                  </div>
                  <div className="text-sm" style={{ color: C.slate }}>
                    {connection.description}
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: connection.status === 'Connected' ? C.greenBg : C.amberBg,
                    color: connection.status === 'Connected' ? C.green : C.amber,
                  }}
                >
                  {connection.status}
                </div>

                {/* API Key or Connect */}
                {connection.status === 'Connected' ? (
                  <div
                    className="px-4 py-2 rounded-lg text-sm font-mono"
                    style={{ backgroundColor: C.bg, color: C.slate, border: `1px solid ${C.border}` }}
                  >
                    {connection.apiKey}
                  </div>
                ) : (
                  <div className="w-32" />
                )}

                {/* Configure Button */}
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: connection.status === 'Connected' ? C.slate : C.teal,
                    color: C.white,
                  }}
                >
                  {connection.status === 'Connected' ? 'Configure' : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-[#2f2f2f] rounded-xl shadow-xs border" style={{ borderColor: C.border }}>
        <div className="p-6 border-b" style={{ borderColor: C.border }}>
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            Notification Preferences
          </h2>
        </div>
        <div className="divide-y" style={{ borderColor: C.border }}>
          {notificationPreferences.map((pref) => (
            <div
              key={pref.id}
              className="px-6 py-4 flex items-center justify-between"
              style={{ fontFamily: "'Fakt', system-ui, sans-serif" }}
            >
              <div>
                <div className="font-medium text-base" style={{ color: C.dark }}>
                  {pref.label}
                </div>
                <div className="text-sm" style={{ color: C.slate }}>
                  {pref.description}
                </div>
              </div>

              {/* Toggle (simulated with styled div) */}
              <div
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer"
                style={{ backgroundColor: pref.enabled ? C.teal : '#d1d5db' }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  style={{
                    transform: pref.enabled ? 'translateX(24px)' : 'translateX(4px)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Configuration */}
      <div className="bg-[#2f2f2f] rounded-xl shadow-xs border" style={{ borderColor: C.border }}>
        <div className="p-6 border-b" style={{ borderColor: C.border }}>
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            Team Members & Roles
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontFamily: "'Fakt', system-ui, sans-serif" }}>
            <thead>
              <tr className="border-b" style={{ borderColor: C.border, backgroundColor: C.bg }}>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: C.slate }}>
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: C.slate }}>
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: C.slate }}>
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: C.slate }}>
                  Access Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: C.slate }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: C.border }}>
              {teamMembers.map((member, idx) => (
                <tr key={idx} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: idx % 2 === 0 ? 'white' : C.bg }}>
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: C.dark }}>
                    {member.name}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: C.slate }}>
                    {member.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold inline-block"
                      style={{
                        backgroundColor:
                          member.role.includes('Lead') || member.role.includes('Director') || member.role.includes('Manager')
                            ? C.greenBg
                            : C.amberBg,
                        color:
                          member.role.includes('Lead') || member.role.includes('Director') || member.role.includes('Manager')
                            ? C.green
                            : C.amber,
                      }}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold inline-block"
                      style={{
                        backgroundColor: member.accessLevel === 'Admin' ? 'rgba(29,118,130,0.10)' : member.accessLevel === 'Editor' ? C.amberBg : C.bg,
                        color: member.accessLevel === 'Admin' ? C.teal : member.accessLevel === 'Editor' ? C.amber : C.slate,
                      }}
                    >
                      {member.accessLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold inline-block"
                      style={{ backgroundColor: C.greenBg, color: C.green }}
                    >
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t" style={{ borderColor: C.border }}>
          <button
            className="px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: C.teal, color: C.white }}
          >
            + Invite Member
          </button>
        </div>
      </div>

      {/* Brand Guidelines & Assets */}
      <div className="bg-[#2f2f2f] rounded-xl shadow-xs border" style={{ borderColor: C.border }}>
        <div className="p-6 border-b" style={{ borderColor: C.border }}>
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            Brand Guidelines & Assets
          </h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Upload Area */}
          <div
            className="border-2 border-dashed rounded-xl p-12 text-center hover:border-opacity-70 transition-colors cursor-pointer"
            style={{ borderColor: C.border, backgroundColor: C.bg }}
          >
            <div className="space-y-2">
              <div className="text-5xl" style={{ color: C.slate }}>
                📁
              </div>
              <div className="text-base font-medium" style={{ color: C.dark, fontFamily: "'Fakt', system-ui, sans-serif" }}>
                Drop files here or click to upload
              </div>
              <div className="text-sm" style={{ color: C.slate, fontFamily: "'Fakt', system-ui, sans-serif" }}>
                Supported: PDF, PNG, SVG, AI (Max 50MB)
              </div>
            </div>
          </div>

          {/* Uploaded Files Grid */}
          <div className="grid grid-cols-2 gap-4">
            {brandAssets.map((asset, idx) => (
              <div
                key={idx}
                className="bg-[#2f2f2f] border rounded-lg p-4 hover:shadow-md transition-shadow"
                style={{ borderColor: C.border }}
              >
                <div className="flex items-start gap-3">
                  {/* File Icon */}
                  <div className="text-3xl">📄</div>

                  {/* File Info */}
                  <div className="flex-1" style={{ fontFamily: "'Fakt', system-ui, sans-serif" }}>
                    <div className="font-medium text-sm mb-1" style={{ color: C.dark }}>
                      {asset.name}
                    </div>
                    <div className="text-xs" style={{ color: C.slate }}>
                      {asset.size} • Uploaded {asset.uploadedDate}
                    </div>
                  </div>

                  {/* Download Link */}
                  <button
                    className="text-xs font-medium hover:underline"
                    style={{ color: C.teal }}
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
