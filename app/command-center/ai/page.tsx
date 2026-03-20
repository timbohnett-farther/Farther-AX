'use client';

import { useState, useRef, useEffect } from 'react';
import { colors } from '@/lib/design-tokens';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  'Which deals are stalled and need attention?',
  'Who is launching in the next 30 days?',
  'Show me advisors with the largest AUM in the pipeline',
  'Which onboarding advisors have pain points around technology?',
  'What are the most common transition types right now?',
  'Flag any high-risk deals I should know about',
];

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-sm text-white flex-shrink-0 mr-2.5 mt-0.5">
          ✦
        </div>
      )}
      <div
        className={`max-w-[72%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'rounded-[18px_18px_4px_18px] bg-teal text-white'
            : 'rounded-[18px_18px_18px_4px] bg-white text-charcoal border border-cream-border'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

/**
 * AI Assistant Page - Chat interface with Grok
 *
 * Migrated to Tailwind utilities (removed all inline styles)
 */
export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AX Command Center AI, powered by Grok. I have live access to your full HubSpot pipeline — ask me about any advisor, deal status, upcoming launches, stalled deals, or pipeline insights.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/command-center/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? data.error ?? 'Error occurred.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-cream font-sans">
      {/* Header */}
      <div className="px-10 pt-6 pb-4 border-b border-cream-border bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-base text-white">
            ✦
          </div>
          <div>
            <h1 className="text-lg font-bold text-charcoal font-serif">
              AX AI Assistant
            </h1>
            <p className="text-xs text-slate">
              Powered by Grok · Live HubSpot pipeline access
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-10 py-6">
        {/* Suggested prompts (shown only at start) */}
        {messages.length === 1 && (
          <div className="mb-6">
            <p className="text-xs text-slate mb-2.5">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="px-3.5 py-1.5 rounded-full border border-cream-border bg-white text-slate text-xs cursor-pointer hover:bg-cream hover:border-teal transition-smooth"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}

        {loading && (
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-sm text-white">
              ✦
            </div>
            <div className="px-4 py-3 rounded-[18px_18px_18px_4px] bg-white border border-cream-border">
              <span className="text-slate text-xs">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-10 py-4 pb-6 bg-white border-t border-cream-border">
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-3 items-end"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Ask about pipeline, advisors, onboarding status, risks…"
            rows={2}
            className="flex-1 px-4 py-3 rounded-xl border border-cream-border text-sm resize-none text-charcoal bg-cream outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-smooth"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`px-6 py-3 rounded-xl border-none text-sm font-semibold transition-smooth ${
              input.trim() && !loading
                ? 'bg-teal text-white cursor-pointer hover:bg-teal-dark'
                : 'bg-cream-border text-slate cursor-default'
            }`}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
