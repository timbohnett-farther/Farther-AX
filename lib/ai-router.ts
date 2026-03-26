/**
 * AI Model Router — Auto-selects the best model for each task
 *
 * Replaces Grok/xAI with OpenAI models via AiZolo proxy.
 * Routes tasks to the optimal model based on complexity:
 *   - GPT-4.1-mini: Chat Q&A, summaries, briefings (fast, cost-effective)
 *   - GPT-4.1: Note parsing, sentiment analysis, complex extraction (precision)
 *
 * Falls back gracefully: if GPT-4.1 fails, retries with mini.
 */

import { chatCompletion, MODELS, type ChatMessage } from './aizolo';

// ── Task types for auto-routing ──────────────────────────────────────────────

export type AITask =
  | 'chat'           // Interactive pipeline Q&A
  | 'briefing'       // Advisor briefing/summary generation
  | 'activities'     // Activity timeline summary
  | 'emails'         // Email digest summary
  | 'engagements'    // Engagement overview
  | 'note_parsing'   // Complex JSON extraction from recruiter notes
  | 'sentiment'      // NLP tone analysis for relationship scoring
  | 'email_gen';     // Email body generation

// ── Model routing rules ──────────────────────────────────────────────────────

const TASK_MODEL_MAP: Record<AITask, string> = {
  // Fast tasks → GPT-4.1-mini (quick responses, lower cost)
  chat:        MODELS.MINI,
  briefing:    MODELS.MINI,
  activities:  MODELS.MINI,
  emails:      MODELS.MINI,
  engagements: MODELS.MINI,
  email_gen:   MODELS.MINI,

  // Precision tasks → GPT-4.1 (complex extraction, high accuracy needed)
  note_parsing: MODELS.GPT4,
  sentiment:    MODELS.GPT4,
};

// ── Default temperature per task type ────────────────────────────────────────

const TASK_TEMPERATURE: Record<AITask, number> = {
  chat:         0.3,
  briefing:     0.3,
  activities:   0.3,
  emails:       0.3,
  engagements:  0.3,
  note_parsing: 0.1,   // Very precise for JSON extraction
  sentiment:    0.1,    // Very precise for NLP scoring
  email_gen:    0.6,
};

// ── Public API ───────────────────────────────────────────────────────────────

export interface AIRouterOptions {
  task: AITask;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Override the auto-selected model */
  forceModel?: string;
}

export interface AIRouterResult {
  content: string;
  model: string;
  task: AITask;
}

/**
 * Route an AI request to the optimal model based on task type.
 * Auto-detects the best model, with optional override.
 */
export async function aiComplete(opts: AIRouterOptions): Promise<AIRouterResult> {
  const { task, messages, maxTokens, forceModel } = opts;
  const model = forceModel || TASK_MODEL_MAP[task] || MODELS.MINI;
  const temperature = opts.temperature ?? TASK_TEMPERATURE[task] ?? 0.3;

  try {
    const content = await chatCompletion(model, messages, {
      temperature,
      max_tokens: maxTokens,
    });

    return { content, model, task };
  } catch (err) {
    // If the full model fails, fall back to mini for non-precision tasks
    if (model === MODELS.GPT4) {
      console.warn(`[ai-router] GPT-4.1 failed for ${task}, falling back to mini:`, err);
      try {
        const content = await chatCompletion(MODELS.MINI, messages, {
          temperature,
          max_tokens: maxTokens,
        });
        return { content, model: MODELS.MINI, task };
      } catch (fallbackErr) {
        console.error(`[ai-router] Fallback to mini also failed for ${task}:`, fallbackErr);
        throw fallbackErr;
      }
    }
    throw err;
  }
}

/**
 * Get the recommended model for a task type.
 * Useful for logging/debugging which model will be used.
 */
export function getModelForTask(task: AITask): string {
  return TASK_MODEL_MAP[task] || MODELS.MINI;
}
