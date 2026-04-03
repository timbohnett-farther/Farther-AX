/**
 * Smoke Test: Metrics Endpoint
 *
 * Verifies that the /api/command-center/metrics endpoint returns
 * expected aggregated metrics structure.
 */

import { GET } from '@/app/api/command-center/metrics/route';
import { NextResponse } from 'next/server';

// Mock PostgreSQL pool
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(async () => ({
      rows: [
        { role: 'AXM', count: 5 },
        { role: 'AXA', count: 3 },
      ],
    })),
  },
}));

// Mock the PostgreSQL cache
jest.mock('@/lib/pg-cache', () => ({
  withPgCache: jest.fn(async (key, fetcher) => {
    const data = await fetcher();
    return { data, cached: false };
  }),
}));

// Mock the Redis cached-fetchers
jest.mock('@/lib/cached-fetchers', () => ({
  getCached: jest.fn(async (category, key, fetcher) => {
    const data = await fetcher();
    return { data, source: 'mock' };
  }),
}));

// Mock HubSpot pipeline deals
jest.mock('@/lib/hubspot', () => ({
  getPipelineDeals: jest.fn(async () => [
    {
      id: '12345',
      properties: {
        dealname: 'Test Advisor',
        transferable_aum: '5000000',
        dealstage: '100411705', // Launched stage
        actual_launch_date: '2024-01-01',
        createdate: '2023-12-01',
        desired_start_date: '2024-01-01',
        transition_type: 'Breakaway',
        firm_type: 'Wirehouse',
        client_households: '25',
      },
    },
  ]),
  hubspotFetch: jest.fn(async (url) => {
    // Mock managed accounts fetch
    if (url.includes('2-13676628')) {
      return {
        results: [
          {
            properties: {
              advisor_name: 'John Doe',
              current_value: '1000000',
              bd_market_value: '1000000',
              fee_rate_bps: '100',
            },
          },
        ],
      };
    }
    return { results: [] };
  }),
}));

describe('[SMOKE] /api/command-center/metrics', () => {
  it('should return complete metrics structure', async () => {
    const response = await GET();

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const data = await response.json();

    // Pipeline metrics
    expect(data.totalPipelineAUM).toBeDefined();
    expect(typeof data.totalPipelineAUM).toBe('number');
    expect(data.totalDeals).toBeDefined();
    expect(typeof data.totalDeals).toBe('number');

    // Launched stats
    expect(data.launched).toBeDefined();
    expect(data.launched.count).toBeDefined();
    expect(data.launched.aum).toBeDefined();

    // Time-based metrics
    expect(data.onboardedThisMonth).toBeDefined();
    expect(data.onboardedThisQuarter).toBeDefined();
    expect(data.onboardedThisYear).toBeDefined();

    // Pipeline projections
    expect(data.pipeline30).toBeDefined();
    expect(data.pipeline60).toBeDefined();
    expect(data.pipeline90).toBeDefined();

    // Breakdowns
    expect(data.transitionBreakdown).toBeDefined();
    expect(typeof data.transitionBreakdown).toBe('object');
    expect(data.stageBreakdown).toBeDefined();
    expect(typeof data.stageBreakdown).toBe('object');
    expect(data.firmTypeBreakdown).toBeDefined();
    expect(typeof data.firmTypeBreakdown).toBe('object');

    // Capacity metrics
    expect(data.capacity).toBeDefined();
    expect(data.capacity.axStaff).toBeDefined();
    expect(data.capacity.platformAUM).toBeDefined();
    expect(data.capacity.launchedAdvisors).toBeDefined();

    // Team roles
    expect(data.teamRoles).toBeDefined();
    expect(typeof data.teamRoles).toBe('object');

    // Launched stats detail
    expect(data.launchedStats).toBeDefined();
    expect(data.launchedStats.totalRevenue).toBeDefined();
  });

  it('should include X-Cache header', async () => {
    const response = await GET();
    const cacheHeader = response.headers.get('X-Cache');

    expect(cacheHeader).toBeDefined();
  });

  it('should not timeout (under 10 seconds)', async () => {
    const start = Date.now();
    await GET();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
  });
});
