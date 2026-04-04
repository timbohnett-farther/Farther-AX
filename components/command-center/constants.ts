// Stage mappings for Advisor Recruiting
export const STAGE_LABELS: Record<string, string> = {
  '2496931':   'Step 1 – First Meeting',
  '2496932':   'Step 2 – Financial Model',
  '2496934':   'Step 3 – Advisor Demo',
  '100409509': 'Step 4 – Discovery Day',
  '2496935':   'Step 5 – Offer Review',
  '2496936':   'Step 6 – Offer Accepted',
  '100411705': 'Step 7 – Launched',
};

export const STAGE_DESCRIPTIONS: Record<string, string> = {
  '2496936':   'AX Team Introduced',
  '100411705': 'Official Start at Farther',
};

export const ACTIVE_STAGE_IDS = ['2496931', '2496932', '2496934', '100409509', '2496935', '2496936', '100411705'];
export const FUNNEL_STAGE_ORDER = ['2496931', '2496932', '2496934', '100409509', '2496935', '2496936', '100411705'];
export const EARLY_STAGE_IDS = ['2496931', '2496932', '2496934', '100409509']; // Steps 1-4
export const LAUNCH_STAGE_IDS = ['2496935', '2496936', '100411705']; // Steps 5-7

// Stage colors
export const getStageColors = (teal: string, gold: string): Record<string, string> => ({
  '2496931':   '#7fb3d8',
  '2496932':   '#6ba3cc',
  '2496934':   '#5793c0',
  '100409509': '#4383b4',
  '2496935':   '#2f73a8',
  '2496936':   gold,
  '100411705': teal,
});

// Name-to-color mapper for recruiter/team members
export const NAME_COLORS = [
  '#5ec4cf', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#3b82f6',
  '#ec4899', '#f97316', '#06b6d4', '#84cc16', '#a78bfa', '#fb923c',
  '#14b8a6', '#e879f9', '#fbbf24', '#6366f1',
];

// Shared SWR config
export const SWR_OPTS = {
  refreshInterval: 8 * 60 * 60 * 1000,   // 8 hours
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60 * 60 * 1000,       // dedup within 1 hour
  keepPreviousData: true,
  errorRetryCount: 2,
} as const;

// Excluded from recruiter scorecard
export const EXCLUDED_RECRUITER_NAMES = new Set([
  'Taylor Matthews',
  'Bryan D\'Alessandro',
  'Daniel Gilham',
  'Ryan Koenig',
  'Nicholas Corvino',
  'Shane Provost',
  'Kamini Ramlakhan',
]);

// Sentiment tier colors
export const SENTIMENT_TIER_COLORS: Record<string, string> = {
  'Advocate': '#4ade80',
  'Positive': '#5ec4cf',
  'Neutral': '#fbbf24',
  'At Risk': '#fb923c',
  'High Risk': '#f87171',
};
