/**
 * lib/sentiment.ts
 *
 * Sentiment Scoring Engine — Farther AX
 *
 * Computes a composite 0-100 sentiment score for advisor relationships using
 * four weighted signal categories:
 *
 *   Activity (35%)       — engagement count and frequency
 *   Engagement Tone (30%)— NLP sentiment from Grok AI on emails/notes/meetings
 *   Milestone (25%)      — deal stage progression and onboarding task completion
 *   Recency (10%)        — elapsed time since last meaningful activity
 *
 * Composite score maps to one of five tiers: Advocate, Positive, Neutral,
 * At Risk, High Risk.
 *
 * Smoothing via Exponential Moving Average (EMA, α=0.15) prevents score
 * whiplash between evaluation cycles. Tier downgrades require confirmation
 * from 2+ signal categories trending negative.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type SentimentTier = 'Advocate' | 'Positive' | 'Neutral' | 'At Risk' | 'High Risk';

export interface SentimentSignals {
  activity: {
    score: number;
    count: number;
    window_days: number;
  };
  tone: {
    score: number;
    positive_count: number;
    negative_count: number;
    neutral_count: number;
    details: string[];
  };
  milestone: {
    score: number;
    stage: string;
    stage_number: number;
  };
  recency: {
    score: number;
    days_since_last: number;
    last_activity_type: string;
  };
}

export interface SentimentResult {
  composite_score: number;
  tier: SentimentTier;
  activity_score: number;
  tone_score: number;
  milestone_score: number;
  recency_score: number;
  signals: SentimentSignals;
  engagements_analyzed: number;
}

/**
 * Engagement record shape as returned by fetchEngagements() in
 * app/api/command-center/advisor/[id]/route.ts
 */
export interface Engagement {
  type: 'email' | 'call' | 'meeting' | string;
  id: string;
  timestamp: string; // ISO 8601
  properties: Record<string, string>;
}

// ── Tier Configuration ─────────────────────────────────────────────────────────

export const TIER_CONFIG: Record<
  SentimentTier,
  { min: number; max: number; color: string; bgColor: string; icon: string }
> = {
  'Advocate':  { min: 82, max: 100, color: '#27ae60', bgColor: 'rgba(39,174,96,0.10)',   icon: '★' },
  'Positive':  { min: 65, max: 81,  color: '#1d7682', bgColor: 'rgba(29,118,130,0.10)',  icon: '▲' },
  'Neutral':   { min: 45, max: 64,  color: '#b27d2e', bgColor: 'rgba(178,125,46,0.08)', icon: '●' },
  'At Risk':   { min: 28, max: 44,  color: '#e67e22', bgColor: 'rgba(230,126,34,0.10)', icon: '◈' },
  'High Risk': { min: 0,  max: 27,  color: '#c0392b', bgColor: 'rgba(192,57,43,0.08)',  icon: '▼' },
};

// ── Milestone Stage Map ────────────────────────────────────────────────────────

/**
 * HubSpot deal stage IDs used in the Farther recruiting pipeline.
 * Each maps to a human-readable label and a numeric position (step).
 */
const STAGE_MAP: Record<string, { label: string; step: number }> = {
  '2496935':  { label: 'Step 5 – Offer Review',    step: 5 },
  '2496936':  { label: 'Step 6 – Offer Accepted',  step: 6 },
  '100411705':{ label: 'Step 7 – Launched',         step: 7 },
};

/**
 * Base milestone scores for each pipeline step.
 * Steps below 5 are not in the tracked stage map; treat as early-stage (score 20).
 */
const STAGE_BASE_SCORES: Record<number, number> = {
  5: 50,
  6: 70,
  7: 85,
};

// ── Weights ────────────────────────────────────────────────────────────────────

const WEIGHTS = {
  activity:  0.35,
  tone:      0.30,
  milestone: 0.25,
  recency:   0.10,
} as const;

// ── Utility Helpers ────────────────────────────────────────────────────────────

/**
 * Clamps a value to [0, 100] and rounds to one decimal place.
 */
function clamp(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}

/**
 * Filters engagements to those whose timestamps fall within the trailing
 * `windowDays` days from now. Engagements with missing timestamps are excluded.
 */
function filterToWindow(engagements: Engagement[], windowDays: number): Engagement[] {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  return engagements.filter((e) => {
    if (!e.timestamp) return false;
    const t = new Date(e.timestamp).getTime();
    return !isNaN(t) && t >= cutoff;
  });
}

// ── Core Scoring Functions ─────────────────────────────────────────────────────

/**
 * getTier
 *
 * Maps a composite score (0–100) to its corresponding SentimentTier.
 * Scores outside [0, 100] are clamped before lookup.
 */
export function getTier(score: number): SentimentTier {
  const s = Math.min(100, Math.max(0, score));
  for (const [tier, config] of Object.entries(TIER_CONFIG)) {
    if (s >= config.min && s <= config.max) {
      return tier as SentimentTier;
    }
  }
  // Fallback — should never be reached with a valid [0,100] input
  return 'Neutral';
}

/**
 * computeActivityScore
 *
 * Scores activity volume over a rolling time window on a 0–100 scale.
 *
 * Baseline expectation: ~8–12 engagements per 30-day window represents a
 * healthy relationship (score = 100). The curve is linear up to the ceiling
 * so that advisors with fewer touchpoints are scored proportionally.
 *
 * @param engagements  Full engagement array (any period).
 * @param dayWindow    Rolling window in days (default 30).
 * @returns            Score 0–100.
 */
export function computeActivityScore(
  engagements: Engagement[],
  dayWindow: number = 30
): number {
  const windowed = filterToWindow(engagements, dayWindow);
  const count = windowed.length;

  // Healthy baseline: 10 engagements / 30 days → 100
  // Scale linearly; anything at or above baseline = 100
  const BASELINE = 10 * (dayWindow / 30);
  const raw = (count / BASELINE) * 100;

  return clamp(raw);
}

/**
 * computeRecencyScore
 *
 * Scores how recently a meaningful engagement occurred on a 0–100 scale.
 *
 * Reference points (interpolated linearly between breakpoints):
 *   0 days  → 100
 *   3 days  →  85
 *   7 days  →  60
 *   14 days →  30
 *   30+ days→   0
 *
 * @param engagements  Full engagement array; sorted order is not assumed.
 * @returns            Score 0–100.
 */
export function computeRecencyScore(engagements: Engagement[]): number {
  if (engagements.length === 0) return 0;

  // Find the most recent valid timestamp
  let mostRecentMs = -Infinity;
  for (const e of engagements) {
    if (!e.timestamp) continue;
    const t = new Date(e.timestamp).getTime();
    if (!isNaN(t) && t > mostRecentMs) mostRecentMs = t;
  }

  if (mostRecentMs === -Infinity) return 0;

  const days = (Date.now() - mostRecentMs) / (1000 * 60 * 60 * 24);

  // Piecewise linear interpolation across defined breakpoints
  const breakpoints: [number, number][] = [
    [0,  100],
    [3,   85],
    [7,   60],
    [14,  30],
    [30,   0],
  ];

  if (days <= 0) return 100;
  if (days >= 30) return 0;

  for (let i = 0; i < breakpoints.length - 1; i++) {
    const [d0, s0] = breakpoints[i];
    const [d1, s1] = breakpoints[i + 1];
    if (days >= d0 && days <= d1) {
      const t = (days - d0) / (d1 - d0);
      return clamp(s0 + t * (s1 - s0));
    }
  }

  return 0;
}

/**
 * computeMilestoneScore
 *
 * Scores deal stage progression and optional onboarding task completion.
 *
 * Stage-based base scores:
 *   Step 5 (Offer Review)   → 50
 *   Step 6 (Offer Accepted) → 70
 *   Step 7 (Launched)       → 85
 *   Unknown / early stage   → 20
 *
 * Onboarding bonus (up to +15 points):
 *   onboardingProgress is expected as a fraction 0–1 (e.g. 0.6 = 60% complete).
 *   Bonus = onboardingProgress * 15, applied on top of stage base score.
 *
 * @param dealStage          HubSpot deal stage ID string.
 * @param onboardingProgress Optional 0–1 fraction of onboarding tasks completed.
 * @returns                  Score 0–100.
 */
export function computeMilestoneScore(
  dealStage: string,
  onboardingProgress?: number
): number {
  const stageInfo = STAGE_MAP[dealStage];
  const baseScore = stageInfo
    ? (STAGE_BASE_SCORES[stageInfo.step] ?? 20)
    : 20;

  let bonus = 0;
  if (
    onboardingProgress !== undefined &&
    onboardingProgress !== null &&
    !isNaN(onboardingProgress)
  ) {
    // Onboarding bonus is capped at 15 points and only meaningful if stage is known
    bonus = Math.min(15, Math.max(0, onboardingProgress) * 15);
  }

  return clamp(baseScore + bonus);
}

/**
 * computeCompositeScore
 *
 * Combines the four signal scores into a single weighted composite on 0–100.
 *
 * Weights: Activity 35% | Tone 30% | Milestone 25% | Recency 10%
 *
 * @param activity   Activity signal score (0–100).
 * @param tone       Engagement tone signal score (0–100).
 * @param milestone  Milestone progress signal score (0–100).
 * @param recency    Recency signal score (0–100).
 * @returns          Composite score 0–100.
 */
export function computeCompositeScore(
  activity: number,
  tone: number,
  milestone: number,
  recency: number
): number {
  const raw =
    activity  * WEIGHTS.activity  +
    tone      * WEIGHTS.tone      +
    milestone * WEIGHTS.milestone +
    recency   * WEIGHTS.recency;

  return clamp(raw);
}

/**
 * applyEMA
 *
 * Smooths a new score against a previous score using Exponential Moving Average.
 *
 *   smoothed = α × newScore + (1 − α) × previousScore
 *
 * A low alpha (default 0.15) means history is weighted heavily, preventing
 * a single bad cycle from causing a dramatic tier drop.
 *
 * @param newScore       The freshly computed composite score (0–100).
 * @param previousScore  The last stored composite score (0–100).
 * @param alpha          Smoothing factor in (0, 1]. Default 0.15.
 * @returns              Smoothed score 0–100.
 */
export function applyEMA(
  newScore: number,
  previousScore: number,
  alpha: number = 0.15
): number {
  if (alpha <= 0 || alpha > 1) {
    throw new RangeError(`EMA alpha must be in (0, 1]. Received: ${alpha}`);
  }
  return clamp(alpha * newScore + (1 - alpha) * previousScore);
}

// ── Downgrade Guard ────────────────────────────────────────────────────────────

/**
 * Signal trend comparison used by shouldDowngrade.
 * Provide current and previous values for each of the four signal categories.
 */
export interface SignalTrend {
  activity:  { current: number; previous: number };
  tone:      { current: number; previous: number };
  milestone: { current: number; previous: number };
  recency:   { current: number; previous: number };
}

/**
 * shouldDowngrade
 *
 * Multi-signal confirmation gate: returns true only when 2 or more independent
 * signal categories are trending negative (current < previous). This prevents
 * a single noisy signal from triggering a tier downgrade.
 *
 * @param current   Current composite score (0–100).
 * @param previous  Previous composite score (0–100).
 * @param signals   Per-signal current vs. previous breakdown.
 * @returns         true if a tier downgrade should be applied.
 */
export function shouldDowngrade(
  current: number,
  previous: number,
  signals: SignalTrend
): boolean {
  // Score must actually be moving downward to consider a downgrade
  if (current >= previous) return false;

  // Count how many signal categories are independently trending negative
  const categories: (keyof SignalTrend)[] = ['activity', 'tone', 'milestone', 'recency'];
  const negativeCount = categories.filter(
    (key) => signals[key].current < signals[key].previous
  ).length;

  // Require confirmation from at least 2 independent signals
  return negativeCount >= 2;
}

// ── Convenience Builder ────────────────────────────────────────────────────────

/**
 * buildSentimentResult
 *
 * Assembles a complete SentimentResult from pre-computed signal scores and the
 * raw engagements array used to derive them. Useful as a final step after all
 * four signal functions have been called individually.
 *
 * @param activity   Computed activity score (0–100).
 * @param tone       Tone score provided by Grok NLP layer (0–100).
 * @param milestone  Computed milestone score (0–100).
 * @param recency    Computed recency score (0–100).
 * @param signals    Full SentimentSignals object with per-category metadata.
 * @param engagements Original engagement array (used for engagements_analyzed count).
 * @returns          Complete SentimentResult ready for API response or DB write.
 */
export function buildSentimentResult(
  activity: number,
  tone: number,
  milestone: number,
  recency: number,
  signals: SentimentSignals,
  engagements: Engagement[]
): SentimentResult {
  const composite_score = computeCompositeScore(activity, tone, milestone, recency);
  const tier = getTier(composite_score);

  return {
    composite_score,
    tier,
    activity_score:  activity,
    tone_score:      tone,
    milestone_score: milestone,
    recency_score:   recency,
    signals,
    engagements_analyzed: engagements.length,
  };
}
