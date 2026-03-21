'use client';

import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

// Mock data for team members
const teamMembers = [
  {
    name: 'Sarah Chen',
    role: 'Content Lead',
    status: 'Online',
    workload: 65,
    initials: 'SC',
    gradient: 'from-teal-400 to-blue-500'
  },
  {
    name: 'Marcus Rivera',
    role: 'Campaign Strategist',
    status: 'Busy',
    workload: 82,
    initials: 'MR',
    gradient: 'from-purple-400 to-pink-500'
  },
  {
    name: 'Priya Patel',
    role: 'Design Director',
    status: 'Online',
    workload: 58,
    initials: 'PP',
    gradient: 'from-amber-400 to-orange-500'
  },
  {
    name: 'James O\'Brien',
    role: 'SEO Specialist',
    status: 'Online',
    workload: 45,
    initials: 'JO',
    gradient: 'from-green-400 to-teal-500'
  },
  {
    name: 'Aisha Williams',
    role: 'Social Media Manager',
    status: 'Away',
    workload: 70,
    initials: 'AW',
    gradient: 'from-blue-400 to-purple-500'
  },
  {
    name: 'David Kim',
    role: 'Email Marketing',
    status: 'Online',
    workload: 55,
    initials: 'DK',
    gradient: 'from-rose-400 to-orange-500'
  },
  {
    name: 'Elena Rodriguez',
    role: 'Brand Manager',
    status: 'Online',
    workload: 72,
    initials: 'ER',
    gradient: 'from-indigo-400 to-purple-500'
  },
  {
    name: 'Ryan Thompson',
    role: 'Analytics Lead',
    status: 'Busy',
    workload: 88,
    initials: 'RT',
    gradient: 'from-cyan-400 to-blue-500'
  },
  {
    name: 'Mei Lin',
    role: 'Content Writer',
    status: 'Online',
    workload: 50,
    initials: 'ML',
    gradient: 'from-emerald-400 to-teal-500'
  },
  {
    name: 'Chris Anderson',
    role: 'Video Producer',
    status: 'Online',
    workload: 35,
    initials: 'CA',
    gradient: 'from-violet-400 to-purple-500'
  },
];

// Mock data for workflows
const workflows = [
  { workflow: 'Q1 Newsletter Campaign', assignedTo: 'Sarah Chen', status: 'In Progress', priority: 'High', dueDate: 'Mar 28', progress: 75 },
  { workflow: 'Advisor Onboarding Series', assignedTo: 'Marcus Rivera', status: 'In Progress', priority: 'Critical', dueDate: 'Mar 25', progress: 45 },
  { workflow: 'Market Commentary Draft', assignedTo: 'Mei Lin', status: 'Review', priority: 'Medium', dueDate: 'Mar 30', progress: 90 },
  { workflow: 'Social Media Calendar', assignedTo: 'Aisha Williams', status: 'Active', priority: 'High', dueDate: 'Apr 2', progress: 30 },
  { workflow: 'Brand Refresh Assets', assignedTo: 'Priya Patel', status: 'In Progress', priority: 'Medium', dueDate: 'Apr 5', progress: 60 },
  { workflow: 'SEO Audit Report', assignedTo: 'James O\'Brien', status: 'Completed', priority: 'Low', dueDate: 'Mar 20', progress: 100 },
  { workflow: 'Email Drip Sequence', assignedTo: 'David Kim', status: 'In Progress', priority: 'High', dueDate: 'Mar 27', progress: 55 },
  { workflow: 'Video Testimonials', assignedTo: 'Chris Anderson', status: 'Planning', priority: 'Medium', dueDate: 'Apr 10', progress: 15 },
];

// Mock data for team performance chart
const performanceData = [
  { week: 'Week 1', Sarah: 12, Marcus: 15, Priya: 10, James: 8, Aisha: 14, David: 11, Elena: 13, Ryan: 16, Mei: 9, Chris: 7 },
  { week: 'Week 2', Sarah: 14, Marcus: 13, Priya: 12, James: 10, Aisha: 15, David: 9, Elena: 11, Ryan: 14, Mei: 11, Chris: 8 },
  { week: 'Week 3', Sarah: 16, Marcus: 18, Priya: 11, James: 9, Aisha: 13, David: 12, Elena: 15, Ryan: 19, Mei: 10, Chris: 6 },
  { week: 'Week 4', Sarah: 15, Marcus: 16, Priya: 13, James: 11, Aisha: 16, David: 13, Elena: 14, Ryan: 17, Mei: 12, Chris: 9 },
];

// Mock data for activation history chart
const activationData = [
  { day: 'Mar 1', tasks: 28 },
  { day: 'Mar 3', tasks: 32 },
  { day: 'Mar 5', tasks: 35 },
  { day: 'Mar 7', tasks: 29 },
  { day: 'Mar 9', tasks: 38 },
  { day: 'Mar 11', tasks: 42 },
  { day: 'Mar 13', tasks: 40 },
  { day: 'Mar 15', tasks: 45 },
  { day: 'Mar 17', tasks: 48 },
  { day: 'Mar 19', tasks: 52 },
  { day: 'Mar 21', tasks: 50 },
  { day: 'Mar 23', tasks: 55 },
];

const getStatusColor = (status: string) => {
  const statusColors: Record<string, { bg: string; text: string }> = {
    'In Progress': { bg: C.blueBg, text: C.blue },
    'Review': { bg: C.purpleBg, text: C.purple },
    'Active': { bg: C.greenBg, text: C.green },
    'Completed': { bg: 'rgba(29,118,130,0.08)', text: C.teal },
    'Planning': { bg: C.amberBg, text: C.amber },
  };
  return statusColors[status] || { bg: C.amberBg, text: C.amber };
};

const getPriorityColor = (priority: string) => {
  const priorityColors: Record<string, { bg: string; text: string }> = {
    'Critical': { bg: C.redBg, text: C.red },
    'High': { bg: C.amberBg, text: C.amber },
    'Medium': { bg: C.blueBg, text: C.blue },
    'Low': { bg: 'rgba(91,106,113,0.08)', text: C.slate },
  };
  return priorityColors[priority] || { bg: C.amberBg, text: C.amber };
};

const getWorkloadColor = (workload: number) => {
  if (workload < 60) return C.green;
  if (workload <= 80) return C.amber;
  return C.red;
};

const getStatusBadgeColor = (status: string) => {
  const colors: Record<string, { bg: string; text: string }> = {
    'Online': { bg: C.greenBg, text: C.green },
    'Busy': { bg: C.amberBg, text: C.amber },
    'Away': { bg: 'rgba(91,106,113,0.08)', text: C.slate },
  };
  return colors[status] || { bg: C.amberBg, text: C.amber };
};

export default function SuperTeamPage() {
  return (
    <div
      className="p-8 space-y-6"
      style={{
        backgroundColor: C.bg,
        minHeight: '100vh',
        fontFamily: "'Fakt', system-ui, sans-serif"
      }}
    >
      {/* Page Header */}
      <div>
        <h1
          className="text-4xl font-bold mb-2"
          style={{
            fontFamily: "'ABC Arizona Text', Georgia, serif",
            color: C.dark
          }}
        >
          Super Team Engine
        </h1>
        <p style={{ color: C.slate, fontSize: '16px' }}>
          AI-powered team orchestration & workflow automation
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-6 shadow-xs hover:shadow-md transition-shadow" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: C.green }}
            />
            <span style={{ color: C.slate, fontSize: '14px' }}>Active Team Members</span>
          </div>
          <div
            className="text-3xl font-bold"
            style={{ color: C.dark }}
          >
            10
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-xs hover:shadow-md transition-shadow" style={{ borderColor: C.border }}>
          <div className="mb-2">
            <span style={{ color: C.slate, fontSize: '14px' }}>Active Workflows</span>
          </div>
          <div
            className="text-3xl font-bold"
            style={{ color: C.dark }}
          >
            24
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-xs hover:shadow-md transition-shadow" style={{ borderColor: C.border }}>
          <div className="mb-2">
            <span style={{ color: C.slate, fontSize: '14px' }}>Avg Response Time</span>
          </div>
          <div
            className="text-3xl font-bold"
            style={{ color: C.dark }}
          >
            2.4h
          </div>
        </div>
      </div>

      {/* Team Member Cards */}
      <div>
        <h2
          className="text-2xl font-semibold mb-4"
          style={{
            fontFamily: "'ABC Arizona Text', Georgia, serif",
            color: C.dark
          }}
        >
          Team Members
        </h2>
        <div className="grid grid-cols-5 gap-4">
          {teamMembers.map((member) => {
            const statusColor = getStatusBadgeColor(member.status);
            const workloadColor = getWorkloadColor(member.workload);

            return (
              <div
                key={member.name}
                className="bg-white rounded-xl border p-5 shadow-xs hover:shadow-md transition-shadow"
                style={{ borderColor: C.border }}
              >
                {/* Avatar */}
                <div className="flex flex-col items-center mb-4">
                  <div
                    className={`w-16 h-16 rounded-full bg-linear-to-br ${member.gradient} flex items-center justify-center text-white font-bold text-lg mb-3`}
                  >
                    {member.initials}
                  </div>
                  <div
                    className="font-semibold text-center mb-1"
                    style={{ color: C.dark, fontSize: '15px' }}
                  >
                    {member.name}
                  </div>
                  <div
                    className="text-sm text-center mb-3"
                    style={{ color: C.slate }}
                  >
                    {member.role}
                  </div>

                  {/* Status Badge */}
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: statusColor.bg,
                      color: statusColor.text
                    }}
                  >
                    {member.status}
                  </div>
                </div>

                {/* Workload Progress */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ color: C.slate, fontSize: '12px' }}>Workload</span>
                    <span
                      style={{ color: workloadColor, fontSize: '12px', fontWeight: '600' }}
                    >
                      {member.workload}%
                    </span>
                  </div>
                  <div
                    className="w-full h-2 rounded-full"
                    style={{ backgroundColor: C.border }}
                  >
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${member.workload}%`,
                        backgroundColor: workloadColor
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Workflows Table */}
      <div>
        <h2
          className="text-2xl font-semibold mb-4"
          style={{
            fontFamily: "'ABC Arizona Text', Georgia, serif",
            color: C.dark
          }}
        >
          Active Workflows
        </h2>
        <div className="bg-white rounded-xl border shadow-xs overflow-hidden" style={{ borderColor: C.border }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.border}` }}>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Workflow
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Assigned To
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: C.dark }}>
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((workflow, idx) => {
                const statusColor = getStatusColor(workflow.status);
                const priorityColor = getPriorityColor(workflow.priority);
                const progressColor = workflow.progress === 100 ? C.green : C.teal;

                return (
                  <tr
                    key={idx}
                    className="hover:bg-black/2 transition-colors"
                    style={{ borderBottom: `1px solid ${C.border}` }}
                  >
                    <td className="px-6 py-4" style={{ color: C.dark, fontWeight: '500' }}>
                      {workflow.workflow}
                    </td>
                    <td className="px-6 py-4" style={{ color: C.slate }}>
                      {workflow.assignedTo}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold inline-block"
                        style={{
                          backgroundColor: statusColor.bg,
                          color: statusColor.text
                        }}
                      >
                        {workflow.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold inline-block"
                        style={{
                          backgroundColor: priorityColor.bg,
                          color: priorityColor.text
                        }}
                      >
                        {workflow.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4" style={{ color: C.slate }}>
                      {workflow.dueDate}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 h-2 rounded-full"
                          style={{ backgroundColor: C.border }}
                        >
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${workflow.progress}%`,
                              backgroundColor: progressColor
                            }}
                          />
                        </div>
                        <span
                          className="text-sm font-semibold w-10"
                          style={{ color: C.dark }}
                        >
                          {workflow.progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-6">
        {/* Team Performance Chart */}
        <div className="bg-white rounded-xl border p-6 shadow-xs" style={{ borderColor: C.border }}>
          <h3
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: "'ABC Arizona Text', Georgia, serif",
              color: C.dark
            }}
          >
            Team Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                style={{
                  fontSize: '12px',
                  fill: C.slate
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                style={{
                  fontSize: '12px',
                  fill: C.slate
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="Sarah" stackId="a" fill={C.teal} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Marcus" stackId="a" fill="#2a9d8f" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Priya" stackId="a" fill="#3aa4a1" radius={[0, 0, 0, 0]} />
              <Bar dataKey="James" stackId="a" fill="#4aabb3" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Aisha" stackId="a" fill="#5ab2c5" radius={[0, 0, 0, 0]} />
              <Bar dataKey="David" stackId="a" fill="#6ab9d7" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Elena" stackId="a" fill="#7ac0e9" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Ryan" stackId="a" fill="#8ac7fb" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Mei" stackId="a" fill="#9aceff" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Chris" stackId="a" fill="#aad5ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activation History Chart */}
        <div className="bg-white rounded-xl border p-6 shadow-xs" style={{ borderColor: C.border }}>
          <h3
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: "'ABC Arizona Text', Georgia, serif",
              color: C.dark
            }}
          >
            Activation History
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activationData}>
              <defs>
                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.teal} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                style={{
                  fontSize: '12px',
                  fill: C.slate
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                style={{
                  fontSize: '12px',
                  fill: C.slate
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey="tasks"
                stroke={C.teal}
                strokeWidth={2}
                fill="url(#colorTasks)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
