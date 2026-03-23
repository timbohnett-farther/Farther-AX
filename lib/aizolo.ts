// AiZolo API Client — OpenAI-compatible REST API wrapper
// Used for operational AI tasks (email generation, form processing, summarization)

export const MODELS = {
  NANO: 'openai/gpt-4.1-nano',
  MINI: 'openai/gpt-4.1-mini',
  GPT4: 'openai/gpt-4.1',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CompletionOptions {
  temperature?: number;
  max_tokens?: number;
}

interface CompletionResponse {
  id: string;
  choices: { message: { role: string; content: string }; finish_reason: string }[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429 && attempt < retries) {
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      continue;
    }
    return res;
  }
  throw new Error('AiZolo: max retries exceeded');
}

export async function chatCompletion(
  model: ModelId | string,
  messages: ChatMessage[],
  opts: CompletionOptions = {},
): Promise<string> {
  const baseUrl = process.env.AIZOLO_BASE_URL || 'https://chat.aizolo.com/api/v1';
  const apiKey = process.env.AIZOLO_API_KEY;

  if (!apiKey) {
    throw new Error('AIZOLO_API_KEY not configured');
  }

  const res = await fetchWithRetry(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.4,
      ...(opts.max_tokens && { max_tokens: opts.max_tokens }),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AiZolo API error ${res.status}: ${text}`);
  }

  const json: CompletionResponse = await res.json();
  return json.choices?.[0]?.message?.content || '';
}
