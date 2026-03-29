/**
 * Data Contracts — Exact data shapes consumed by the frontend.
 *
 * The cache layer stores and returns these shapes UNCHANGED.
 * Any changes here require corresponding frontend changes.
 *
 * These types are derived from the existing API responses as of 2026-03-29.
 */

// ═══════════════════════════════════════════════════════════════
// ADVISOR DATA CONTRACT
// Source: GET /api/command-center/advisor/[id]
// ═══════════════════════════════════════════════════════════════

export interface AdvisorDetailData {
  deal: {
    id: string;
    properties: Record<string, unknown>;
  };
  notes: Array<{
    id: string;
    properties: Record<string, unknown>;
  }>;
  team: Record<string, unknown> | null;
  contact: Record<string, string | null> | null;
  pinnedNote: {
    id: string;
    body: string;
    timestamp: string | null;
    ownerId: string | null;
  } | null;
  allContacts: Array<Record<string, string>>;
  engagements: Array<{
    type: string;
    id: string;
    timestamp: string;
    properties: Record<string, string>;
  }>;
  _cachedAt?: string;
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE DATA CONTRACT
// Source: GET /api/command-center/pipeline
// ═══════════════════════════════════════════════════════════════

export interface PipelineData {
  deals: Array<{
    id: string;
    dealname: string;
    dealstage: string;
    [key: string]: unknown;
    ownerName: string | null;
    daysSinceLaunch: number | null;
  }>;
  total: number;
  _cachedAt?: string;
}

// ═══════════════════════════════════════════════════════════════
// METRICS DATA CONTRACT
// Source: GET /api/command-center/metrics
// ═══════════════════════════════════════════════════════════════

export interface MetricsData {
  totalPipelineAUM: number;
  totalDeals: number;
  launched: { count: number; aum: number };
  onboardedThisMonth: { count: number; aum: number };
  onboardedThisQuarter: { count: number; aum: number };
  onboardedThisYear: { count: number; aum: number };
  pipeline30: { count: number; aum: number };
  pipeline60: { count: number; aum: number };
  pipeline90: { count: number; aum: number };
  transitionBreakdown: Record<string, number>;
  stageBreakdown: Record<string, number>;
  firmTypeBreakdown: Record<string, number>;
  capacity: {
    axStaff: number;
    platformAUM: number;
    launchedAdvisors: number;
    aumPerStaff: number;
  };
  teamRoles: Record<string, number>;
  launchedStats: {
    totalRevenue: number;
    avgDaysToLaunch: number | null;
    totalHouseholds: number;
    totalLaunchedAUM: number;
  };
  _cachedAt?: string;
}

// ═══════════════════════════════════════════════════════════════
// TRANSITIONS DATA CONTRACT
// Source: GET /api/command-center/transitions
// ═══════════════════════════════════════════════════════════════

export interface TransitionsData {
  advisors: Array<{
    advisor_name: string;
    farther_contact: string | null;
    sheet_url: string | null;
    total_accounts: number;
    tran_aum: number | null;
    revenue: number | null;
    accounts: Array<Record<string, unknown>>;
  }>;
  lastSyncedAt: string | null;
  total: number;
  page: number;
  per_page: number;
  summary: {
    total_advisors: number;
    total_accounts: number;
    iaa_signed: number;
    paperwork_signed: number;
    pending_documents: number;
  };
  _cachedAt?: string;
}
