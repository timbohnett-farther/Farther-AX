/**
 * Smoke Test: Pipeline Endpoint
 *
 * Verifies that the /api/command-center/pipeline endpoint returns
 * expected data structure and doesn't timeout.
 */

import { GET } from '@/app/api/command-center/pipeline/route';
import { NextResponse } from 'next/server';

// Mock the PostgreSQL cache to prevent real DB calls
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

// Mock HubSpot fetch to return sample data
jest.mock('@/lib/hubspot', () => ({
  getPipelineDeals: jest.fn(async () => [
    {
      id: '12345',
      properties: {
        dealname: 'Test Advisor',
        dealstage: '2496931',
        hubspot_owner_id: '67890',
        createdate: '2024-01-01T00:00:00Z',
        hs_lastmodifieddate: '2024-01-02T00:00:00Z',
        transferable_aum: '5000000',
        t12_revenue: '50000',
        client_households: '25',
      },
    },
  ]),
  hubspotFetch: jest.fn(async () => ({
    results: [
      {
        id: '67890',
        firstName: 'John',
        lastName: 'Doe',
      },
    ],
  })),
}));

describe('[SMOKE] /api/command-center/pipeline', () => {
  it('should return pipeline data structure', async () => {
    const response = await GET();

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const data = await response.json();

    // Must have deals array
    expect(data.deals).toBeDefined();
    expect(Array.isArray(data.deals)).toBe(true);

    // Must have total count
    expect(data.total).toBeDefined();
    expect(typeof data.total).toBe('number');

    // If deals exist, validate structure
    if (data.deals.length > 0) {
      const deal = data.deals[0];
      expect(deal.id).toBeDefined();
      expect(deal.dealname).toBeDefined();
      expect(deal.dealstage).toBeDefined();
    }
  });

  it('should include X-Cache header', async () => {
    const response = await GET();
    const cacheHeader = response.headers.get('X-Cache');

    expect(cacheHeader).toBeDefined();
    expect(['MOCK', 'REDIS', 'S3', 'POSTGRES', 'HUBSPOT']).toContain(cacheHeader?.toUpperCase());
  });

  it('should not timeout (under 5 seconds)', async () => {
    const start = Date.now();
    await GET();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
  });
});
