'use client';

import React, { useState } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

// Mock data for campaign performance
const campaignData = [
  { week: 'Week 1', impressions: 45000, clicks: 2800, conversions: 120 },
  { week: 'Week 2', impressions: 52000, clicks: 3200, conversions: 145 },
  { week: 'Week 3', impressions: 48000, clicks: 2950, conversions: 132 },
  { week: 'Week 4', impressions: 61000, clicks: 3800, conversions: 168 },
  { week: 'Week 5', impressions: 58000, clicks: 3600, conversions: 155 },
  { week: 'Week 6', impressions: 64000, clicks: 4100, conversions: 182 },
  { week: 'Week 7', impressions: 69000, clicks: 4400, conversions: 195 },
  { week: 'Week 8', impressions: 66000, clicks: 4200, conversions: 188 },
  { week: 'Week 9', impressions: 72000, clicks: 4650, conversions: 205 },
  { week: 'Week 10', impressions: 78000, clicks: 5000, conversions: 225 },
  { week: 'Week 11', impressions: 75000, clicks: 4800, conversions: 215 },
  { week: 'Week 12', impressions: 82000, clicks: 5300, conversions: 240 },
];

// Traffic sources data
const trafficData = [
  { name: 'Organic Search', value: 35, color: C.teal },
  { name: 'Email', value: 28, color: C.blue },
  { name: 'Social', value: 18, color: C.purple },
  { name: 'Referral', value: 12, color: C.amber },
  { name: 'Direct', value: 7, color: C.slate },
];

// Channel attribution data
const attributionData = [
  { channel: 'Email Campaigns', leads: 245, opps: 42, revenue: '$520K', attribution: 32 },
  { channel: 'Organic Search', leads: 189, opps: 31, revenue: '$380K', attribution: 24 },
  { channel: 'Webinars', leads: 156, opps: 28, revenue: '$340K', attribution: 21 },
  { channel: 'Social Media', leads: 98, opps: 12, revenue: '$145K', attribution: 9 },
  { channel: 'Referral', leads: 76, opps: 10, revenue: '$120K', attribution: 8 },
  { channel: 'Paid Ads', leads: 45, opps: 8, revenue: '$95K', attribution: 6 },
];

// A/B Testing data
const abTests = [
  {
    name: 'Email Subject Line',
    variantA: 'Q1 Insights',
    variantB: 'Your Portfolio Update',
    sampleSize: '2,400',
    winner: 'Variant B',
    confidence: 94.2,
    status: 'Running'
  },
  {
    name: 'CTA Button Color',
    variantA: 'Teal',
    variantB: 'Blue',
    sampleSize: '1,800',
    winner: 'Variant A',
    confidence: 97.8,
    status: 'Completed'
  },
  {
    name: 'Landing Page Layout',
    variantA: 'Single Column',
    variantB: 'Two Column',
    sampleSize: '3,200',
    winner: '—',
    confidence: 62.1,
    status: 'Running'
  },
  {
    name: 'Newsletter Timing',
    variantA: 'Tuesday 9AM',
    variantB: 'Thursday 2PM',
    sampleSize: '4,600',
    winner: 'Variant B',
    confidence: 89.4,
    status: 'Running'
  },
  {
    name: 'Blog Header Image',
    variantA: 'Photo',
    variantB: 'Illustration',
    sampleSize: '1,200',
    winner: '—',
    confidence: 45.3,
    status: 'Running'
  },
];

// Competitive intelligence data
const competitorData = [
  { name: 'Mercer Advisors', traffic: '125K/mo', social: '45K', frequency: 'Daily', shareOfVoice: 18 },
  { name: 'Hightower', traffic: '98K/mo', social: '38K', frequency: '3x Week', shareOfVoice: 15 },
  { name: 'Creative Planning', traffic: '210K/mo', social: '62K', frequency: 'Daily', shareOfVoice: 22 },
  { name: 'Farther', traffic: '45K/mo', social: '12K', frequency: '2x Week', shareOfVoice: 8, isUs: true },
  { name: 'Savant Wealth', traffic: '67K/mo', social: '22K', frequency: 'Weekly', shareOfVoice: 10 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('90D');
  const [attributionModel, setAttributionModel] = useState('Last Touch');

  // ROI Calculator state
  const [budget, setBudget] = useState(50000);
  const [expectedLeads, setExpectedLeads] = useState(200);
  const [dealSize, setDealSize] = useState(250000);
  const [closeRate, setCloseRate] = useState(4);

  // ROI calculations
  const projectedRevenue = expectedLeads * (closeRate / 100) * dealSize;
  const projectedROI = ((projectedRevenue - budget) / budget);
  const costPerLead = budget / expectedLeads;
  const breakEvenPoint = Math.ceil(budget / (dealSize * (closeRate / 100)));

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return C.green;
    if (confidence >= 60) return C.amber;
    return C.slate;
  };

  return (
    <div className="p-8 space-y-6" style={{ fontFamily: "'Fakt', system-ui, sans-serif", backgroundColor: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}>
          Analytics Hub
        </h1>
        <p className="text-lg" style={{ color: C.slate }}>
          Marketing performance, attribution, and ROI intelligence
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: C.border, backgroundColor: C.cardBg }}>
          <div className="text-sm font-medium mb-2" style={{ color: C.slate }}>Marketing ROI</div>
          <div className="text-3xl font-bold mb-2" style={{ color: C.dark }}>4.2x</div>
          <div className="flex items-center gap-1 text-sm" style={{ color: C.green }}>
            <span>↑ +0.8x</span>
            <span style={{ color: C.slate }}>vs last quarter</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: C.border, backgroundColor: C.cardBg }}>
          <div className="text-sm font-medium mb-2" style={{ color: C.slate }}>Attribution Score</div>
          <div className="text-3xl font-bold mb-2" style={{ color: C.dark }}>78/100</div>
          <div className="flex items-center gap-1 text-sm" style={{ color: C.blue }}>
            <span>Strong</span>
            <span style={{ color: C.slate }}>model confidence</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: C.border, backgroundColor: C.cardBg }}>
          <div className="text-sm font-medium mb-2" style={{ color: C.slate }}>Conversion Rate</div>
          <div className="text-3xl font-bold mb-2" style={{ color: C.dark }}>3.8%</div>
          <div className="flex items-center gap-1 text-sm" style={{ color: C.green }}>
            <span>↑ +0.5pp</span>
            <span style={{ color: C.slate }}>vs last quarter</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: C.border, backgroundColor: C.cardBg }}>
          <div className="text-sm font-medium mb-2" style={{ color: C.slate }}>Customer Acquisition Cost</div>
          <div className="text-3xl font-bold mb-2" style={{ color: C.dark }}>$1,240</div>
          <div className="flex items-center gap-1 text-sm" style={{ color: C.green }}>
            <span>↓ -$180</span>
            <span style={{ color: C.slate }}>vs last quarter</span>
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: C.border, backgroundColor: C.cardBg }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: C.dark }}>Campaign Performance Over Time</h2>
          <div className="flex gap-2">
            {['7D', '30D', '90D', '12M'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: timeRange === range ? C.teal : 'transparent',
                  color: timeRange === range ? C.white : C.slate,
                  border: `1px solid ${timeRange === range ? C.teal : C.border}`,
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={campaignData}>
            <defs>
              <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.blue} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.teal} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.green} stopOpacity={0.5}/>
                <stop offset="95%" stopColor={C.green} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="week" stroke={C.slate} style={{ fontSize: '12px' }} />
            <YAxis stroke={C.slate} style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '8px' }}
            />
            <Legend />
            <Area type="monotone" dataKey="impressions" stroke={C.blue} fillOpacity={1} fill="url(#colorImpressions)" />
            <Area type="monotone" dataKey="clicks" stroke={C.teal} fillOpacity={1} fill="url(#colorClicks)" />
            <Area type="monotone" dataKey="conversions" stroke={C.green} fillOpacity={1} fill="url(#colorConversions)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Traffic Sources + Attribution */}
      <div className="grid grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: C.border, backgroundColor: C.cardBg }}>
          <h2 className="text-xl font-semibold mb-6" style={{ color: C.dark }}>Traffic Sources</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={trafficData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {trafficData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {trafficData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm" style={{ color: C.dark }}>{item.name}</span>
                </div>
                <span className="text-sm font-medium" style={{ color: C.dark }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Attribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: C.border, backgroundColor: C.cardBg }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold" style={{ color: C.dark }}>Channel Attribution</h2>
            <div className="flex gap-2">
              {['First Touch', 'Last Touch', 'Linear'].map((model) => (
                <button
                  key={model}
                  onClick={() => setAttributionModel(model)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: attributionModel === model ? C.teal : 'transparent',
                    color: attributionModel === model ? C.white : C.slate,
                    border: `1px solid ${attributionModel === model ? C.teal : C.border}`,
                  }}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th className="text-left py-2 text-xs font-medium" style={{ color: C.slate }}>Channel</th>
                  <th className="text-right py-2 text-xs font-medium" style={{ color: C.slate }}>Leads</th>
                  <th className="text-right py-2 text-xs font-medium" style={{ color: C.slate }}>Opps</th>
                  <th className="text-right py-2 text-xs font-medium" style={{ color: C.slate }}>Revenue</th>
                  <th className="text-right py-2 text-xs font-medium" style={{ color: C.slate }}>Attribution %</th>
                </tr>
              </thead>
              <tbody>
                {attributionData.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="py-3 text-sm" style={{ color: C.dark }}>{row.channel}</td>
                    <td className="py-3 text-sm text-right" style={{ color: C.dark }}>{row.leads}</td>
                    <td className="py-3 text-sm text-right" style={{ color: C.dark }}>{row.opps}</td>
                    <td className="py-3 text-sm text-right font-medium" style={{ color: C.dark }}>{row.revenue}</td>
                    <td className="py-3 text-sm text-right font-semibold" style={{ color: C.teal }}>{row.attribution}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* A/B Testing Dashboard */}
      <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: C.border, backgroundColor: C.cardBg }}>
        <h2 className="text-xl font-semibold mb-6" style={{ color: C.dark }}>Active A/B Tests</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th className="text-left py-3 text-sm font-medium" style={{ color: C.slate }}>Test Name</th>
                <th className="text-left py-3 text-sm font-medium" style={{ color: C.slate }}>Variant A</th>
                <th className="text-left py-3 text-sm font-medium" style={{ color: C.slate }}>Variant B</th>
                <th className="text-right py-3 text-sm font-medium" style={{ color: C.slate }}>Sample Size</th>
                <th className="text-left py-3 text-sm font-medium" style={{ color: C.slate }}>Winner</th>
                <th className="text-right py-3 text-sm font-medium" style={{ color: C.slate }}>Confidence</th>
                <th className="text-left py-3 text-sm font-medium" style={{ color: C.slate }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {abTests.map((test, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-3 text-sm font-medium" style={{ color: C.dark }}>{test.name}</td>
                  <td className="py-3 text-sm" style={{ color: C.slate }}>{test.variantA}</td>
                  <td className="py-3 text-sm" style={{ color: C.slate }}>{test.variantB}</td>
                  <td className="py-3 text-sm text-right" style={{ color: C.dark }}>{test.sampleSize}</td>
                  <td className="py-3 text-sm">
                    {test.winner !== '—' ? (
                      <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: C.greenBg, color: C.green }}>
                        {test.winner}
                      </span>
                    ) : (
                      <span style={{ color: C.slate }}>—</span>
                    )}
                  </td>
                  <td className="py-3 text-sm text-right font-medium" style={{ color: getConfidenceColor(test.confidence) }}>
                    {test.confidence.toFixed(1)}%
                  </td>
                  <td className="py-3 text-sm">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: test.status === 'Completed' ? C.blueBg : C.amberBg,
                        color: test.status === 'Completed' ? C.blue : C.amber
                      }}
                    >
                      {test.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Competitive Intelligence */}
      <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: C.border, backgroundColor: C.cardBg }}>
        <h2 className="text-xl font-semibold mb-6" style={{ color: C.dark }}>Competitive Landscape</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th className="text-left py-3 text-sm font-medium" style={{ color: C.slate }}>Competitor</th>
                <th className="text-right py-3 text-sm font-medium" style={{ color: C.slate }}>Est. Traffic</th>
                <th className="text-right py-3 text-sm font-medium" style={{ color: C.slate }}>Social Following</th>
                <th className="text-left py-3 text-sm font-medium" style={{ color: C.slate }}>Content Frequency</th>
                <th className="text-left py-3 text-sm font-medium" style={{ color: C.slate }}>Share of Voice</th>
              </tr>
            </thead>
            <tbody>
              {competitorData.map((comp, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    backgroundColor: comp.isUs ? 'rgba(29, 118, 130, 0.05)' : 'transparent'
                  }}
                >
                  <td className="py-3 text-sm font-medium" style={{ color: comp.isUs ? C.teal : C.dark }}>
                    {comp.name}
                  </td>
                  <td className="py-3 text-sm text-right" style={{ color: C.dark }}>{comp.traffic}</td>
                  <td className="py-3 text-sm text-right" style={{ color: C.dark }}>{comp.social}</td>
                  <td className="py-3 text-sm" style={{ color: C.slate }}>{comp.frequency}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${comp.shareOfVoice * 4}%`,
                            backgroundColor: comp.isUs ? C.teal : C.slate
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-10 text-right" style={{ color: C.dark }}>
                        {comp.shareOfVoice}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: C.border, backgroundColor: C.cardBg }}>
        <h2 className="text-xl font-semibold mb-6" style={{ color: C.dark }}>ROI Calculator</h2>
        <div className="grid grid-cols-2 gap-8">
          {/* Input Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: C.slate }}>
                Campaign Budget ($)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{ borderColor: C.border, backgroundColor: C.white }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: C.slate }}>
                Expected Leads
              </label>
              <input
                type="number"
                value={expectedLeads}
                onChange={(e) => setExpectedLeads(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{ borderColor: C.border, backgroundColor: C.white }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: C.slate }}>
                Average Deal Size ($)
              </label>
              <input
                type="number"
                value={dealSize}
                onChange={(e) => setDealSize(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{ borderColor: C.border, backgroundColor: C.white }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: C.slate }}>
                Close Rate (%)
              </label>
              <input
                type="number"
                value={closeRate}
                onChange={(e) => setCloseRate(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{ borderColor: C.border, backgroundColor: C.white }}
              />
            </div>
          </div>

          {/* Results Display */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: C.greenBg, border: `1px solid ${C.green}` }}>
              <div className="text-sm font-medium mb-1" style={{ color: C.green }}>Projected Revenue</div>
              <div className="text-2xl font-bold" style={{ color: C.green }}>
                ${(projectedRevenue / 1000000).toFixed(1)}M
              </div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: C.blueBg, border: `1px solid ${C.blue}` }}>
              <div className="text-sm font-medium mb-1" style={{ color: C.blue }}>Projected ROI</div>
              <div className="text-2xl font-bold" style={{ color: C.blue }}>
                {projectedROI.toFixed(1)}x
              </div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: C.purpleBg, border: `1px solid ${C.purple}` }}>
              <div className="text-sm font-medium mb-1" style={{ color: C.purple }}>Cost Per Lead</div>
              <div className="text-2xl font-bold" style={{ color: C.purple }}>
                ${costPerLead.toFixed(0)}
              </div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: C.amberBg, border: `1px solid ${C.amber}` }}>
              <div className="text-sm font-medium mb-1" style={{ color: C.amber }}>Break-Even Point</div>
              <div className="text-2xl font-bold" style={{ color: C.amber }}>
                {breakEvenPoint} {breakEvenPoint === 1 ? 'deal' : 'deals'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
