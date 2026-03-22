'use client';

import React, { useState } from 'react';
import {
  EnvelopeIcon,
  DocumentTextIcon,
  ChartBarSquareIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
  rose: '#e11d48',
  roseBg: 'rgba(225,29,72,0.08)',
};

// Mock data for content types
const contentTypes = [
  {
    id: 'newsletter',
    icon: EnvelopeIcon,
    title: 'Newsletter',
    description: 'Weekly & monthly newsletters',
    count: 12,
    accentColor: C.teal,
  },
  {
    id: 'blog',
    icon: DocumentTextIcon,
    title: 'Blog Post',
    description: 'Thought leadership & insights',
    count: 8,
    accentColor: C.blue,
  },
  {
    id: 'commentary',
    icon: ChartBarSquareIcon,
    title: 'Market Commentary',
    description: 'Weekly market analysis',
    count: 15,
    accentColor: C.purple,
  },
  {
    id: 'social',
    icon: ChatBubbleLeftRightIcon,
    title: 'Social Media',
    description: 'Multi-platform content',
    count: 34,
    accentColor: C.green,
  },
  {
    id: 'video',
    icon: VideoCameraIcon,
    title: 'Video Script',
    description: 'Video content & scripts',
    count: 6,
    accentColor: C.amber,
  },
  {
    id: 'email',
    icon: PaperAirplaneIcon,
    title: 'Email Campaign',
    description: 'Drip sequences & blasts',
    count: 18,
    accentColor: C.rose,
  },
];

// Mock data for recent drafts
const recentDrafts = [
  {
    title: 'Q1 2026 Market Outlook',
    type: 'Commentary',
    author: 'Ryan Thompson',
    status: 'Draft',
    lastModified: '2h ago',
  },
  {
    title: 'Advisor Spotlight: Chicago Team',
    type: 'Blog',
    author: 'Mei Lin',
    status: 'In Review',
    lastModified: '4h ago',
  },
  {
    title: 'March Newsletter',
    type: 'Newsletter',
    author: 'Sarah Chen',
    status: 'Approved',
    lastModified: '1d ago',
  },
  {
    title: 'Tax Season Tips for UHNW',
    type: 'Blog',
    author: 'Mei Lin',
    status: 'Draft',
    lastModified: '1d ago',
  },
  {
    title: 'Retirement Planning Webinar Recap',
    type: 'Blog',
    author: 'Sarah Chen',
    status: 'Published',
    lastModified: '2d ago',
  },
  {
    title: 'Social: Market Rally Reaction',
    type: 'Social',
    author: 'Aisha Williams',
    status: 'Scheduled',
    lastModified: '3h ago',
  },
  {
    title: 'Client Welcome Email Series',
    type: 'Email',
    author: 'David Kim',
    status: 'In Review',
    lastModified: '5h ago',
  },
  {
    title: 'Investment Philosophy Video',
    type: 'Video',
    author: 'Chris Anderson',
    status: 'Draft',
    lastModified: '2d ago',
  },
];

// Mock data for templates
const templates = [
  {
    name: 'Quarterly Commentary',
    category: 'Market Analysis',
    useCount: 48,
    color: C.purple,
  },
  {
    name: 'Advisor Bio',
    category: 'Team Profile',
    useCount: 23,
    color: C.teal,
  },
  {
    name: 'Market Update Email',
    category: 'Email',
    useCount: 67,
    color: C.blue,
  },
  {
    name: 'Social Post Bundle',
    category: 'Social Media',
    useCount: 92,
    color: C.green,
  },
  {
    name: 'Client Newsletter',
    category: 'Newsletter',
    useCount: 34,
    color: C.amber,
  },
  {
    name: 'Webinar Invite',
    category: 'Event',
    useCount: 29,
    color: C.rose,
  },
  {
    name: 'Video Script',
    category: 'Video',
    useCount: 18,
    color: C.purple,
  },
  {
    name: 'Case Study',
    category: 'Thought Leadership',
    useCount: 12,
    color: C.teal,
  },
];

// Mock data for content by type chart
const contentByType = [
  { name: 'Blog', value: 28, color: C.blue },
  { name: 'Social', value: 35, color: C.green },
  { name: 'Email', value: 18, color: C.rose },
  { name: 'Newsletter', value: 12, color: C.teal },
  { name: 'Video', value: 7, color: C.amber },
];

// Mock data for publishing velocity
const publishingVelocity = [
  { week: 'Week 1', pieces: 8 },
  { week: 'Week 2', pieces: 12 },
  { week: 'Week 3', pieces: 10 },
  { week: 'Week 4', pieces: 15 },
  { week: 'Week 5', pieces: 18 },
  { week: 'Week 6', pieces: 14 },
  { week: 'Week 7', pieces: 20 },
  { week: 'Week 8', pieces: 16 },
];

// Engagement metrics
const engagementMetrics = [
  { label: 'Open Rate', value: '42.3%', color: C.green },
  { label: 'Click Rate', value: '8.7%', color: C.blue },
  { label: 'Share Rate', value: '3.2%', color: C.purple },
  { label: 'Conversion', value: '1.8%', color: C.teal },
];

// Status badge styling
const getStatusStyle = (status: string) => {
  const styles = {
    Draft: { bg: C.bg, text: C.slate, border: C.border },
    'In Review': { bg: C.purpleBg, text: C.purple, border: C.purple },
    Approved: { bg: C.greenBg, text: C.green, border: C.green },
    Published: { bg: 'rgba(29,118,130,0.10)', text: C.teal, border: C.teal },
    Scheduled: { bg: C.blueBg, text: C.blue, border: C.blue },
  };
  return styles[status as keyof typeof styles] || styles.Draft;
};

export default function ContentStudioPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen p-8 space-y-6" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
        >
          Content Studio
        </h1>
        <p className="text-lg" style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}>
          Create, manage, and deploy marketing content across all channels
        </p>
      </div>

      {/* Content Type Action Cards */}
      <div className="grid grid-cols-3 gap-4">
        {contentTypes.map((type) => {
          const Icon = type.icon;
          return (
            <div
              key={type.id}
              className="bg-white rounded-xl p-5 hover:shadow-md transition-shadow duration-200 cursor-pointer"
              style={{
                borderLeft: `4px solid ${type.accentColor}`,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${type.accentColor}15` }}
                >
                  <Icon className="w-8 h-8" style={{ color: type.accentColor }} />
                </div>
                <span
                  className="px-2 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: `${type.accentColor}20`,
                    color: type.accentColor,
                  }}
                >
                  {type.count} active
                </span>
              </div>
              <h3
                className="text-lg font-semibold mb-1"
                style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
              >
                {type.title}
              </h3>
              <p
                className="text-sm mb-4"
                style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}
              >
                {type.description}
              </p>
              <button
                className="w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 hover:opacity-90"
                style={{
                  backgroundColor: type.accentColor,
                  color: 'white',
                  fontFamily: "'Fakt', system-ui, sans-serif",
                }}
              >
                Create New
              </button>
            </div>
          );
        })}
      </div>

      {/* Recent Drafts Table */}
      <div className="bg-white rounded-xl p-6" style={{ border: `1px solid ${C.border}` }}>
        <h2
          className="text-2xl font-bold mb-4"
          style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
        >
          Recent Drafts
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th
                  className="text-left py-3 px-4 font-semibold text-sm"
                  style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}
                >
                  Title
                </th>
                <th
                  className="text-left py-3 px-4 font-semibold text-sm"
                  style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}
                >
                  Type
                </th>
                <th
                  className="text-left py-3 px-4 font-semibold text-sm"
                  style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}
                >
                  Author
                </th>
                <th
                  className="text-left py-3 px-4 font-semibold text-sm"
                  style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}
                >
                  Status
                </th>
                <th
                  className="text-left py-3 px-4 font-semibold text-sm"
                  style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}
                >
                  Last Modified
                </th>
                <th
                  className="text-left py-3 px-4 font-semibold text-sm"
                  style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {recentDrafts.map((draft, idx) => {
                const statusStyle = getStatusStyle(draft.status);
                return (
                  <tr
                    key={idx}
                    className="hover:bg-opacity-50 transition-colors"
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      backgroundColor: 'transparent',
                    }}
                  >
                    <td
                      className="py-3 px-4 font-medium"
                      style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.dark }}
                    >
                      {draft.title}
                    </td>
                    <td
                      className="py-3 px-4"
                      style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}
                    >
                      {draft.type}
                    </td>
                    <td
                      className="py-3 px-4"
                      style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}
                    >
                      {draft.author}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.text,
                          border: `1px solid ${statusStyle.border}20`,
                          fontFamily: "'Fakt', system-ui, sans-serif",
                        }}
                      >
                        {draft.status}
                      </span>
                    </td>
                    <td
                      className="py-3 px-4"
                      style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}
                    >
                      {draft.lastModified}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 rounded-sm hover:bg-opacity-10 transition-colors"
                          style={{ color: C.slate }}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-sm hover:bg-opacity-10 transition-colors"
                          style={{ color: C.slate }}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-sm hover:bg-opacity-10 transition-colors"
                          style={{ color: C.slate }}
                        >
                          <EllipsisVerticalIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Template Grid */}
      <div className="bg-white rounded-xl p-6" style={{ border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            Content Templates
          </h2>
          <div className="relative">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
              style={{ color: C.slate }}
            />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg text-sm"
              style={{
                border: `1px solid ${C.border}`,
                fontFamily: "'Fakt', system-ui, sans-serif",
                color: C.dark,
                backgroundColor: C.bg,
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {templates.map((template, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
              style={{ border: `1px solid ${C.border}` }}
            >
              <div
                className="h-2 rounded-t-xl"
                style={{ backgroundColor: template.color }}
              />
              <div className="p-4">
                <h3
                  className="font-semibold mb-2"
                  style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
                >
                  {template.name}
                </h3>
                <span
                  className="inline-block px-2 py-1 rounded-sm text-xs font-medium mb-3"
                  style={{
                    backgroundColor: C.bg,
                    color: C.slate,
                    fontFamily: "'Fakt', system-ui, sans-serif",
                  }}
                >
                  {template.category}
                </span>
                <p
                  className="text-xs"
                  style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}
                >
                  Used {template.useCount} times
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generation Stats */}
      <div className="grid grid-cols-3 gap-6">
        {/* Content by Type */}
        <div className="bg-white rounded-xl p-6" style={{ border: `1px solid ${C.border}` }}>
          <h3
            className="text-xl font-bold mb-4"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            Content by Type
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={contentByType}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {contentByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {contentByType.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span
                    className="text-sm"
                    style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}
                  >
                    {item.name}
                  </span>
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.dark }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Publishing Velocity */}
        <div className="bg-white rounded-xl p-6" style={{ border: `1px solid ${C.border}` }}>
          <h3
            className="text-xl font-bold mb-4"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            Publishing Velocity
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={publishingVelocity}>
              <defs>
                <linearGradient id="colorPieces" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.teal} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="week"
                tick={{ fill: C.slate, fontSize: 12 }}
                axisLine={{ stroke: C.border }}
              />
              <YAxis
                tick={{ fill: C.slate, fontSize: 12 }}
                axisLine={{ stroke: C.border }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  fontFamily: "'Fakt', system-ui, sans-serif",
                }}
              />
              <Area
                type="monotone"
                dataKey="pieces"
                stroke={C.teal}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPieces)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement Metrics */}
        <div className="bg-white rounded-xl p-6" style={{ border: `1px solid ${C.border}` }}>
          <h3
            className="text-xl font-bold mb-4"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            Engagement Metrics
          </h3>
          <div className="space-y-4 mt-8">
            {engagementMetrics.map((metric, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg"
                style={{ backgroundColor: `${metric.color}10`, border: `1px solid ${metric.color}30` }}
              >
                <p
                  className="text-xs font-medium mb-1"
                  style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: metric.color }}
                >
                  {metric.label}
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: metric.color }}
                >
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
