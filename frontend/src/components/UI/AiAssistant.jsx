import React, { useState, useRef, useEffect } from 'react';
import api from '../../api/client';

const mono = { fontFamily: 'IBM Plex Mono, monospace' };
const syne = { fontFamily: 'Syne, sans-serif' };

export default function AiAssistant({ title, placeholder, systemPrompt, onInsert, accentColor = 'var(--accent)', height = 480 }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        system: systemPrompt,
        messages: newMessages,
        max_tokens: 1000,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (e) {
      const detail = e.response?.data?.detail || e.message;
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${detail}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 14px', borderRadius: 7,
          border: `1px solid ${accentColor}44`,
          background: `${accentColor}0f`,
          color: accentColor, cursor: 'pointer',
          fontSize: 12, fontWeight: 600, ...syne,
          transition: 'all 0.15s', width: '100%',
          justifyContent: 'center', marginTop: 8,
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${accentColor}1e`}
        onMouseLeave={e => e.currentTarget.style.background = `${accentColor}0f`}
      >
        ✨ {title}
      </button>
    );
  }

  return (
    <div style={{
      border: `1px solid ${accentColor}33`, borderRadius: 10,
      overflow: 'hidden', background: 'var(--surface)',
      marginTop: 8, display: 'flex', flexDirection: 'column', height,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface2)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 14 }}>✨</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: accentColor, ...syne }}>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontSize: 10, ...mono }}>
              Clear
            </button>
          )}
          <button onClick={() => setOpen(false)} style={{ width: 22, height: 22, borderRadius: 4, border: 'none', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }}>
            ×
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--text3)', fontSize: 11, ...mono, textAlign: 'center', marginTop: 20 }}>
            Ask me anything…
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '90%', padding: '8px 11px',
              borderRadius: m.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
              background: m.role === 'user' ? `${accentColor}18` : 'var(--surface2)',
              border: `1px solid ${m.role === 'user' ? accentColor + '33' : 'var(--border)'}`,
              fontSize: 12, color: 'var(--text)', lineHeight: 1.65, ...mono,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {m.content}
            </div>
            {m.role === 'assistant' && onInsert && (
              <button
                onClick={() => onInsert(m.content)}
                style={{
                  marginTop: 4, padding: '3px 10px', borderRadius: 4,
                  border: `1px solid ${accentColor}44`, background: `${accentColor}10`,
                  color: accentColor, cursor: 'pointer', fontSize: 10, fontWeight: 600, ...syne,
                }}
              >
                ↑ Insert
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ padding: '8px 12px', borderRadius: '10px 10px 10px 2px', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text3)', ...mono }}>
              <span style={{ animation: 'runnerPulse 1s ease-in-out infinite', display: 'inline-block' }}>thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          rows={2}
          style={{
            flex: 1, padding: '7px 10px', borderRadius: 6,
            border: `1px solid ${input ? accentColor + '55' : 'var(--border)'}`,
            background: 'var(--surface2)', color: 'var(--text)',
            fontSize: 12, ...mono, outline: 'none', resize: 'none',
            lineHeight: 1.5, transition: 'border-color 0.15s',
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          style={{
            padding: '0 14px', borderRadius: 6, border: 'none',
            background: !input.trim() || loading ? 'var(--surface2)' : accentColor,
            color: !input.trim() || loading ? 'var(--text3)' : '#000',
            cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 700, transition: 'all 0.15s', flexShrink: 0,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
