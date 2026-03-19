'use client';

import { useState, useRef, useEffect } from 'react';

const C = {
  dark: '#333333', white: '#ffffff', slate: '#5b6a71',
  teal: '#1d7682', bg: '#FAF7F2', cardBg: '#ffffff', border: '#e8e2d9',
  lightBlue: '#b6d0ed',
};

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
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: C.teal,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: C.white, flexShrink: 0, marginRight: 10, marginTop: 2,
        }}>✦</div>
      )}
      <div style={{
        maxWidth: '72%',
        padding: '12px 16px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? C.teal : C.white,
        color: isUser ? C.white : C.dark,
        fontSize: 14,
        lineHeight: 1.6,
        border: isUser ? 'none' : `1px solid ${C.border}`,
        whiteSpace: 'pre-wrap',
      }}>
        {message.content}
      </div>
    </div>
  );
}

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, fontFamily: "'Fakt', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '24px 40px 16px', borderBottom: `1px solid ${C.border}`, background: C.white }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: C.white }}>✦</div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif" }}>AX AI Assistant</h1>
            <p style={{ fontSize: 12, color: C.slate }}>Powered by Grok · Live HubSpot pipeline access</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px' }}>
        {/* Suggested prompts (shown only at start) */}
        {messages.length === 1 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: C.slate, marginBottom: 10 }}>Try asking:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: `1px solid ${C.border}`,
                    background: C.white, color: C.slate, fontSize: 12, cursor: 'pointer',
                    fontFamily: "'Fakt', system-ui, sans-serif",
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: C.white }}>✦</div>
            <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: C.white, border: `1px solid ${C.border}` }}>
              <span style={{ color: C.slate, fontSize: 13 }}>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 40px 24px', background: C.white, borderTop: `1px solid ${C.border}` }}>
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Ask about pipeline, advisors, onboarding status, risks…"
            rows={2}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 12, border: `1px solid ${C.border}`,
              fontSize: 14, fontFamily: "'Fakt', system-ui, sans-serif", resize: 'none',
              color: C.dark, background: C.bg, outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            style={{
              padding: '12px 24px', borderRadius: 12, border: 'none',
              background: input.trim() && !loading ? C.teal : C.border,
              color: input.trim() && !loading ? C.white : C.slate,
              fontSize: 14, fontWeight: 600, cursor: input.trim() && !loading ? 'pointer' : 'default',
              fontFamily: "'Fakt', system-ui, sans-serif", transition: 'all 0.15s',
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
