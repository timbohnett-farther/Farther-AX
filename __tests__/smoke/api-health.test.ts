/**
 * Smoke Test: Health Check Endpoint
 *
 * Verifies that the /api/health endpoint returns expected response
 * without requiring external dependencies (HubSpot, DB, Redis).
 */

import { GET } from '@/app/api/health/route';
import { NextResponse } from 'next/server';

describe('[SMOKE] /api/health', () => {
  it('should return 200 OK with health status', async () => {
    const response = await GET();

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const data = await response.json();

    // Must have ok=true for health checks
    expect(data.ok).toBe(true);
    expect(data.status).toBe('healthy');

    // Must have timestamp
    expect(data.timestamp).toBeDefined();
    expect(typeof data.timestamp).toBe('string');

    // Must check environment status
    expect(data.env).toBeDefined();
    expect(typeof data.env.node_version).toBe('string');
    expect(typeof data.env.node_env).toBe('string');
    expect(typeof data.env.database).toBe('boolean');
    expect(typeof data.env.nextauth).toBe('boolean');
  });

  it('should not timeout (under 1 second)', async () => {
    const start = Date.now();
    await GET();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
  });
});
