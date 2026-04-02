// app/api/agents/[type]/trigger/route.ts — Manual agent trigger endpoint
// POST /api/agents/{agent_name}/trigger — "Run Now" button handler

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { triggerAgent } from '@/lib/agents/scheduler';
import { ALL_AGENT_NAMES, type AgentName } from '@/lib/agents/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type: agentName } = await params;

  // Validate agent name
  if (!ALL_AGENT_NAMES.includes(agentName as AgentName)) {
    return NextResponse.json(
      { error: `Unknown agent: ${agentName}. Valid agents: ${ALL_AGENT_NAMES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const result = await triggerAgent(agentName as AgentName);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      message: `Agent ${agentName} triggered successfully`,
      triggered_by: session.user?.email ?? 'unknown',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Agent Trigger] Error triggering ${agentName}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
