import React, { useState, useRef, useEffect, useCallback } from 'react';
import { executionsApi } from '../api/executions';
import { workflowsApi } from '../api/workflows';
import useWorkflowStore from '../store/workflowStore';

export default function ChatPage({ workflow, onBack }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm running the **${workflow.name}** workflow. Send me a message and I'll process it.`,
      ts: Date.now(),
    },
  ]);
  const [input, setInput]           = useState('');
  const [files, setFiles]           = useState([]);
  const [busy, setBusy]             = useState(false);
  const [quarantined, setQuarantined] = useState(false);
  const bottomRef                   = useRef(null);
  const fileInputRef                = useRef(null);
  const textareaRef                 = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  const extractBotReply = (execution) => {
    if (!execution) return 'No response.';
    const logs = execution.node_logs || [];

    const outputLog = [...logs].reverse().find(l => l.node_type === 'output' && l.status === 'completed');
    if (outputLog?.output_data) {
      const d = outputLog.output_data;
      if (typeof d.data?.output === 'string') return d.data.output;
      if (typeof d.output === 'string') return d.output;
      return JSON.stringify(d, null, 2);
    }

    const agentLog = [...logs].reverse().find(l => l.node_type === 'agent' && l.status === 'completed');
    if (agentLog?.output_data?.output) return agentLog.output_data.output;

    if (execution.output_data) {
      const d = execution.output_data;
      if (typeof d.output === 'string') return d.output;
      if (typeof d.data?.output === 'string') return d.data.output;
      return JSON.stringify(d, null, 2);
    }

    if (execution.status === 'failed') return `Workflow failed: ${execution.error || 'unknown error'}`;
    return 'Workflow completed with no output.';
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text && files.length === 0) return;
    if (busy) return;

    const userMsg = {
      role: 'user',
      content: text,
      files: files.map(f => f.name),
      ts: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setFiles([]);
    setBusy(true);

    const thinkingMsg = { role: 'assistant', content: null, thinking: true, ts: Date.now() + 1 };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const execution = await executionsApi.trigger({
        workflow_id:  workflow.id,
        triggered_by: 'manual',
        input_data: {
          message:  text,
          history:  nextMessages.map(m => ({ role: m.role, content: m.content })),
          files:    files.map(f => f.name),
        },
      });

      let result = execution;
      let polls  = 0;
      while (['pending', 'running'].includes(result.status) && polls < 60) {
        await sleep(1500);
        result = await executionsApi.get(execution.id);
        polls++;
      }

      const isPolicyViolation = result.status === 'failed' && result.error?.startsWith('Policy violation');
      const reply = isPolicyViolation
        ? `🚫 **Response blocked by policy**\n\n${result.error}`
        : extractBotReply(result);
      const isError = result.status === 'failed';

      if (isPolicyViolation) {
        setQuarantined(true);
        try {
          const updated = await workflowsApi.get(workflow.id);
          useWorkflowStore.getState().mergeWorkflow(updated);
        } catch (_) {}
      }

      setMessages(prev => [
        ...prev.filter(m => !m.thinking),
        {
          role: 'assistant',
          content: reply,
          error: isError,
          policyViolation: isPolicyViolation,
          executionId: result.id,
          ts: Date.now(),
        },
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev.filter(m => !m.thinking),
        { role: 'assistant', content: `Error: ${e.message}`, error: true, ts: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  }, [input, files, messages, busy, workflow.id]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleFileChange = (e) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    e.target.value = '';
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* HEADER */}
      <header style={{
        height: 52, minHeight: 52, flexShrink: 0,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, zIndex: 100,
      }}>
        <button onClick={onBack} style={headerBtn}>← Back</button>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: quarantined ? '#f87171' : 'var(--accent)', boxShadow: `0 0 8px ${quarantined ? '#f87171' : 'var(--accent)'}` }} />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{workflow.name}</span>
          {quarantined && (
            <span style={{ fontSize: 9, background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>
              QUARANTINED
            </span>
          )}
          <span style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', color: 'var(--text3)', background: 'var(--surface2)', padding: '2px 6px', borderRadius: 3, border: '1px solid var(--border)' }}>
            {(workflow.nodes || []).length} nodes
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.5px' }}>FlowMind</span>
        </div>
      </header>

      {/* QUARANTINE BANNER */}
      {quarantined && (
        <div style={{ background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.3)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <span style={{ fontSize: 13, color: '#fca5a5' }}>
            This workflow has been quarantined due to a policy violation. Go to the <strong>Quarantine</strong> tab to review and re-enable it.
          </span>
        </div>
      )}

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: 740, width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} workflow={workflow} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* INPUT */}
      <div style={{ flexShrink: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '16px 24px 20px' }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          {files.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 5, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text2)', fontFamily: 'IBM Plex Mono, monospace' }}>
                  <span>📎</span>
                  <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 0, fontSize: 13 }}>×</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', transition: 'border-color 0.15s' }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(0,255,136,0.3)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <button onClick={() => fileInputRef.current?.click()} title="Attach file" style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📎</button>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={busy ? 'Processing…' : 'Message the workflow… (Enter to send)'}
              disabled={busy || quarantined}
              rows={1}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, lineHeight: 1.5, resize: 'none', padding: '4px 0', minHeight: 28, maxHeight: 160, overflow: 'auto', opacity: (busy || quarantined) ? 0.5 : 1 }}
            />

            <button
              onClick={sendMessage}
              disabled={busy || quarantined || (!input.trim() && files.length === 0)}
              style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 6, background: (busy || quarantined || (!input.trim() && !files.length)) ? 'var(--surface3)' : 'var(--accent)', border: 'none', cursor: (busy || quarantined || !input.trim()) ? 'not-allowed' : 'pointer', color: '#000', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {busy ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)', animation: 'logoPulse 0.8s ease-in-out infinite' }} /> : '↑'}
            </button>
          </div>

          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 6, textAlign: 'center' }}>
            Each message runs the full <strong style={{ color: 'var(--text2)' }}>{workflow.name}</strong> workflow with your conversation history
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, workflow }) {
  const isUser = msg.role === 'user';

  if (msg.thinking) {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <BotAvatar />
        <div style={{ padding: '12px 16px', borderRadius: '4px 12px 12px 12px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', opacity: 0.6, animation: `logoPulse 1s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div style={{ maxWidth: '72%', padding: '10px 15px', borderRadius: '12px 4px 12px 12px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.content}
        </div>
        <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'IBM Plex Mono, monospace' }}>{new Date(msg.ts).toLocaleTimeString()}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <BotAvatar />
      <div style={{ flex: 1, maxWidth: '80%' }}>
        <div style={{ padding: '12px 16px', borderRadius: '4px 12px 12px 12px', background: msg.policyViolation ? 'rgba(239,68,68,0.08)' : msg.error ? 'rgba(239,68,68,0.08)' : 'var(--surface)', border: `1px solid ${(msg.error || msg.policyViolation) ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, color: msg.error ? 'var(--trigger-light)' : 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          <MarkdownText text={msg.content} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'IBM Plex Mono, monospace' }}>{new Date(msg.ts).toLocaleTimeString()}</span>
          {msg.executionId && <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'IBM Plex Mono, monospace' }}>· exec {msg.executionId.slice(0,8)}</span>}
        </div>
      </div>
    </div>
  );
}

function BotAvatar() {
  return <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>⬡</div>;
}

function MarkdownText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} style={{ color: 'var(--text)' }}>{p.slice(2, -2)}</strong>;
        return p;
      })}
    </>
  );
}

const headerBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 12, cursor: 'pointer' };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
