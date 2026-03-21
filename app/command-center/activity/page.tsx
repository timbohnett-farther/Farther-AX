'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
const activities = [
  { name: 'Sarah Chen', action: 'published "March Newsletter"', time: '5 min ago', type: 'Published', color: 'from-emerald-400 to-teal-500' },
  { name: 'Marcus Rivera', action: 'edited "Spring Campaign Strategy"', time: '12 min ago', type: 'Edited', color: 'from-blue-400 to-indigo-500' },
  { name: 'Priya Patel', action: 'reviewed "Brand Asset Package"', time: '25 min ago', type: 'Reviewed', color: 'from-purple-400 to-pink-500' },
  { name: 'Aisha Williams', action: 'created "Social Media Calendar Q2"', time: '38 min ago', type: 'Created', color: 'from-amber-400 to-orange-500' },
  { name: 'David Kim', action: 'published "Welcome Email Series v2"', time: '1h ago', type: 'Published', color: 'from-cyan-400 to-blue-500' },
  { name: 'James O\'Brien', action: 'commented on "SEO Audit Report"', time: '1h ago', type: 'Commented', color: 'from-slate-400 to-gray-500' },
  { name: 'Mei Lin', action: 'edited "Q1 Market Commentary"', time: '2h ago', type: 'Edited', color: 'from-rose-400 to-pink-500' },
  { name: 'Ryan Thompson', action: 'reviewed "Analytics Dashboard Spec"', time: '2h ago', type: 'Reviewed', color: 'from-green-400 to-emerald-500' },
  { name: 'Chris Anderson', action: 'created "Video Script: Advisor Day"', time: '3h ago', type: 'Created', color: 'from-yellow-400 to-amber-500' },
  { name: 'Elena Rodriguez', action: 'published "Brand Voice Guide"', time: '3h ago', type: 'Published', color: 'from-fuchsia-400 to-purple-500' },
  { name: 'Sarah Chen', action: 'reviewed "Tax Planning Content"', time: '4h ago', type: 'Reviewed', color: 'from-emerald-400 to-teal-500' },
  { name: 'Marcus Rivera', action: 'created "Webinar Follow-Up Sequence"', time: '5h ago', type: 'Created', color: 'from-blue-400 to-indigo-500' },
  { name: 'Priya Patel', action: 'published "Design System Update"', time: '6h ago', type: 'Published', color: 'from-purple-400 to-pink-500' },
  { name: 'David Kim', action: 'edited "Drip Campaign: New Clients"', time: '7h ago', type: 'Edited', color: 'from-cyan-400 to-blue-500' },
  { name: 'Aisha Williams', action: 'published "Social: Market Rally"', time: '8h ago', type: 'Published', color: 'from-amber-400 to-orange-500' },
];

const teamAvailability = [
  { name: 'Sarah Chen', status: 'Available', task: 'Editing newsletter', color: 'from-emerald-400 to-teal-500', statusColor: C.green },
  { name: 'Marcus Rivera', status: 'Busy', task: 'In campaign meeting', color: 'from-blue-400 to-indigo-500', statusColor: C.amber },
  { name: 'Priya Patel', status: 'Available', task: 'Designing assets', color: 'from-purple-400 to-pink-500', statusColor: C.green },
  { name: 'James O\'Brien', status: 'Away', task: 'Lunch break', color: 'from-slate-400 to-gray-500', statusColor: C.slate },
  { name: 'Aisha Williams', status: 'Available', task: 'Scheduling posts', color: 'from-amber-400 to-orange-500', statusColor: C.green },
  { name: 'David Kim', status: 'Busy', task: 'Email testing', color: 'from-cyan-400 to-blue-500', statusColor: C.amber },
  { name: 'Elena Rodriguez', status: 'Do Not Disturb', task: 'Compliance review', color: 'from-fuchsia-400 to-purple-500', statusColor: C.red },
  { name: 'Ryan Thompson', status: 'Available', task: 'Running reports', color: 'from-green-400 to-emerald-500', statusColor: C.green },
  { name: 'Mei Lin', status: 'Busy', task: 'Writing commentary', color: 'from-rose-400 to-pink-500', statusColor: C.amber },
  { name: 'Chris Anderson', status: 'Away', task: 'Video shoot', color: 'from-yellow-400 to-amber-500', statusColor: C.slate },
];

const collaborations = [
  { name: 'Q1 Market Commentary', members: [{ name: 'Sarah Chen', color: 'from-emerald-400 to-teal-500' }, { name: 'Mei Lin', color: 'from-rose-400 to-pink-500' }, { name: 'Ryan Thompson', color: 'from-green-400 to-emerald-500' }], lastActivity: '15 min ago', progress: 85 },
  { name: 'Spring Campaign Launch', members: [{ name: 'Marcus Rivera', color: 'from-blue-400 to-indigo-500' }, { name: 'Aisha Williams', color: 'from-amber-400 to-orange-500' }, { name: 'David Kim', color: 'from-cyan-400 to-blue-500' }], lastActivity: '30 min ago', progress: 60 },
  { name: 'Brand Refresh 2026', members: [{ name: 'Priya Patel', color: 'from-purple-400 to-pink-500' }, { name: 'Elena Rodriguez', color: 'from-fuchsia-400 to-purple-500' }, { name: 'Chris Anderson', color: 'from-yellow-400 to-amber-500' }], lastActivity: '1h ago', progress: 35 },
  { name: 'Advisor Onboarding Kit', members: [{ name: 'Sarah Chen', color: 'from-emerald-400 to-teal-500' }, { name: 'Marcus Rivera', color: 'from-blue-400 to-indigo-500' }], lastActivity: '2h ago', progress: 90 },
  { name: 'Social Media Playbook', members: [{ name: 'Aisha Williams', color: 'from-amber-400 to-orange-500' }, { name: 'Chris Anderson', color: 'from-yellow-400 to-amber-500' }, { name: 'Mei Lin', color: 'from-rose-400 to-pink-500' }], lastActivity: '3h ago', progress: 45 },
  { name: 'Compliance Documentation', members: [{ name: 'Elena Rodriguez', color: 'from-fuchsia-400 to-purple-500' }, { name: 'Ryan Thompson', color: 'from-green-400 to-emerald-500' }, { name: 'James O\'Brien', color: 'from-slate-400 to-gray-500' }], lastActivity: '4h ago', progress: 70 },
];

const performanceData = [
  { name: 'Sarah Chen', week1: 12, week2: 15, week3: 14, week4: 18 },
  { name: 'Marcus Rivera', week1: 10, week2: 13, week3: 16, week4: 15 },
  { name: 'Priya Patel', week1: 14, week2: 11, week3: 13, week4: 17 },
  { name: 'Aisha Williams', week1: 16, week2: 14, week3: 15, week4: 19 },
  { name: 'David Kim', week1: 11, week2: 12, week3: 14, week4: 13 },
  { name: 'Elena Rodriguez', week1: 9, week2: 10, week3: 12, week4: 11 },
  { name: 'Ryan Thompson', week1: 13, week2: 15, week3: 14, week4: 16 },
  { name: 'Mei Lin', week1: 12, week2: 13, week3: 15, week4: 14 },
  { name: 'Chris Anderson', week1: 10, week2: 11, week3: 13, week4: 12 },
  { name: 'James O\'Brien', week1: 11, week2: 10, week3: 12, week4: 13 },
];

const getActionBadgeStyle = (type: string) => {
  const styles: Record<string, { bg: string; text: string }> = {
    Published: { bg: C.greenBg, text: C.green },
    Edited: { bg: C.blueBg, text: C.blue },
    Reviewed: { bg: C.purpleBg, text: C.purple },
    Commented: { bg: C.amberBg, text: C.amber },
    Created: { bg: C.redBg, text: C.red },
  };
  return styles[type] || styles.Published;
};

const getInitials = (name: string) => {
  const parts = name.split(' ');
  return parts.map(p => p[0]).join('').toUpperCase();
};

export default function TeamActivityPage() {
  return (
    <div className="min-h-screen p-8 space-y-6" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}>
          Team Activity
        </h1>
        <p className="text-lg" style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}>
          Real-time team collaboration, availability, and performance tracking
        </p>
      </div>

      {/* Live Activity Feed + Team Availability Grid */}
      <div className="grid grid-cols-5 gap-6">
        {/* Live Activity Feed */}
        <div className="col-span-3 rounded-lg p-6 shadow-xs" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}>
            Live Activity Feed
          </h2>
          <div className="space-y-4">
            {activities.map((activity, idx) => {
              const badgeStyle = getActionBadgeStyle(activity.type);
              return (
                <div key={idx} className="flex items-start gap-4 p-3 rounded-lg transition-all hover:bg-opacity-50" style={{ backgroundColor: 'rgba(253,250,245,0.5)' }}>
                  {/* Avatar */}
                  <div className={`shrink-0 w-10 h-10 rounded-full bg-linear-to-br ${activity.color} flex items-center justify-center text-white text-sm font-semibold shadow-xs`}>
                    {getInitials(activity.name)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold" style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.dark }}>
                        {activity.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}>
                        {activity.type}
                      </span>
                    </div>
                    <p className="text-sm mb-1" style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.slate }}>
                      {activity.action}
                    </p>
                    <p className="text-xs" style={{ color: C.slate, opacity: 0.7 }}>
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Availability */}
        <div className="col-span-2 rounded-lg p-6 shadow-xs" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}>
            Team Availability
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {teamAvailability.map((member, idx) => (
              <div key={idx} className="p-3 rounded-lg transition-all hover:shadow-md" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full bg-linear-to-br ${member.color} flex items-center justify-center text-white text-xs font-semibold mb-2 shadow-xs`}>
                  {getInitials(member.name)}
                </div>

                {/* Name */}
                <p className="font-semibold text-sm mb-2" style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.dark }}>
                  {member.name}
                </p>

                {/* Status */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: member.statusColor }}></div>
                  <span className="text-xs font-medium" style={{ color: member.statusColor }}>
                    {member.status}
                  </span>
                </div>

                {/* Current Task */}
                <p className="text-xs" style={{ color: C.slate, opacity: 0.7 }}>
                  {member.task}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Collaborations */}
      <div className="rounded-lg p-6 shadow-xs" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
        <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}>
          Active Collaborations
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {collaborations.map((collab, idx) => (
            <div key={idx} className="p-4 rounded-lg transition-all hover:shadow-md" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
              {/* Project Name */}
              <h3 className="font-semibold mb-3" style={{ fontFamily: "'Fakt', system-ui, sans-serif", color: C.dark }}>
                {collab.name}
              </h3>

              {/* Avatars */}
              <div className="flex items-center mb-3">
                {collab.members.map((member, mIdx) => (
                  <div
                    key={mIdx}
                    className={`w-8 h-8 rounded-full bg-linear-to-br ${member.color} flex items-center justify-center text-white text-xs font-semibold border-2 shadow-xs`}
                    style={{
                      borderColor: C.white,
                      marginLeft: mIdx > 0 ? '-8px' : '0',
                      zIndex: collab.members.length - mIdx
                    }}
                    title={member.name}
                  >
                    {getInitials(member.name)}
                  </div>
                ))}
              </div>

              {/* Last Activity */}
              <p className="text-xs mb-3" style={{ color: C.slate, opacity: 0.7 }}>
                Last activity: {collab.lastActivity}
              </p>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs" style={{ color: C.slate }}>
                  <span>Progress</span>
                  <span className="font-semibold">{collab.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${collab.progress}%`,
                      backgroundColor: C.teal
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="rounded-lg p-6 shadow-xs" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
        <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: "'ABC Arizona Text', Georgia, serif", color: C.dark }}>
          Team Output — Last 4 Weeks
        </h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={performanceData}
              layout="horizontal"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <XAxis type="number" stroke={C.slate} style={{ fontFamily: "'Fakt', system-ui, sans-serif", fontSize: '12px' }} />
              <YAxis dataKey="name" type="category" stroke={C.slate} style={{ fontFamily: "'Fakt', system-ui, sans-serif", fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  fontFamily: "'Fakt', system-ui, sans-serif"
                }}
                labelStyle={{ color: C.dark, fontWeight: 600 }}
              />
              <Bar dataKey="week1" fill={C.teal} opacity={0.4} radius={[0, 4, 4, 0]} />
              <Bar dataKey="week2" fill={C.teal} opacity={0.6} radius={[0, 4, 4, 0]} />
              <Bar dataKey="week3" fill={C.teal} opacity={0.8} radius={[0, 4, 4, 0]} />
              <Bar dataKey="week4" fill={C.teal} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
