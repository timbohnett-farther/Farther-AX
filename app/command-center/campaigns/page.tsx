'use client';

import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const C = {
  dark: '#e0dbd3',
  white: '#121212',
  slate: '#8a8a8a',
  teal: '#1d7682',
  bg: '#121212',
  cardBg: '#1e1e1e',
  border: '#2a2a2a',
  green: '#4CAF50',
  greenBg: 'rgba(76,175,80,0.10)',
  amber: '#FFB74D',
  amberBg: 'rgba(255,183,77,0.10)',
  red: '#EF5350',
  redBg: 'rgba(239,83,80,0.10)',
  purple: '#7c3aed',
  purpleBg: 'rgba(124,58,237,0.08)',
  blue: '#2563eb',
  blueBg: 'rgba(37,99,235,0.08)',
};

const activeCampaigns = [
  { name: 'Spring Advisor Recruitment', status: 'Active', sent: 2450, openRate: 42.1, clickRate: 8.3, conversions: 34 },
  { name: 'Tax Planning Webinar Series', status: 'Active', sent: 1890, openRate: 51.2, clickRate: 12.7, conversions: 67 },
  { name: 'Q1 Market Commentary', status: 'Completed', sent: 3200, openRate: 38.9, clickRate: 6.1, conversions: 28 },
  { name: 'New Client Welcome', status: 'Active', sent: 560, openRate: 62.3, clickRate: 15.4, conversions: 42 },
  { name: 'Retirement Planning Guide', status: 'Scheduled', sent: null, openRate: null, clickRate: null, conversions: null },
  { name: 'Advisor Spotlight Series', status: 'Active', sent: 1200, openRate: 44.7, clickRate: 9.8, conversions: 19 },
  { name: 'Estate Planning Workshop', status: 'Draft', sent: null, openRate: null, clickRate: null, conversions: null },
  { name: 'Year-End Review Prep', status: 'Paused', sent: 2100, openRate: 35.2, clickRate: 5.6, conversions: 15 },
];

const campaignStatusData = [
  { name: 'Active', value: 4, color: C.green },
  { name: 'Completed', value: 1, color: C.teal },
  { name: 'Scheduled', value: 1, color: C.blue },
  { name: 'Draft', value: 1, color: C.slate },
  { name: 'Paused', value: 1, color: C.amber },
];

const audienceSegments = [
  { name: 'UHNW Prospects', count: 1240, description: 'High net worth individuals with $5M+ AUM', color: C.blue },
  { name: 'Active Advisors', count: 342, description: 'Advisors with activity in last 30 days', color: C.teal },
  { name: 'Webinar Attendees', count: 876, description: 'Registered for or attended webinars', color: C.purple },
  { name: 'Newsletter Subscribers', count: 4521, description: 'Opted in to monthly newsletter', color: C.green },
  { name: 'Event Registrants', count: 654, description: 'Registered for upcoming events', color: C.amber },
  { name: 'Inactive 90+ Days', count: 796, description: 'No engagement in 90+ days', color: C.red },
];

const nurtureSequences = [
  { name: 'Onboarding Series', enrolled: 248, completed: 186, dropoffRate: 25.0 },
  { name: 'Educational Drip', enrolled: 562, completed: 401, dropoffRate: 28.6 },
  { name: 'Re-engagement Campaign', enrolled: 124, completed: 78, dropoffRate: 37.1 },
  { name: 'Quarterly Check-in', enrolled: 892, completed: 734, dropoffRate: 17.7 },
  { name: 'Event Follow-up', enrolled: 156, completed: 124, dropoffRate: 20.5 },
  { name: 'Content Nurture', enrolled: 423, completed: 298, dropoffRate: 29.6 },
];

const sequenceEnrollmentData = nurtureSequences.map(s => ({
  name: s.name.replace(' Series', '').replace(' Campaign', ''),
  enrolled: s.enrolled,
}));

const emailPerformanceData = [
  { week: 'W1', openRate: 36.2, clickRate: 6.8 },
  { week: 'W2', openRate: 38.1, clickRate: 7.2 },
  { week: 'W3', openRate: 35.9, clickRate: 6.5 },
  { week: 'W4', openRate: 37.4, clickRate: 7.0 },
  { week: 'W5', openRate: 39.2, clickRate: 7.8 },
  { week: 'W6', openRate: 40.1, clickRate: 8.1 },
  { week: 'W7', openRate: 38.7, clickRate: 7.5 },
  { week: 'W8', openRate: 37.9, clickRate: 7.3 },
  { week: 'W9', openRate: 39.8, clickRate: 8.2 },
  { week: 'W10', openRate: 41.2, clickRate: 8.6 },
  { week: 'W11', openRate: 40.5, clickRate: 8.3 },
  { week: 'W12', openRate: 38.6, clickRate: 7.9 },
];

const getStatusBadgeStyle = (status: string) => {
  const styles: Record<string, { bg: string; text: string }> = {
    Active: { bg: C.greenBg, text: C.green },
    Completed: { bg: 'rgba(29,118,130,0.10)', text: C.teal },
    Scheduled: { bg: C.blueBg, text: C.blue },
    Draft: { bg: 'rgba(91,106,113,0.10)', text: C.slate },
    Paused: { bg: C.amberBg, text: C.amber },
  };
  return styles[status] || { bg: C.greenBg, text: C.green };
};

export default function CampaignsPage() {
  return (
    <div className="p-8 space-y-6" style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
        >
          HubSpot Campaigns
        </h1>
        <p
          className="text-lg"
          style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}
        >
          Campaign management, audience segmentation, and nurture automation
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div
          className="rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${C.teal} 0%, #166a75 100%)`,
            color: C.white
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Fakt', system-ui, sans-serif" }}>
                Build Campaign
              </h3>
              <p className="text-sm opacity-90">Create new email campaign</p>
            </div>
            <div className="text-2xl">→</div>
          </div>
        </div>

        <div
          className="rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg"
          style={{
            backgroundColor: C.dark,
            color: C.white
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Fakt', system-ui, sans-serif" }}>
                Segment Audience
              </h3>
              <p className="text-sm opacity-90">Define contact segments</p>
            </div>
            <div className="text-2xl">→</div>
          </div>
        </div>

        <div
          className="rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg"
          style={{
            backgroundColor: 'transparent',
            border: `2px solid ${C.teal}`,
            color: C.teal
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Fakt', system-ui, sans-serif" }}>
                Create Workflow
              </h3>
              <p className="text-sm opacity-90">Build automation sequence</p>
            </div>
            <div className="text-2xl">→</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
          <div className="text-sm mb-1" style={{ color: C.slate, fontFamily: "'Fakt', system-ui, sans-serif" }}>
            Active Campaigns
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold" style={{ color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
              12
            </div>
            <div className="text-xs font-semibold" style={{ color: C.green }}>
              ↑ +3
            </div>
          </div>
          <div className="text-xs mt-1" style={{ color: C.slate }}>from last month</div>
        </div>

        <div className="rounded-xl p-5" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
          <div className="text-sm mb-1" style={{ color: C.slate, fontFamily: "'Fakt', system-ui, sans-serif" }}>
            Total Contacts
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold" style={{ color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
              8,429
            </div>
            <div className="text-xs font-semibold" style={{ color: C.green }}>
              ↑ +12.4%
            </div>
          </div>
          <div className="text-xs mt-1" style={{ color: C.slate }}>growing audience</div>
        </div>

        <div className="rounded-xl p-5" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
          <div className="text-sm mb-1" style={{ color: C.slate, fontFamily: "'Fakt', system-ui, sans-serif" }}>
            Avg Open Rate
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold" style={{ color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
              38.6%
            </div>
            <div className="text-xs font-semibold" style={{ color: C.green }}>
              ↑ +2.1pp
            </div>
          </div>
          <div className="text-xs mt-1" style={{ color: C.slate }}>above industry avg</div>
        </div>

        <div className="rounded-xl p-5" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
          <div className="text-sm mb-1" style={{ color: C.slate, fontFamily: "'Fakt', system-ui, sans-serif" }}>
            Conversion Rate
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold" style={{ color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
              4.2%
            </div>
            <div className="text-xs font-semibold" style={{ color: C.red }}>
              ↓ -0.3pp
            </div>
          </div>
          <div className="text-xs mt-1" style={{ color: C.slate }}>from last period</div>
        </div>
      </div>

      {/* Active Campaigns Section */}
      <div className="grid grid-cols-3 gap-6">
        {/* Campaign Table */}
        <div className="col-span-2 rounded-xl p-6" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            Active Campaigns
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontFamily: "'Fakt', system-ui, sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th className="text-left py-3 px-2 text-sm font-semibold" style={{ color: C.slate }}>Campaign</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold" style={{ color: C.slate }}>Status</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold" style={{ color: C.slate }}>Sent</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold" style={{ color: C.slate }}>Open Rate</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold" style={{ color: C.slate }}>Click Rate</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold" style={{ color: C.slate }}>Conversions</th>
                </tr>
              </thead>
              <tbody>
                {activeCampaigns.map((campaign, idx) => {
                  const statusStyle = getStatusBadgeStyle(campaign.status);
                  return (
                    <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }} className="hover:bg-opacity-50">
                      <td className="py-3 px-2 text-sm" style={{ color: C.dark }}>{campaign.name}</td>
                      <td className="py-3 px-2">
                        <span
                          className="inline-block px-2 py-1 rounded-sm text-xs font-semibold"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-right" style={{ color: C.dark }}>
                        {campaign.sent ? campaign.sent.toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-2 text-sm text-right" style={{ color: C.dark }}>
                        {campaign.openRate ? `${campaign.openRate}%` : '—'}
                      </td>
                      <td className="py-3 px-2 text-sm text-right" style={{ color: C.dark }}>
                        {campaign.clickRate ? `${campaign.clickRate}%` : '—'}
                      </td>
                      <td className="py-3 px-2 text-sm text-right" style={{ color: C.dark }}>
                        {campaign.conversions ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="rounded-xl p-6" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            By Status
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={campaignStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {campaignStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  fontFamily: "'Fakt', system-ui, sans-serif"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {campaignStatusData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span style={{ color: C.dark, fontFamily: "'Fakt', system-ui, sans-serif" }}>{item.name}</span>
                </div>
                <span style={{ color: C.slate, fontFamily: "'Fakt', system-ui, sans-serif" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audience Segments */}
      <div>
        <h2
          className="text-2xl font-bold mb-4"
          style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
        >
          Audience Segments
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {audienceSegments.map((segment, idx) => (
            <div
              key={idx}
              className="rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg"
              style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-2xl font-bold" style={{ color: segment.color, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>
                  {segment.count.toLocaleString()}
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: segment.color }}
                ></div>
              </div>
              <h3 className="text-base font-semibold mb-1" style={{ color: C.dark, fontFamily: "'Fakt', system-ui, sans-serif" }}>
                {segment.name}
              </h3>
              <p className="text-sm" style={{ color: C.slate, fontFamily: "'Fakt', system-ui, sans-serif" }}>
                {segment.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Nurture Sequences */}
      <div className="grid grid-cols-2 gap-6">
        {/* Sequences Table */}
        <div className="rounded-xl p-6" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            Nurture Sequences
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontFamily: "'Fakt', system-ui, sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th className="text-left py-3 px-2 text-sm font-semibold" style={{ color: C.slate }}>Sequence</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold" style={{ color: C.slate }}>Enrolled</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold" style={{ color: C.slate }}>Completed</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold" style={{ color: C.slate }}>Drop-off</th>
                </tr>
              </thead>
              <tbody>
                {nurtureSequences.map((seq, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="py-3 px-2 text-sm" style={{ color: C.dark }}>{seq.name}</td>
                    <td className="py-3 px-2 text-sm text-right" style={{ color: C.dark }}>{seq.enrolled}</td>
                    <td className="py-3 px-2 text-sm text-right" style={{ color: C.dark }}>{seq.completed}</td>
                    <td className="py-3 px-2 text-sm text-right" style={{ color: seq.dropoffRate > 30 ? C.red : C.slate }}>
                      {seq.dropoffRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="rounded-xl p-6" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            Enrollment by Sequence
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sequenceEnrollmentData}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: C.slate }}
                angle={-12}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12, fill: C.slate }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  fontFamily: "'Fakt', system-ui, sans-serif"
                }}
              />
              <Bar dataKey="enrolled" fill={C.teal} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Email Performance */}
      <div className="rounded-xl p-6" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
        <h2
          className="text-2xl font-bold mb-4"
          style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
        >
          Email Performance (Last 12 Weeks)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={emailPerformanceData}>
            <defs>
              <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.teal} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorClick" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.purple} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.purple} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{ fontSize: 12, fill: C.slate }} />
            <YAxis tick={{ fontSize: 12, fill: C.slate }} />
            <Tooltip
              contentStyle={{
                backgroundColor: C.cardBg,
                border: `1px solid ${C.border}`,
                borderRadius: '8px',
                fontFamily: "'Fakt', system-ui, sans-serif"
              }}
            />
            <Legend
              wrapperStyle={{ fontFamily: "'Fakt', system-ui, sans-serif", fontSize: '14px' }}
            />
            <Area
              type="monotone"
              dataKey="openRate"
              stroke={C.teal}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorOpen)"
              name="Open Rate (%)"
            />
            <Area
              type="monotone"
              dataKey="clickRate"
              stroke={C.purple}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorClick)"
              name="Click Rate (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
