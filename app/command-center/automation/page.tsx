'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Design Tokens
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

// Mock Data
const integrations = [
  {
    name: 'HubSpot',
    status: 'Connected',
    lastSync: '2m ago',
    dataSynced: '8,429 contacts synced',
    accent: '#f97316',
    initial: 'H',
  },
  {
    name: 'Google Workspace',
    status: 'Connected',
    lastSync: '5m ago',
    dataSynced: '156 docs synced',
    accent: '#3b82f6',
    initial: 'G',
  },
  {
    name: 'Gamma',
    status: 'Connected',
    lastSync: '15m ago',
    dataSynced: '34 presentations',
    accent: '#7c3aed',
    initial: 'G',
  },
  {
    name: 'Claude AI',
    status: 'Connected',
    lastSync: '1m ago',
    dataSynced: '1,247 generations',
    accent: '#1d7682',
    initial: 'C',
  },
  {
    name: 'Slack',
    status: 'Connected',
    lastSync: '30s ago',
    dataSynced: '89 channels',
    accent: '#eab308',
    initial: 'S',
  },
  {
    name: 'Zapier',
    status: 'Degraded',
    lastSync: '45m ago',
    dataSynced: '12 active zaps',
    accent: '#ea580c',
    initial: 'Z',
  },
];

const apiMetrics = [
  { label: 'API Uptime', value: '99.97%' },
  { label: 'Avg Response', value: '142ms' },
  { label: 'Requests Today', value: '12,847' },
  { label: 'Error Rate', value: '0.03%' },
];

const apiResponseData = [
  { time: '00:00', ms: 120 },
  { time: '01:00', ms: 135 },
  { time: '02:00', ms: 128 },
  { time: '03:00', ms: 142 },
  { time: '04:00', ms: 155 },
  { time: '05:00', ms: 148 },
  { time: '06:00', ms: 138 },
  { time: '07:00', ms: 145 },
  { time: '08:00', ms: 152 },
  { time: '09:00', ms: 168 },
  { time: '10:00', ms: 175 },
  { time: '11:00', ms: 162 },
  { time: '12:00', ms: 158 },
  { time: '13:00', ms: 165 },
  { time: '14:00', ms: 149 },
  { time: '15:00', ms: 142 },
  { time: '16:00', ms: 138 },
  { time: '17:00', ms: 145 },
  { time: '18:00', ms: 132 },
  { time: '19:00', ms: 128 },
  { time: '20:00', ms: 125 },
  { time: '21:00', ms: 118 },
  { time: '22:00', ms: 122 },
  { time: '23:00', ms: 115 },
];

const webhooks = [
  {
    endpoint: '/api/hubspot/contacts',
    method: 'POST',
    source: 'HubSpot',
    status: 'Active',
    lastTriggered: '2m ago',
    successRate: '99.8%',
  },
  {
    endpoint: '/api/hubspot/campaigns',
    method: 'POST',
    source: 'HubSpot',
    status: 'Active',
    lastTriggered: '15m ago',
    successRate: '99.5%',
  },
  {
    endpoint: '/api/gamma/render',
    method: 'POST',
    source: 'Gamma',
    status: 'Active',
    lastTriggered: '1h ago',
    successRate: '98.2%',
  },
  {
    endpoint: '/api/slack/notify',
    method: 'POST',
    source: 'Slack',
    status: 'Active',
    lastTriggered: '30s ago',
    successRate: '100%',
  },
  {
    endpoint: '/api/claude/generate',
    method: 'POST',
    source: 'Claude AI',
    status: 'Active',
    lastTriggered: '5m ago',
    successRate: '99.9%',
  },
  {
    endpoint: '/api/zapier/trigger',
    method: 'POST',
    source: 'Zapier',
    status: 'Degraded',
    lastTriggered: '45m ago',
    successRate: '94.1%',
  },
];

const logs = [
  {
    timestamp: 'Today 3:42 PM',
    integration: 'HubSpot',
    event: 'Contact Sync',
    status: 'Success',
    duration: '234ms',
    details: 'Synced 12 contacts',
  },
  {
    timestamp: 'Today 3:41 PM',
    integration: 'Slack',
    event: 'Notification',
    status: 'Success',
    duration: '89ms',
    details: 'Sent to #marketing',
  },
  {
    timestamp: 'Today 3:40 PM',
    integration: 'Claude AI',
    event: 'Content Generation',
    status: 'Success',
    duration: '1,247ms',
    details: 'Generated campaign copy',
  },
  {
    timestamp: 'Today 3:38 PM',
    integration: 'HubSpot',
    event: 'Campaign Sync',
    status: 'Success',
    duration: '456ms',
    details: 'Updated 3 campaigns',
  },
  {
    timestamp: 'Today 3:35 PM',
    integration: 'Gamma',
    event: 'Template Render',
    status: 'Warning',
    duration: '2,341ms',
    details: 'Slow response time',
  },
  {
    timestamp: 'Today 3:30 PM',
    integration: 'Google Workspace',
    event: 'Doc Sync',
    status: 'Success',
    duration: '678ms',
    details: 'Synced 4 documents',
  },
  {
    timestamp: 'Today 3:15 PM',
    integration: 'Zapier',
    event: 'Zap Trigger',
    status: 'Error',
    duration: '0ms',
    details: 'Connection timeout',
  },
  {
    timestamp: 'Today 3:10 PM',
    integration: 'HubSpot',
    event: 'Contact Sync',
    status: 'Success',
    duration: '189ms',
    details: 'Synced 8 contacts',
  },
  {
    timestamp: 'Today 3:05 PM',
    integration: 'Slack',
    event: 'Notification',
    status: 'Success',
    duration: '67ms',
    details: 'Sent to #operations',
  },
  {
    timestamp: 'Today 3:00 PM',
    integration: 'Gamma',
    event: 'Template Sync',
    status: 'Success',
    duration: '543ms',
    details: 'Synced 2 templates',
  },
];

const automations = [
  {
    name: 'Contact Sync',
    schedule: 'Every 5 min',
    integration: 'HubSpot',
    lastRun: '3:42 PM',
    nextRun: '3:47 PM',
    status: 'Active',
  },
  {
    name: 'Daily Report',
    schedule: 'Daily 9:00 AM',
    integration: 'Slack + Claude',
    lastRun: '9:00 AM',
    nextRun: 'Tomorrow 9:00 AM',
    status: 'Active',
  },
  {
    name: 'Content Backup',
    schedule: 'Daily 2:00 AM',
    integration: 'Google',
    lastRun: '2:00 AM',
    nextRun: 'Tomorrow 2:00 AM',
    status: 'Active',
  },
  {
    name: 'Campaign Metrics',
    schedule: 'Every 30 min',
    integration: 'HubSpot',
    lastRun: '3:30 PM',
    nextRun: '4:00 PM',
    status: 'Active',
  },
  {
    name: 'Template Sync',
    schedule: 'Every hour',
    integration: 'Gamma',
    lastRun: '3:00 PM',
    nextRun: '4:00 PM',
    status: 'Active',
  },
  {
    name: 'Error Digest',
    schedule: 'Daily 6:00 PM',
    integration: 'Slack',
    lastRun: 'Yesterday 6:00 PM',
    nextRun: 'Today 6:00 PM',
    status: 'Paused',
  },
];

export default function IntegrationHubPage() {
  return (
    <div className="p-8 space-y-6" style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div>
        <h1
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
        >
          Integration Hub
        </h1>
        <p className="text-lg" style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}>
          Connected services, API health, and automation workflows
        </p>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="bg-white rounded-xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{
              backgroundColor: C.cardBg,
              border: `1px solid ${C.border}`,
              borderLeft: `4px solid ${integration.accent}`,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: integration.accent }}
              >
                {integration.initial}
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      integration.status === 'Connected' ? C.green : integration.status === 'Degraded' ? C.amber : C.red,
                  }}
                />
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily: "'Fakt', system-ui, sans-serif",
                    color:
                      integration.status === 'Connected' ? C.green : integration.status === 'Degraded' ? C.amber : C.red,
                  }}
                >
                  {integration.status}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.dark }}>
              {integration.name}
            </h3>
            <p className="text-sm mb-1" style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}>
              Last sync: {integration.lastSync}
            </p>
            <p className="text-sm font-medium" style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.dark }}>
              {integration.dataSynced}
            </p>
          </div>
        ))}
      </div>

      {/* API Health Metrics */}
      <div className="grid grid-cols-2 gap-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4">
          {apiMetrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-white rounded-xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}
            >
              <p className="text-sm mb-1" style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}>
                {metric.label}
              </p>
              <p
                className="text-2xl font-bold"
                style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
              >
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        {/* API Response Chart */}
        <div
          className="bg-white rounded-xl p-5 transition-all duration-200 hover:shadow-md"
          style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.dark }}>
            API Response Times (24h)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={apiResponseData}>
              <defs>
                <linearGradient id="colorMs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.teal} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fontFamily: "'Fakt', system-ui, sans-serif", fill: C.slate }}
                axisLine={{ stroke: C.border }}
                tickLine={{ stroke: C.border }}
              />
              <YAxis
                tick={{ fontSize: 11, fontFamily: "'Fakt', system-ui, sans-serif", fill: C.slate }}
                axisLine={{ stroke: C.border }}
                tickLine={{ stroke: C.border }}
                label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fill: C.slate, fontSize: 11 } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  fontFamily: "'Fakt', system-ui, sans-serif",
                }}
              />
              <Area type="monotone" dataKey="ms" stroke={C.teal} strokeWidth={2} fillOpacity={1} fill="url(#colorMs)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Webhook Configuration Table */}
      <div
        className="bg-white rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md"
        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}
      >
        <div className="p-5 border-b" style={{ borderColor: C.border }}>
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            Webhook Configuration
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontFamily: "'Fakt', system-ui, sans-serif" }}>
            <thead>
              <tr className="border-b" style={{ borderColor: C.border, backgroundColor: C.bg }}>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Endpoint
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Method
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Source
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Status
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Last Triggered
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Success Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((webhook, idx) => (
                <tr
                  key={idx}
                  className="border-b transition-colors duration-150 hover:bg-opacity-50"
                  style={{ borderColor: C.border }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.bg)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-5 py-3 text-sm font-mono" style={{ color: C.dark }}>
                    {webhook.endpoint}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-1 text-xs font-semibold rounded-sm"
                      style={{ backgroundColor: C.blueBg, color: C.blue }}
                    >
                      {webhook.method}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: C.dark }}>
                    {webhook.source}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: webhook.status === 'Active' ? C.green : C.amber,
                        }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: webhook.status === 'Active' ? C.green : C.amber }}
                      >
                        {webhook.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: C.slate }}>
                    {webhook.lastTriggered}
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold" style={{ color: C.dark }}>
                    {webhook.successRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Logs Table */}
      <div
        className="bg-white rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md"
        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}
      >
        <div className="p-5 border-b" style={{ borderColor: C.border }}>
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            Integration Logs
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontFamily: "'Fakt', system-ui, sans-serif" }}>
            <thead>
              <tr className="border-b" style={{ borderColor: C.border, backgroundColor: C.bg }}>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Timestamp
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Integration
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Event
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Status
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Duration
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr
                  key={idx}
                  className="border-b transition-colors duration-150 hover:bg-opacity-50"
                  style={{ borderColor: C.border }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.bg)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-5 py-3 text-sm" style={{ color: C.slate }}>
                    {log.timestamp}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium" style={{ color: C.dark }}>
                    {log.integration}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: C.dark }}>
                    {log.event}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-1 text-xs font-semibold rounded-sm"
                      style={{
                        backgroundColor:
                          log.status === 'Success' ? C.greenBg : log.status === 'Warning' ? C.amberBg : C.redBg,
                        color: log.status === 'Success' ? C.green : log.status === 'Warning' ? C.amber : C.red,
                      }}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-mono" style={{ color: C.slate }}>
                    {log.duration}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: C.slate }}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduled Automations Table */}
      <div
        className="bg-white rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md"
        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}
      >
        <div className="p-5 border-b" style={{ borderColor: C.border }}>
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}
          >
            Scheduled Automations
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontFamily: "'Fakt', system-ui, sans-serif" }}>
            <thead>
              <tr className="border-b" style={{ borderColor: C.border, backgroundColor: C.bg }}>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Automation
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Schedule
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Integration
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Last Run
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Next Run
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {automations.map((automation, idx) => (
                <tr
                  key={idx}
                  className="border-b transition-colors duration-150 hover:bg-opacity-50"
                  style={{ borderColor: C.border }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.bg)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-5 py-3 text-sm font-medium" style={{ color: C.dark }}>
                    {automation.name}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: C.slate }}>
                    {automation.schedule}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: C.dark }}>
                    {automation.integration}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: C.slate }}>
                    {automation.lastRun}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: C.slate }}>
                    {automation.nextRun}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: automation.status === 'Active' ? C.green : C.slate,
                        }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: automation.status === 'Active' ? C.green : C.slate }}
                      >
                        {automation.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
