/**
 * Smoke Test: Advisor Detail Endpoint
 *
 * Verifies that the /api/command-center/advisor/[id] endpoint returns
 * complete advisor profile data.
 */

import { GET } from '@/app/api/command-center/advisor/[id]/route';
import { NextResponse } from 'next/server';

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

// Mock HubSpot fetch to return advisor data
jest.mock('@/lib/hubspot', () => ({
  hubspotFetch: jest.fn(async (url) => {
    // Deal fetch
    if (url.includes('/deals/')) {
      return {
        id: '12345',
        properties: {
          dealname: 'John Doe',
          dealstage: '2496931',
          hubspot_owner_id: '67890',
          createdate: '2024-01-01T00:00:00Z',
          transferable_aum: '5000000',
          t12_revenue: '50000',
          client_households: '25',
          advisor: 'John Doe',
          current_firm__cloned_: 'Morgan Stanley',
          transition_type: 'Breakaway',
        },
        associations: {
          contacts: { results: [{ id: 'contact123' }] },
          notes: { results: [] },
        },
      };
    }

    // Notes search
    if (url.includes('/notes/search')) {
      return { results: [] };
    }

    // Team association
    if (url.includes('/associations/2-43222882')) {
      return { results: [] };
    }

    // Contact association
    if (url.includes('/associations/contacts')) {
      return { results: [{ toObjectId: 'contact123' }] };
    }

    // Contact fetch
    if (url.includes('/contacts/')) {
      return {
        id: 'contact123',
        properties: {
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
          phone: '555-1234',
          city: 'New York',
          state: 'NY',
        },
      };
    }

    return { results: [] };
  }),
}));

describe('[SMOKE] /api/command-center/advisor/[id]', () => {
  const mockRequest = {
    nextUrl: new URL('http://localhost:3000/api/command-center/advisor/12345'),
  } as any;

  const mockParams = { params: { id: '12345' } };

  it('should return complete advisor profile', async () => {
    const response = await GET(mockRequest, mockParams);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const data = await response.json();

    // Must have core deal data
    expect(data.deal).toBeDefined();
    expect(data.deal.id).toBe('12345');
    expect(data.deal.dealname).toBe('John Doe');

    // Must have notes array (even if empty)
    expect(data.notes).toBeDefined();
    expect(Array.isArray(data.notes)).toBe(true);

    // Must have contact data
    expect(data.contact).toBeDefined();

    // Must have allContacts array
    expect(data.allContacts).toBeDefined();
    expect(Array.isArray(data.allContacts)).toBe(true);

    // Must have engagements array
    expect(data.engagements).toBeDefined();
    expect(Array.isArray(data.engagements)).toBe(true);
  });

  it('should include X-Cache header', async () => {
    const response = await GET(mockRequest, mockParams);
    const cacheHeader = response.headers.get('X-Cache');

    expect(cacheHeader).toBeDefined();
  });

  it('should not timeout (under 5 seconds)', async () => {
    const start = Date.now();
    await GET(mockRequest, mockParams);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
  });
});
