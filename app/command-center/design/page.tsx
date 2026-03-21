'use client';

import React, { useState } from 'react';

const C = {
  dark: '#333333',
  white: '#FAF7F2',
  slate: '#5b6a71',
  teal: '#1d7682',
  bg: '#FAF7F2',
  cardBg: '#FDFAF5',
  border: '#e8e2d9',
  green: '#27ae60',
  greenBg: 'rgba(39,174,96,0.10)',
  amber: '#b27d2e',
  amberBg: 'rgba(178,125,46,0.08)',
  red: '#c0392b',
  redBg: 'rgba(192,57,43,0.08)',
  purple: '#7c3aed',
  purpleBg: 'rgba(124,58,237,0.08)',
  blue: '#2563eb',
  blueBg: 'rgba(37,99,235,0.08)',
};

// Mock data
const templates = [
  { id: 1, name: 'Advisor Intro Deck', category: 'Presentations', uses: 24, gradient: 'from-teal-400 to-blue-500' },
  { id: 2, name: 'Quarterly Review Pres', category: 'Presentations', uses: 18, gradient: 'from-blue-500 to-purple-600' },
  { id: 3, name: 'Social Post Kit', category: 'Social', uses: 42, gradient: 'from-purple-500 to-pink-500' },
  { id: 4, name: 'Newsletter Header', category: 'Email', uses: 31, gradient: 'from-amber-400 to-orange-500' },
  { id: 5, name: 'Event Invite', category: 'Print', uses: 15, gradient: 'from-green-400 to-teal-500' },
  { id: 6, name: 'Market Recap Slides', category: 'Presentations', uses: 27, gradient: 'from-cyan-400 to-blue-600' },
  { id: 7, name: 'Client Proposal', category: 'Presentations', uses: 19, gradient: 'from-indigo-500 to-purple-600' },
  { id: 8, name: 'Brand Guidelines', category: 'Print', uses: 8, gradient: 'from-rose-400 to-red-500' },
];

const projects = [
  { id: 1, project: 'Annual Report 2025', designer: 'Priya Patel', type: 'Print', status: 'In Progress', priority: 'High', dueDate: 'Apr 1', progress: 65 },
  { id: 2, project: 'Website Redesign Mockups', designer: 'Priya Patel', type: 'Digital', status: 'Review', priority: 'Critical', dueDate: 'Mar 25', progress: 90 },
  { id: 3, project: 'Social Media Kit Q2', designer: 'Aisha Williams', type: 'Social', status: 'In Progress', priority: 'Medium', dueDate: 'Apr 10', progress: 40 },
  { id: 4, project: 'Advisor Profile Cards', designer: 'Priya Patel', type: 'Print', status: 'Completed', priority: 'Low', dueDate: 'Mar 18', progress: 100 },
  { id: 5, project: 'Event Banners', designer: 'Chris Anderson', type: 'Digital', status: 'In Progress', priority: 'High', dueDate: 'Mar 28', progress: 55 },
  { id: 6, project: 'Email Newsletter Redesign', designer: 'David Kim', type: 'Email', status: 'Planning', priority: 'Medium', dueDate: 'Apr 15', progress: 10 },
];

const kanbanData = {
  backlog: [
    { id: 1, title: 'LinkedIn Banner Update', assignee: 'PP' },
    { id: 2, title: 'Podcast Cover Art', assignee: 'AW' },
    { id: 3, title: 'Infographic Template', assignee: 'DK' },
  ],
  inProgress: [
    { id: 4, title: 'Annual Report 2025', assignee: 'PP' },
    { id: 5, title: 'Social Media Kit Q2', assignee: 'AW' },
    { id: 6, title: 'Event Banners', assignee: 'CA' },
    { id: 7, title: 'Presentation Template', assignee: 'PP' },
  ],
  review: [
    { id: 8, title: 'Website Redesign Mockups', assignee: 'PP' },
    { id: 9, title: 'Email Header Design', assignee: 'DK' },
  ],
  done: [
    { id: 10, title: 'Advisor Profile Cards', assignee: 'PP' },
    { id: 11, title: 'Brand Color Update', assignee: 'AW' },
    { id: 12, title: 'Icon Set Expansion', assignee: 'CA' },
  ],
};

const assets = [
  { id: 1, filename: 'logo-primary.svg', type: 'SVG', size: '24 KB', color: 'bg-gradient-to-br from-teal-500 to-teal-600' },
  { id: 2, filename: 'logo-white.png', type: 'PNG', size: '48 KB', color: 'bg-gradient-to-br from-slate-700 to-slate-800' },
  { id: 3, filename: 'icon-wealth.svg', type: 'SVG', size: '12 KB', color: 'bg-gradient-to-br from-amber-500 to-orange-600' },
  { id: 4, filename: 'hero-office.jpg', type: 'JPG', size: '1.2 MB', color: 'bg-gradient-to-br from-blue-400 to-blue-600' },
  { id: 5, filename: 'pattern-gold.png', type: 'PNG', size: '156 KB', color: 'bg-gradient-to-br from-yellow-400 to-amber-500' },
  { id: 6, filename: 'advisor-headshot-template.ai', type: 'AI', size: '2.4 MB', color: 'bg-gradient-to-br from-purple-500 to-purple-600' },
  { id: 7, filename: 'social-template-1.png', type: 'PNG', size: '384 KB', color: 'bg-gradient-to-br from-pink-500 to-rose-600' },
  { id: 8, filename: 'email-header.png', type: 'PNG', size: '256 KB', color: 'bg-gradient-to-br from-green-500 to-emerald-600' },
  { id: 9, filename: 'presentation-bg.jpg', type: 'JPG', size: '892 KB', color: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
  { id: 10, filename: 'brand-colors.pdf', type: 'PDF', size: '64 KB', color: 'bg-gradient-to-br from-red-500 to-rose-600' },
  { id: 11, filename: 'icon-set.svg', type: 'SVG', size: '36 KB', color: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
  { id: 12, filename: 'event-banner.psd', type: 'PSD', size: '3.1 MB', color: 'bg-gradient-to-br from-violet-500 to-purple-600' },
];

export default function DesignPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [assetFilter, setAssetFilter] = useState('All Types');

  const filteredTemplates = activeFilter === 'All'
    ? templates
    : templates.filter(t => t.category === activeFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-700 bg-green-50';
      case 'In Progress': return 'text-blue-700 bg-blue-50';
      case 'Review': return 'text-purple-700 bg-purple-50';
      case 'Planning': return 'text-slate-600 bg-slate-50';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-700 bg-red-50';
      case 'High': return 'text-orange-700 bg-orange-50';
      case 'Medium': return 'text-amber-700 bg-amber-50';
      case 'Low': return 'text-slate-600 bg-slate-50';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-teal-400 to-teal-600',
      'from-purple-400 to-purple-600',
      'from-amber-400 to-amber-600',
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div style={{
      backgroundColor: C.bg,
      minHeight: '100vh',
      fontFamily: "'Fakt', system-ui, sans-serif"
    }} className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 style={{
          fontFamily: "'ABC Arizona Text', Georgia, serif",
          color: C.dark,
        }} className="text-4xl font-bold mb-2">
          Design & Visuals
        </h1>
        <p style={{ color: C.slate }} className="text-lg">
          Visual asset creation, brand management, and design pipeline
        </p>
      </div>

      {/* Quick Create Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { title: 'Presentation', icon: '📊', gradient: 'from-teal-500 to-blue-500' },
          { title: 'Social Graphics', icon: '📱', gradient: 'from-purple-500 to-pink-500' },
          { title: 'Email Template', icon: '✉️', gradient: 'from-amber-500 to-orange-500' },
          { title: 'Brand Asset', icon: '🎨', gradient: 'from-green-500 to-teal-500' },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: C.white,
              borderColor: C.border,
            }}
            className="border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className={`h-1 w-full mb-4 rounded-full bg-gradient-to-r ${item.gradient}`}></div>
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 style={{ color: C.dark }} className="font-semibold text-lg mb-2">
              {item.title}
            </h3>
            <button
              style={{
                color: C.teal,
                borderColor: C.border,
              }}
              className="mt-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Create →
            </button>
          </div>
        ))}
      </div>

      {/* Gamma Template Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{
            fontFamily: "'ABC Arizona Text', Georgia, serif",
            color: C.dark,
          }} className="text-2xl font-bold">
            Gamma Templates
          </h2>
          <div className="flex gap-2">
            {['All', 'Presentations', 'Social', 'Email', 'Print'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  backgroundColor: activeFilter === filter ? C.teal : 'transparent',
                  color: activeFilter === filter ? C.white : C.slate,
                  borderColor: C.border,
                }}
                className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              style={{
                backgroundColor: C.white,
                borderColor: C.border,
              }}
              className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className={`h-40 bg-gradient-to-br ${template.gradient}`}></div>
              <div className="p-4">
                <h3 style={{ color: C.dark }} className="font-semibold mb-2">
                  {template.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span style={{
                    backgroundColor: C.blueBg,
                    color: C.blue,
                  }} className="text-xs px-2 py-1 rounded">
                    {template.category}
                  </span>
                  <span style={{ color: C.slate }} className="text-xs">
                    Used {template.uses} times
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Design Projects Table */}
      <div style={{
        backgroundColor: C.white,
        borderColor: C.border,
      }} className="border rounded-xl overflow-hidden">
        <div style={{
          backgroundColor: C.cardBg,
          borderColor: C.border,
        }} className="px-6 py-4 border-b">
          <h2 style={{
            fontFamily: "'ABC Arizona Text', Georgia, serif",
            color: C.dark,
          }} className="text-xl font-bold">
            Active Design Projects
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: C.cardBg }}>
              <tr>
                <th style={{ color: C.slate }} className="text-left px-6 py-3 text-sm font-semibold">Project</th>
                <th style={{ color: C.slate }} className="text-left px-6 py-3 text-sm font-semibold">Designer</th>
                <th style={{ color: C.slate }} className="text-left px-6 py-3 text-sm font-semibold">Type</th>
                <th style={{ color: C.slate }} className="text-left px-6 py-3 text-sm font-semibold">Status</th>
                <th style={{ color: C.slate }} className="text-left px-6 py-3 text-sm font-semibold">Priority</th>
                <th style={{ color: C.slate }} className="text-left px-6 py-3 text-sm font-semibold">Due Date</th>
                <th style={{ color: C.slate }} className="text-left px-6 py-3 text-sm font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, idx) => (
                <tr key={project.id} style={{
                  borderColor: C.border,
                }} className={idx !== projects.length - 1 ? 'border-b' : ''}>
                  <td style={{ color: C.dark }} className="px-6 py-4 font-medium">{project.project}</td>
                  <td style={{ color: C.slate }} className="px-6 py-4">{project.designer}</td>
                  <td style={{ color: C.slate }} className="px-6 py-4">{project.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                  </td>
                  <td style={{ color: C.slate }} className="px-6 py-4">{project.dueDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div style={{ backgroundColor: C.border }} className="flex-1 h-2 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: `${project.progress}%`,
                            backgroundColor: project.progress === 100 ? C.green : C.teal,
                          }}
                          className="h-full transition-all"
                        ></div>
                      </div>
                      <span style={{ color: C.slate }} className="text-sm font-medium w-10">
                        {project.progress}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mini Kanban Pipeline */}
      <div>
        <h2 style={{
          fontFamily: "'ABC Arizona Text', Georgia, serif",
          color: C.dark,
        }} className="text-2xl font-bold mb-4">
          Design Pipeline
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { title: 'Backlog', items: kanbanData.backlog, borderColor: 'border-slate-400' },
            { title: 'In Progress', items: kanbanData.inProgress, borderColor: 'border-blue-400' },
            { title: 'Review', items: kanbanData.review, borderColor: 'border-purple-400' },
            { title: 'Done', items: kanbanData.done, borderColor: 'border-green-400' },
          ].map(column => (
            <div key={column.title}>
              <div style={{
                backgroundColor: C.cardBg,
                borderColor: C.border,
              }} className={`border-t-2 ${column.borderColor} rounded-t-xl px-4 py-3 flex items-center justify-between`}>
                <h3 style={{ color: C.dark }} className="font-semibold">{column.title}</h3>
                <span style={{
                  backgroundColor: C.slate,
                  color: C.white,
                }} className="text-xs px-2 py-1 rounded-full">
                  {column.items.length}
                </span>
              </div>
              <div style={{
                backgroundColor: C.white,
                borderColor: C.border,
              }} className="border border-t-0 rounded-b-xl p-3 space-y-2 min-h-[200px]">
                {column.items.map(item => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: C.cardBg,
                      borderColor: C.border,
                    }}
                    className="border rounded-lg p-3 hover:shadow-sm transition-shadow cursor-move"
                  >
                    <p style={{ color: C.dark }} className="text-sm font-medium mb-2">
                      {item.title}
                    </p>
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarColor(item.assignee)} flex items-center justify-center text-white text-xs font-semibold`}>
                        {item.assignee}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Library Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{
            fontFamily: "'ABC Arizona Text', Georgia, serif",
            color: C.dark,
          }} className="text-2xl font-bold">
            Asset Library
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search assets..."
              style={{
                backgroundColor: C.white,
                borderColor: C.border,
                color: C.dark,
              }}
              className="px-4 py-2 border rounded-lg w-64"
            />
            <select
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
              style={{
                backgroundColor: C.white,
                borderColor: C.border,
                color: C.dark,
              }}
              className="px-4 py-2 border rounded-lg"
            >
              <option>All Types</option>
              <option>Logos</option>
              <option>Icons</option>
              <option>Photos</option>
              <option>Templates</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-3">
          {assets.map(asset => (
            <div
              key={asset.id}
              style={{
                backgroundColor: C.white,
                borderColor: C.border,
              }}
              className="border rounded-lg overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className={`h-24 ${asset.color}`}></div>
              <div className="p-3">
                <p style={{ color: C.dark }} className="text-xs font-medium mb-2 truncate" title={asset.filename}>
                  {asset.filename}
                </p>
                <div className="flex items-center justify-between">
                  <span style={{
                    backgroundColor: C.amberBg,
                    color: C.amber,
                  }} className="text-xs px-2 py-1 rounded">
                    {asset.type}
                  </span>
                  <span style={{ color: C.slate }} className="text-xs">
                    {asset.size}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
