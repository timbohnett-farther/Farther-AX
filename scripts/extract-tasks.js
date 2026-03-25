const fs = require('fs');
const content = fs.readFileSync('lib/onboarding-tasks-v2.ts', 'utf8');

// Extract task objects
const taskMatches = content.match(/\{\s*id:\s*'[^']+',[\s\S]*?\}/g) || [];

const tasks = taskMatches.map(taskStr => {
  const id = (taskStr.match(/id:\s*'([^']+)'/) || [])[1];
  const label = (taskStr.match(/label:\s*'([^']+)'/) || [])[1];
  const phase = (taskStr.match(/phase:\s*'([^']+)'/) || [])[1];
  const owner = (taskStr.match(/owner:\s*'([^']+)'/) || [])[1];
  const timing = (taskStr.match(/timing:\s*'([^']+)'/) || [])[1];
  const isHardGate = taskStr.includes('is_hard_gate: true');

  return { id, label, phase, owner, timing, isHardGate };
}).filter(t => t.id);

// Group by phase
const phases = ['phase_0', 'phase_1', 'phase_2', 'phase_3', 'phase_4', 'phase_5', 'phase_6', 'phase_7'];

console.log('# Advisor Onboarding Tasks by Owner\n');
console.log('Total tasks:', tasks.length, '\n');

phases.forEach(phase => {
  const phaseTasks = tasks.filter(t => t.phase === phase);
  if (phaseTasks.length === 0) return;

  console.log(`## ${phase.toUpperCase()} (${phaseTasks.length} tasks)\n`);
  phaseTasks.forEach(t => {
    const gate = t.isHardGate ? '●' : '○';
    console.log(`${gate} ${t.owner.padEnd(20)} | ${t.label} | ${t.timing}`);
  });
  console.log('');
});

// Owner summary
console.log('\n## Tasks by Owner\n');
const ownerCounts = {};
tasks.forEach(t => {
  ownerCounts[t.owner] = (ownerCounts[t.owner] || 0) + 1;
});

Object.entries(ownerCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([owner, count]) => {
    console.log(`${owner.padEnd(20)}: ${count} tasks`);
  });
