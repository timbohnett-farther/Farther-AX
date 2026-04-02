// app/api/agents/status/route.ts — Agent health dashboard API
// Returns all 8 agents with health status, dependencies, and recent runs

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAgentDashboard } from '@/lib/agents/health';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const agents = await getAgentDashboard();

    // Compute overall system health (worst status across agents)
    const healthPriority: Record<string, number> = {
      critical: 0, stale: 1, warning: 2, running: 3, healthy: 4, disabled: 5,
    };

    const enabledAgents = agents.filter(a => a.enabled);
    const systemHealth = enabledAgents.length === 0
      ? 'disabled'
      : enabledAgents.reduce((worst, agent) => {
          return (healthPriority[agent.health] ?? 5) < (healthPriority[worst] ?? 5)
            ? agent.health
            : worst;
        }, 'healthy' as string);

    return NextResponse.json({
      system_health: systemHealth,
      agent_count: agents.length,
      enabled_count: enabledAgents.length,
      agents,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Agents Status] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
