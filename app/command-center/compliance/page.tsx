'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const C = {
  dark: '#FAF7F2', white: '#1a1a1a', slate: 'rgba(250,247,242,0.5)',
  teal: '#1d7682', bg: '#111111',
  cardBg: '#2f2f2f', border: 'rgba(250,247,242,0.08)',
  green: '#10b981', greenBg: 'rgba(16,185,129,0.15)',
  amber: '#f59e0b', amberBg: 'rgba(245,158,11,0.15)', amberBorder: 'rgba(245,158,11,0.3)',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.15)', redBorder: 'rgba(239,68,68,0.3)',
  gold: '#f59e0b', goldBg: 'rgba(245,158,11,0.15)',
  purple: '#7c3aed',
  purpleBg: 'rgba(124,58,237,0.08)',
  blue: '#2563eb',
  blueBg: 'rgba(37,99,235,0.08)',
};

// Mock data for Review Queue
const reviewQueue = [
  {
    content: 'Q1 Performance Claims',
    type: 'Blog',
    submittedBy: 'Mei Lin',
    submitted: '2h ago',
    risk: 'High',
    status: 'Pending',
  },
  {
    content: 'Advisor Testimonial Video',
    type: 'Video',
    submittedBy: 'Chris Anderson',
    submitted: '4h ago',
    risk: 'Medium',
    status: 'Pending',
  },
  {
    content: 'Tax Strategy Newsletter',
    type: 'Newsletter',
    submittedBy: 'Sarah Chen',
    submitted: '1d ago',
    risk: 'Low',
    status: 'Approved',
  },
  {
    content: 'Investment Returns Graphic',
    type: 'Social',
    submittedBy: 'Aisha Williams',
    submitted: '1d ago',
    risk: 'Critical',
    status: 'Flagged',
  },
  {
    content: 'Retirement Webinar Script',
    type: 'Script',
    submittedBy: 'Ryan Thompson',
    submitted: '2d ago',
    risk: 'Medium',
    status: 'Approved',
  },
  {
    content: 'Market Commentary March',
    type: 'Commentary',
    submittedBy: 'Mei Lin',
    submitted: '3h ago',
    risk: 'High',
    status: 'In Review',
  },
  {
    content: 'Client Welcome Email',
    type: 'Email',
    submittedBy: 'David Kim',
    submitted: '5h ago',
    risk: 'Low',
    status: 'Approved',
  },
  {
    content: 'Fee Disclosure Update',
    type: 'Document',
    submittedBy: 'Elena Rodriguez',
    submitted: '1d ago',
    risk: 'High',
    status: 'Pending',
  },
];

// Mock data for Compliance Scan Results
const scanResults = [
  {
    content: 'Q1 Newsletter',
    issuesFound: 2,
    severity: 'Medium',
    category: 'Performance Claims',
    autoFixed: 1,
    manualFix: 1,
  },
  {
    content: 'Social: Returns Post',
    issuesFound: 3,
    severity: 'Critical',
    category: 'Misleading Stats',
    autoFixed: 0,
    manualFix: 3,
  },
  {
    content: 'Blog: Tax Tips',
    issuesFound: 0,
    severity: 'None',
    category: '—',
    autoFixed: '—',
    manualFix: '—',
  },
  {
    content: 'Email: Welcome Series',
    issuesFound: 1,
    severity: 'Low',
    category: 'Disclosure Missing',
    autoFixed: 1,
    manualFix: 0,
  },
  {
    content: 'Video: Advisor Story',
    issuesFound: 2,
    severity: 'High',
    category: 'Testimonial Rules',
    autoFixed: 0,
    manualFix: 2,
  },
  {
    content: 'Commentary: Markets',
    issuesFound: 1,
    severity: 'Medium',
    category: 'Forward-Looking',
    autoFixed: 1,
    manualFix: 0,
  },
];

// Mock data for Audit Trail
const auditTrail = [
  {
    timestamp: 'Today 2:34 PM',
    action: 'Approved',
    content: 'Tax Strategy Newsletter',
    user: 'Sarah Chen',
    notes: 'All disclosures present',
  },
  {
    timestamp: 'Today 11:15 AM',
    action: 'Flagged',
    content: 'Investment Returns Graphic',
    user: 'Compliance Bot',
    notes: 'Misleading performance claims',
  },
  {
    timestamp: 'Today 9:22 AM',
    action: 'Revised',
    content: 'Q1 Performance Claims',
    user: 'Mei Lin',
    notes: 'Updated with required disclaimers',
  },
  {
    timestamp: 'Yesterday 4:22 PM',
    action: 'Approved',
    content: 'Retirement Webinar Script',
    user: 'Ryan Thompson',
    notes: 'Compliant language confirmed',
  },
  {
    timestamp: 'Yesterday 2:15 PM',
    action: 'Submitted',
    content: 'Fee Disclosure Update',
    user: 'Elena Rodriguez',
    notes: 'Annual fee schedule update',
  },
  {
    timestamp: 'Yesterday 11:05 AM',
    action: 'Auto-Scanned',
    content: 'Email: Welcome Series',
    user: 'System',
    notes: 'Minor disclosure issue auto-fixed',
  },
  {
    timestamp: 'Yesterday 9:30 AM',
    action: 'Approved',
    content: 'Client Welcome Email',
    user: 'David Kim',
    notes: 'Standard template, no issues',
  },
  {
    timestamp: '2 days ago 3:45 PM',
    action: 'Flagged',
    content: 'Video: Advisor Story',
    user: 'Compliance Bot',
    notes: 'Testimonial rules violation',
  },
  {
    timestamp: '2 days ago 1:20 PM',
    action: 'Revised',
    content: 'Market Commentary March',
    user: 'Mei Lin',
    notes: 'Removed forward-looking statements',
  },
  {
    timestamp: '2 days ago 10:00 AM',
    action: 'Auto-Scanned',
    content: 'Social: Returns Post',
    user: 'System',
    notes: 'Critical issues detected',
  },
];

// Mock data for Brand Standards Checklist
const brandStandards = [
  { category: 'Logo Usage', progress: 100, status: 'Complete' },
  { category: 'Color Palette', progress: 95, status: '1 variance found' },
  { category: 'Typography', progress: 88, status: '2 non-standard fonts' },
  { category: 'Tone of Voice', progress: 72, status: 'Needs improvement' },
  { category: 'Disclaimers', progress: 100, status: 'All present' },
  { category: 'Social Media Guidelines', progress: 65, status: '3 off-brand posts' },
  { category: 'Email Standards', progress: 82, status: 'Minor issues' },
  { category: 'Photography', progress: 50, status: 'Non-compliant images' },
];

// Mock data for Approval Rate Chart
const approvalData = [
  { week: 'W1', Approved: 18, Revised: 5, Rejected: 2 },
  { week: 'W2', Approved: 22, Revised: 4, Rejected: 1 },
  { week: 'W3', Approved: 20, Revised: 6, Rejected: 3 },
  { week: 'W4', Approved: 25, Revised: 3, Rejected: 2 },
  { week: 'W5', Approved: 19, Revised: 7, Rejected: 4 },
  { week: 'W6', Approved: 23, Revised: 5, Rejected: 1 },
  { week: 'W7', Approved: 21, Revised: 4, Rejected: 2 },
  { week: 'W8', Approved: 24, Revised: 6, Rejected: 3 },
  { week: 'W9', Approved: 26, Revised: 3, Rejected: 1 },
  { week: 'W10', Approved: 22, Revised: 5, Rejected: 2 },
  { week: 'W11', Approved: 20, Revised: 7, Rejected: 3 },
  { week: 'W12', Approved: 24, Revised: 4, Rejected: 2 },
];

export default function ComplianceFortress() {
  const getRiskStyle = (risk: string): { color: string; fontWeight?: string } => {
    const styles: Record<string, { color: string; fontWeight?: string }> = {
      Critical: { color: C.red, fontWeight: '700' },
      High: { color: C.red },
      Medium: { color: C.amber },
      Low: { color: C.green },
      None: { color: C.slate },
    };
    return styles[risk] || { color: C.slate };
  };

  const getStatusStyle = (status: string) => {
    const styles = {
      Pending: { bg: C.amberBg, text: C.amber, border: C.amber },
      Flagged: { bg: C.redBg, text: C.red, border: C.red },
      Approved: { bg: C.greenBg, text: C.green, border: C.green },
      'In Review': { bg: C.blueBg, text: C.blue, border: C.blue },
    };
    return styles[status as keyof typeof styles] || { bg: C.amberBg, text: C.amber, border: C.amber };
  };

  const getSeverityStyle = (severity: string): { color: string; fontWeight?: string } => {
    const styles: Record<string, { color: string; fontWeight?: string }> = {
      Critical: { color: C.red, fontWeight: '700' },
      High: { color: C.red },
      Medium: { color: C.amber },
      Low: { color: C.green },
      None: { color: C.slate },
    };
    return styles[severity] || { color: C.slate };
  };

  const getProgressColor = (progress: number) => {
    if (progress > 80) return C.green;
    if (progress >= 60) return C.amber;
    return C.red;
  };

  return (
    <div className="p-8 space-y-6" style={{ fontFamily: "'Fakt', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
        >
          Compliance Fortress
        </h1>
        <p className="text-lg" style={{ color: C.slate }}>
          Content review, regulatory compliance, and brand governance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Pending Review */}
        <div
          className="rounded-xl p-6 border-2"
          style={{
            backgroundColor: C.amberBg,
            borderColor: C.amber,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold mb-1" style={{ color: C.amber }}>
                8
              </div>
              <div className="text-sm font-medium" style={{ color: C.dark }}>
                Pending Review
              </div>
            </div>
            <svg
              className="w-12 h-12"
              style={{ color: C.amber }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Flagged Items */}
        <div
          className="rounded-xl p-6 border-2"
          style={{
            backgroundColor: C.redBg,
            borderColor: C.red,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold mb-1" style={{ color: C.red }}>
                3
              </div>
              <div className="text-sm font-medium" style={{ color: C.dark }}>
                Flagged Items
              </div>
            </div>
            <svg
              className="w-12 h-12"
              style={{ color: C.red }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Approved This Week */}
        <div
          className="rounded-xl p-6 border-2"
          style={{
            backgroundColor: C.greenBg,
            borderColor: C.green,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold mb-1" style={{ color: C.green }}>
                24
              </div>
              <div className="text-sm font-medium" style={{ color: C.dark }}>
                Approved This Week
              </div>
            </div>
            <svg
              className="w-12 h-12"
              style={{ color: C.green }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Review Queue Table */}
      <div className="rounded-xl p-6" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
        <h2
          className="text-2xl font-semibold mb-4"
          style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
        >
          Review Queue
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Content
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Type
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Submitted By
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Submitted
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Risk Level
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {reviewQueue.map((item, idx) => {
                const statusStyle = getStatusStyle(item.status);
                return (
                  <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="py-3 px-4 font-medium" style={{ color: C.dark }}>
                      {item.content}
                    </td>
                    <td className="py-3 px-4" style={{ color: C.slate }}>
                      {item.type}
                    </td>
                    <td className="py-3 px-4" style={{ color: C.slate }}>
                      {item.submittedBy}
                    </td>
                    <td className="py-3 px-4" style={{ color: C.slate }}>
                      {item.submitted}
                    </td>
                    <td className="py-3 px-4 font-semibold" style={getRiskStyle(item.risk)}>
                      {item.risk}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold border"
                        style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.text,
                          borderColor: statusStyle.border,
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.status === 'Pending' && (
                        <button
                          className="px-4 py-1 rounded-md text-sm font-medium"
                          style={{
                            backgroundColor: C.teal,
                            color: C.white,
                          }}
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Scan Results */}
      <div className="rounded-xl p-6" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
        <h2
          className="text-2xl font-semibold mb-4"
          style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
        >
          Compliance Scan Results
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Content
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Issues Found
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Severity
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Category
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Auto-Fixed
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Manual Fix Needed
                </th>
              </tr>
            </thead>
            <tbody>
              {scanResults.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-3 px-4 font-medium" style={{ color: C.dark }}>
                    {item.content}
                  </td>
                  <td className="py-3 px-4" style={{ color: C.slate }}>
                    {item.issuesFound}
                  </td>
                  <td className="py-3 px-4 font-semibold" style={getSeverityStyle(item.severity)}>
                    {item.severity}
                  </td>
                  <td className="py-3 px-4" style={{ color: C.slate }}>
                    {item.category}
                  </td>
                  <td className="py-3 px-4" style={{ color: C.slate }}>
                    {item.autoFixed}
                  </td>
                  <td className="py-3 px-4" style={{ color: C.slate }}>
                    {item.manualFix}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="rounded-xl p-6" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
        <h2
          className="text-2xl font-semibold mb-4"
          style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
        >
          Audit Trail
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Timestamp
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Action
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Content
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  User
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: C.slate }}>
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {auditTrail.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-3 px-4" style={{ color: C.slate }}>
                    {item.timestamp}
                  </td>
                  <td className="py-3 px-4 font-medium" style={{ color: C.dark }}>
                    {item.action}
                  </td>
                  <td className="py-3 px-4" style={{ color: C.slate }}>
                    {item.content}
                  </td>
                  <td className="py-3 px-4" style={{ color: C.slate }}>
                    {item.user}
                  </td>
                  <td className="py-3 px-4 text-sm" style={{ color: C.slate }}>
                    {item.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Brand Standards Checklist */}
      <div className="rounded-xl p-6" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
        <h2
          className="text-2xl font-semibold mb-4"
          style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
        >
          Brand Standards Checklist
        </h2>
        <div className="space-y-4">
          {brandStandards.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ color: C.dark }}>
                  {item.category}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: C.slate }}>
                    {item.status}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: C.dark }}>
                    {item.progress}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: C.border }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${item.progress}%`,
                    backgroundColor: getProgressColor(item.progress),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approval Rate Chart */}
      <div className="rounded-xl p-6" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
        <h2
          className="text-2xl font-semibold mb-4"
          style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
        >
          Approval Rate Trends
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={approvalData}>
            <XAxis dataKey="week" stroke={C.slate} />
            <YAxis stroke={C.slate} />
            <Tooltip
              contentStyle={{
                backgroundColor: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="Approved" stackId="a" fill={C.green} />
            <Bar dataKey="Revised" stackId="a" fill={C.amber} />
            <Bar dataKey="Rejected" stackId="a" fill={C.red} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
