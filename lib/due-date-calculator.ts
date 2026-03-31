/**
 * Due Date Calculator for Advisor Onboarding Tasks
 *
 * Timing Anchors:
 * - Day 0 = Offer Accepted date (Stage 6: "2496936")
 * - Launch Date = actual_launch_date or desired_start_date
 *
 * Task Timing Examples:
 * - "Within 24 hrs" → Day 0 + 1 day
 * - "Day 7-10" → Day 0 + 7 days (use earliest)
 * - "T-7" → Launch Date - 7 days
 * - "T+2" → Launch Date + 2 days
 */

export type DueAnchor = 'day0' | 'launch' | 'post_launch';

export interface DueDateInput {
  timing: string;        // e.g. "Within 24 hrs", "T-7", "Day 7-10"
  day0_date?: string | null;    // Offer Accepted date
  launch_date?: string | null;  // Launch date
}

export interface DueDateResult {
  due_date: string | null;  // YYYY-MM-DD
  anchor: DueAnchor;
  offset_days: number;
}

/**
 * Parse timing string and calculate due date
 */
export function calculateDueDate(input: DueDateInput): DueDateResult {
  const { timing, day0_date, launch_date } = input;
  const timingLower = timing.toLowerCase();

  // T-X pattern (Before Launch)
  if (timingLower.includes('t-')) {
    const match = timingLower.match(/t-(\d+)/);
    if (match && launch_date) {
      const days = parseInt(match[1]);
      return {
        due_date: addDays(launch_date, -days),
        anchor: 'launch',
        offset_days: -days,
      };
    }
    return { due_date: null, anchor: 'launch', offset_days: 0 };
  }

  // T+X or Day X pattern (After Launch)
  if (timingLower.includes('t+') || timingLower.includes('week ')) {
    const tPlusMatch = timingLower.match(/t\+(\d+)/);
    const weekMatch = timingLower.match(/week (\d+)/);

    if (tPlusMatch && launch_date) {
      const days = parseInt(tPlusMatch[1]);
      return {
        due_date: addDays(launch_date, days),
        anchor: 'post_launch',
        offset_days: days,
      };
    }

    if (weekMatch && launch_date) {
      const week = parseInt(weekMatch[1]);
      const days = week * 7;
      return {
        due_date: addDays(launch_date, days),
        anchor: 'post_launch',
        offset_days: days,
      };
    }
    return { due_date: null, anchor: 'post_launch', offset_days: 0 };
  }

  // Launch Day / Day 1
  if (timingLower.includes('launch day') || timingLower === 'day 1') {
    return {
      due_date: launch_date || null,
      anchor: 'launch',
      offset_days: 0,
    };
  }

  // Day 0 (Signing)
  if (timingLower === 'day 0') {
    return {
      due_date: day0_date || null,
      anchor: 'day0',
      offset_days: 0,
    };
  }

  // "Within X hrs/days" pattern
  const withinMatch = timingLower.match(/within (\d+)\s*(hr|hour|day)/);
  if (withinMatch && day0_date) {
    const amount = parseInt(withinMatch[1]);
    const unit = withinMatch[2];
    const days = unit.startsWith('hr') ? Math.ceil(amount / 24) : amount;
    return {
      due_date: addDays(day0_date, days),
      anchor: 'day0',
      offset_days: days,
    };
  }

  // "Day X" or "Day X-Y" pattern (use earliest)
  const dayMatch = timingLower.match(/day (\d+)(?:-(\d+))?/);
  if (dayMatch && day0_date) {
    const days = parseInt(dayMatch[1]);
    return {
      due_date: addDays(day0_date, days),
      anchor: 'day0',
      offset_days: days,
    };
  }

  // "By T-X" pattern
  const byTMatch = timingLower.match(/by t-(\d+)/);
  if (byTMatch && launch_date) {
    const days = parseInt(byTMatch[1]);
    return {
      due_date: addDays(launch_date, -days),
      anchor: 'launch',
      offset_days: -days,
    };
  }

  // "By Day X" pattern
  const byDayMatch = timingLower.match(/by day (\d+)/);
  if (byDayMatch && day0_date) {
    const days = parseInt(byDayMatch[1]);
    return {
      due_date: addDays(day0_date, days),
      anchor: 'day0',
      offset_days: days,
    };
  }

  // "Morning" — Launch Day morning tasks (Phase 5)
  if (timingLower === 'morning') {
    return {
      due_date: launch_date || null,
      anchor: 'launch',
      offset_days: 0,
    };
  }

  // Kickoff-meeting tasks: "During mtg", "With kickoff", "With kick-off", "EOD same day", "Post-meeting"
  if (
    timingLower === 'during mtg' ||
    timingLower === 'with kickoff' ||
    timingLower === 'with kick-off' ||
    timingLower === 'eod same day' ||
    timingLower === 'post-meeting'
  ) {
    if (day0_date) {
      return {
        due_date: addDays(day0_date, 7),
        anchor: 'day0',
        offset_days: 7,
      };
    }
    return { due_date: null, anchor: 'day0', offset_days: 7 };
  }

  // "Start of Phase 3" — Phase 3 begins after kickoff (~Day 10)
  if (timingLower === 'start of phase 3') {
    if (day0_date) {
      return {
        due_date: addDays(day0_date, 10),
        anchor: 'day0',
        offset_days: 10,
      };
    }
    return { due_date: null, anchor: 'day0', offset_days: 10 };
  }

  // Phase 3 timing (no specific date)
  if (timingLower === 'phase 3') {
    // Default to 21 days before launch (mid-Phase 3)
    if (launch_date) {
      return {
        due_date: addDays(launch_date, -21),
        anchor: 'launch',
        offset_days: -21,
      };
    }
  }

  // Weekly, Ongoing, As needed (no specific due date)
  if (timingLower.includes('weekly') || timingLower.includes('ongoing') || timingLower.includes('as needed')) {
    return { due_date: null, anchor: 'day0', offset_days: 0 };
  }

  // Default: no due date calculable
  return { due_date: null, anchor: 'day0', offset_days: 0 };
}

/**
 * Add days to a date string
 */
function addDays(dateString: string, days: number): string {
  const date = new Date(dateString + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Get Day 0 date from deal properties
 * Day 0 = when deal moved to "Offer Accepted" stage (2496936)
 */
export function getDay0Date(deal: {
  closedate?: string;
  dealstage?: string;
  hs_lastmodifieddate?: string;
}): string | null {
  // If deal is in Offer Accepted or Launched, use closedate
  if (deal.dealstage === '2496936' || deal.dealstage === '100411705') {
    return deal.closedate || null;
  }
  return null;
}

/**
 * Get Launch Date from deal properties
 */
export function getLaunchDate(deal: {
  actual_launch_date?: string;
  desired_start_date?: string;
}): string | null {
  return deal.actual_launch_date || deal.desired_start_date || null;
}
