'use client';

import React, { useState } from 'react';

const C = {
  dark: 'rgba(255,255,255,0.9)', white: '#1a1a1a', slate: 'rgba(255,255,255,0.4)',
  teal: '#1d7682', bg: '#111111',
  cardBg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.12)',
  green: '#10b981', greenBg: 'rgba(16,185,129,0.15)',
  amber: '#f59e0b', amberBg: 'rgba(245,158,11,0.15)', amberBorder: 'rgba(245,158,11,0.3)',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.15)', redBorder: 'rgba(239,68,68,0.3)',
  gold: '#f59e0b', goldBg: 'rgba(245,158,11,0.15)',
  purple: '#7c3aed',
  purpleBg: 'rgba(124,58,237,0.08)',
  blue: '#2563eb',
  blueBg: 'rgba(37,99,235,0.08)',
};

// Mock data
const templates = [
  { id: 1, name: 'Quarterly Market Commentary', category: 'Commentary', uses: 45, color: C.blue },
  { id: 2, name: 'Advisor Welcome Kit', category: 'Onboarding', uses: 28, color: C.teal },
  { id: 3, name: 'Monthly Newsletter', category: 'Newsletter', uses: 62, color: C.purple },
  { id: 4, name: 'Social Post Bundle', category: 'Social', uses: 89, color: C.green },
  { id: 5, name: 'Client Birthday Email', category: 'Email', uses: 34, color: C.amber },
  { id: 6, name: 'Investment Proposal', category: 'Presentation', uses: 21, color: C.dark },
  { id: 7, name: 'Webinar Invite', category: 'Email', uses: 56, color: C.teal },
  { id: 8, name: 'Market Update Alert', category: 'Newsletter', uses: 73, color: C.blue },
  { id: 9, name: 'Case Study Template', category: 'Blog', uses: 15, color: C.purple },
  { id: 10, name: 'Team Bio Page', category: 'Web', uses: 42, color: C.green },
  { id: 11, name: 'Event Follow-Up', category: 'Email', uses: 38, color: C.amber },
  { id: 12, name: 'Retirement Guide', category: 'Content', uses: 19, color: C.dark },
];

const communicationTemplates = [
  { id: 1, name: 'Client Onboarding Series', category: 'Email', lastUsed: '2026-03-18', usage: 156, status: 'Active' },
  { id: 2, name: 'Quarterly Review Reminder', category: 'Email', lastUsed: '2026-03-15', usage: 89, status: 'Active' },
  { id: 3, name: 'Market Volatility Update', category: 'Newsletter', lastUsed: '2026-03-12', usage: 234, status: 'Active' },
  { id: 4, name: 'Birthday Greeting', category: 'Email', lastUsed: '2026-03-10', usage: 67, status: 'Active' },
  { id: 5, name: 'Investment Strategy Deep Dive', category: 'Blog', lastUsed: '2026-02-28', usage: 12, status: 'Draft' },
  { id: 6, name: 'Tax Planning Checklist', category: 'Email', lastUsed: '2026-02-20', usage: 45, status: 'Active' },
  { id: 7, name: 'Retirement Workshop Invite', category: 'Event', lastUsed: '2025-12-15', usage: 23, status: 'Archived' },
  { id: 8, name: 'Portfolio Performance Report', category: 'Email', lastUsed: '2026-03-01', usage: 178, status: 'Active' },
];

const deployedContent = [
  { id: 1, content: 'Q1 2026 Market Commentary', type: 'Newsletter', deployedTo: 'All Clients', deployedBy: 'Sarah Chen', date: '2026-03-15', performance: '↑ 18% engagement' },
  { id: 2, content: 'Tax Season Webinar Series', type: 'Email', deployedTo: 'HNW Segment', deployedBy: 'Marcus Taylor', date: '2026-03-12', performance: '↑ 24% open rate' },
  { id: 3, content: 'Retirement Planning Guide', type: 'Content', deployedTo: 'Prospects', deployedBy: 'Elena Vasquez', date: '2026-03-10', performance: '↑ 12% downloads' },
  { id: 4, content: 'LinkedIn Post: Market Trends', type: 'Social', deployedTo: 'LinkedIn', deployedBy: 'Sarah Chen', date: '2026-03-08', performance: '↑ 31% reach' },
  { id: 5, content: 'Client Welcome Video', type: 'Video', deployedTo: 'New Clients', deployedBy: 'Marcus Taylor', date: '2026-03-05', performance: '↑ 89% completion' },
  { id: 6, content: 'Estate Planning Workshop', type: 'Event', deployedTo: 'Select Clients', deployedBy: 'Elena Vasquez', date: '2026-03-01', performance: '↑ 45% attendance' },
];

export default function ContentLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [advisorName, setAdvisorName] = useState('');
  const [advisorTitle, setAdvisorTitle] = useState('');
  const [advisorSpecialization, setAdvisorSpecialization] = useState('');
  const [advisorBio, setAdvisorBio] = useState('');

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Active':
        return { bg: C.greenBg, text: C.green };
      case 'Draft':
        return { bg: 'rgba(91,106,113,0.08)', text: C.slate };
      case 'Archived':
        return { bg: C.amberBg, text: C.amber };
      default:
        return { bg: C.greenBg, text: C.green };
    }
  };

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }} className="space-y-6">

        {/* Header */}
        <div className="mb-8">
          <h1
            style={{
              fontFamily: "'ABC Arizona Text', Georgia, serif",
              fontSize: '2.5rem',
              fontWeight: '600',
              color: C.dark,
              marginBottom: '0.5rem'
            }}
          >
            Content Library
          </h1>
          <p style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate, fontSize: '1.125rem' }}>
            Centralized content repository, templates, and brand assets
          </p>
        </div>

        {/* Quick Deploy Action Cards */}
        <div className="grid grid-cols-3 gap-4">
          <button
            className="rounded-xl p-6 hover:shadow-lg transition-shadow text-left"
            style={{
              background: `linear-gradient(135deg, ${C.teal} 0%, #156570 100%)`,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <div style={{ color: C.white, fontFamily: "'Fakt', system-ui, sans-serif" }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>Deploy Template</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Quick deploy from library</div>
            </div>
          </button>

          <button
            className="rounded-xl p-6 hover:shadow-lg transition-shadow text-left"
            style={{
              backgroundColor: C.dark,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <div style={{ color: C.white, fontFamily: "'Fakt', system-ui, sans-serif" }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⬆️</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>Upload Asset</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Add to content library</div>
            </div>
          </button>

          <button
            className="rounded-xl p-6 hover:shadow-lg transition-shadow text-left"
            style={{
              backgroundColor: 'transparent',
              border: `2px solid ${C.teal}`,
              cursor: 'pointer'
            }}
          >
            <div style={{ color: C.teal, fontFamily: "'Fakt', system-ui, sans-serif" }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📁</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>Create Collection</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Organize content assets</div>
            </div>
          </button>
        </div>

        {/* Template Library */}
        <div className="rounded-xl p-6" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-6">
            <h2
              style={{
                fontFamily: "'ABC Arizona Text', Georgia, serif",
                fontSize: '1.5rem',
                fontWeight: '600',
                color: C.dark
              }}
            >
              Template Library
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 rounded-lg"
                style={{
                  fontFamily: "'Fakt', system-ui, sans-serif",
                  border: `1px solid ${C.border}`,
                  backgroundColor: C.cardBg,
                  outline: 'none',
                  width: '300px'
                }}
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 rounded-lg"
                style={{
                  fontFamily: "'Fakt', system-ui, sans-serif",
                  border: `1px solid ${C.border}`,
                  backgroundColor: C.cardBg,
                  outline: 'none'
                }}
              >
                <option>All</option>
                <option>Newsletters</option>
                <option>Blog</option>
                <option>Social</option>
                <option>Email</option>
                <option>Presentations</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                style={{ border: `1px solid ${C.border}`, backgroundColor: C.cardBg }}
              >
                <div style={{ height: '8px', background: `linear-gradient(90deg, ${template.color} 0%, ${template.color}CC 100%)` }} />
                <div className="p-4">
                  <h3
                    style={{
                      fontFamily: "'Fakt', system-ui, sans-serif",
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      color: C.dark,
                      marginBottom: '0.5rem'
                    }}
                  >
                    {template.name}
                  </h3>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-2 py-1 rounded-sm text-xs"
                      style={{
                        fontFamily: "'Fakt', system-ui, sans-serif",
                        backgroundColor: C.blueBg,
                        color: C.blue,
                        fontWeight: '500'
                      }}
                    >
                      {template.category}
                    </span>
                    <span style={{ fontFamily: "'Fakt', system-ui, sans-serif", fontSize: '0.75rem', color: C.slate }}>
                      Used {template.uses}x
                    </span>
                  </div>
                  <button
                    className="w-full py-2 rounded-md"
                    style={{
                      fontFamily: "'Fakt', system-ui, sans-serif",
                      backgroundColor: C.teal,
                      color: C.white,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    Deploy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Brand Builder */}
        <div className="rounded-xl p-6" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
          <h2
            style={{
              fontFamily: "'ABC Arizona Text', Georgia, serif",
              fontSize: '1.5rem',
              fontWeight: '600',
              color: C.dark,
              marginBottom: '1.5rem'
            }}
          >
            Personal Brand Builder
          </h2>

          <div className="grid grid-cols-2 gap-8">
            {/* Left: Form Inputs */}
            <div className="space-y-4">
              <div>
                <label
                  style={{
                    fontFamily: "'Fakt', system-ui, sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: C.dark,
                    display: 'block',
                    marginBottom: '0.5rem'
                  }}
                >
                  Advisor Name
                </label>
                <input
                  type="text"
                  value={advisorName}
                  onChange={(e) => setAdvisorName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    fontFamily: "'Fakt', system-ui, sans-serif",
                    border: `1px solid ${C.border}`,
                    backgroundColor: C.cardBg,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontFamily: "'Fakt', system-ui, sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: C.dark,
                    display: 'block',
                    marginBottom: '0.5rem'
                  }}
                >
                  Title
                </label>
                <input
                  type="text"
                  value={advisorTitle}
                  onChange={(e) => setAdvisorTitle(e.target.value)}
                  placeholder="e.g., Senior Wealth Advisor"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    fontFamily: "'Fakt', system-ui, sans-serif",
                    border: `1px solid ${C.border}`,
                    backgroundColor: C.cardBg,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontFamily: "'Fakt', system-ui, sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: C.dark,
                    display: 'block',
                    marginBottom: '0.5rem'
                  }}
                >
                  Specialization
                </label>
                <input
                  type="text"
                  value={advisorSpecialization}
                  onChange={(e) => setAdvisorSpecialization(e.target.value)}
                  placeholder="e.g., Retirement Planning, Estate Strategy"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    fontFamily: "'Fakt', system-ui, sans-serif",
                    border: `1px solid ${C.border}`,
                    backgroundColor: C.cardBg,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontFamily: "'Fakt', system-ui, sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: C.dark,
                    display: 'block',
                    marginBottom: '0.5rem'
                  }}
                >
                  Bio
                </label>
                <textarea
                  value={advisorBio}
                  onChange={(e) => setAdvisorBio(e.target.value)}
                  placeholder="Brief professional bio..."
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    fontFamily: "'Fakt', system-ui, sans-serif",
                    border: `1px solid ${C.border}`,
                    backgroundColor: C.cardBg,
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Right: Preview Card */}
            <div>
              <div
                className="rounded-xl p-6"
                style={{
                  backgroundColor: C.cardBg,
                  border: `2px solid ${C.border}`,
                  height: '100%'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      backgroundColor: C.teal,
                      margin: '0 auto 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: C.white,
                      fontSize: '2.5rem',
                      fontFamily: "'ABC Arizona Text', Georgia, serif"
                    }}
                  >
                    {advisorName ? advisorName.charAt(0).toUpperCase() : '?'}
                  </div>
                  <h3
                    style={{
                      fontFamily: "'ABC Arizona Text', Georgia, serif",
                      fontSize: '1.5rem',
                      fontWeight: '600',
                      color: C.dark,
                      marginBottom: '0.25rem'
                    }}
                  >
                    {advisorName || 'Your Name'}
                  </h3>
                  <p style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate, fontSize: '0.875rem' }}>
                    {advisorTitle || 'Your Title'}
                  </p>
                </div>

                {advisorSpecialization && (
                  <div className="mb-4">
                    <div
                      className="px-3 py-1.5 rounded-md inline-block"
                      style={{
                        fontFamily: "'Fakt', system-ui, sans-serif",
                        backgroundColor: C.purpleBg,
                        color: C.purple,
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      {advisorSpecialization}
                    </div>
                  </div>
                )}

                <p
                  style={{
                    fontFamily: "'Fakt', system-ui, sans-serif",
                    fontSize: '0.875rem',
                    color: C.slate,
                    lineHeight: '1.6'
                  }}
                >
                  {advisorBio || 'Your professional bio will appear here...'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              className="px-6 py-3 rounded-lg"
              style={{
                fontFamily: "'Fakt', system-ui, sans-serif",
                backgroundColor: C.teal,
                color: C.white,
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Generate Brand Kit
            </button>
          </div>
        </div>

        {/* Communication Templates Table */}
        <div className="rounded-xl p-6" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
          <h2
            style={{
              fontFamily: "'ABC Arizona Text', Georgia, serif",
              fontSize: '1.5rem',
              fontWeight: '600',
              color: C.dark,
              marginBottom: '1.5rem'
            }}
          >
            Communication Templates
          </h2>

          <table style={{ width: '100%', fontFamily: "'Fakt', system-ui, sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: C.slate }}>Template</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: C.slate }}>Category</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: C.slate }}>Last Used</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: C.slate }}>Usage Count</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: C.slate }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: C.slate }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {communicationTemplates.map((template) => {
                const statusStyle = getStatusStyle(template.status);
                return (
                  <tr key={template.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: C.dark, fontWeight: '500' }}>{template.name}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: C.slate }}>{template.category}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: C.slate }}>{template.lastUsed}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: C.slate }}>{template.usage}</td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        className="px-2 py-1 rounded-sm text-xs"
                        style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.text,
                          fontWeight: '500'
                        }}
                      >
                        {template.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        style={{
                          fontFamily: "'Fakt', system-ui, sans-serif",
                          fontSize: '0.875rem',
                          color: C.teal,
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Deployed Content Table */}
        <div className="rounded-xl p-6" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
          <h2
            style={{
              fontFamily: "'ABC Arizona Text', Georgia, serif",
              fontSize: '1.5rem',
              fontWeight: '600',
              color: C.dark,
              marginBottom: '1.5rem'
            }}
          >
            Deployed Content
          </h2>

          <table style={{ width: '100%', fontFamily: "'Fakt', system-ui, sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: C.slate }}>Content</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: C.slate }}>Type</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: C.slate }}>Deployed To</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: C.slate }}>Deployed By</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: C.slate }}>Date</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: C.slate }}>Performance</th>
              </tr>
            </thead>
            <tbody>
              {deployedContent.map((item) => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: C.dark, fontWeight: '500' }}>{item.content}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: C.slate }}>{item.type}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: C.slate }}>{item.deployedTo}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: C.slate }}>{item.deployedBy}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: C.slate }}>{item.date}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: C.green, fontWeight: '500' }}>{item.performance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl p-6" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: "'Fakt', system-ui, sans-serif", fontSize: '0.875rem', color: C.slate, marginBottom: '0.5rem' }}>
              Total Templates
            </div>
            <div style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", fontSize: '2.5rem', fontWeight: '600', color: C.dark }}>
              156
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: "'Fakt', system-ui, sans-serif", fontSize: '0.875rem', color: C.slate, marginBottom: '0.5rem' }}>
              Deployments This Month
            </div>
            <div style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", fontSize: '2.5rem', fontWeight: '600', color: C.dark }}>
              89
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: "'Fakt', system-ui, sans-serif", fontSize: '0.875rem', color: C.slate, marginBottom: '0.5rem' }}>
              Most Popular
            </div>
            <div style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", fontSize: '1.5rem', fontWeight: '600', color: C.dark }}>
              Monthly Newsletter
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
