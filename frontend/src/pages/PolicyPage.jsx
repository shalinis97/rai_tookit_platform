import React, { useState, useEffect, useCallback } from 'react';
import { policiesApi } from '../api/policies';
import api from '../api/client';
import AiAssistant from '../components/UI/AiAssistant';

const mono      = { fontFamily: 'IBM Plex Mono, monospace' };
const syne      = { fontFamily: 'Syne, sans-serif' };
const spaceMono = { fontFamily: 'Space Mono, monospace' };

const mkBadge = (bg, color) => ({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '2px 8px', borderRadius: 20,
  background: bg, fontSize: 9, fontWeight: 700,
  textTransform: 'uppercase', ...spaceMono, color,
});

const mkBtn = (bg, color = '#fff', border = 'transparent') => ({
  padding: '7px 16px', borderRadius: 6, border: `1px solid ${border}`,
  background: bg, color, cursor: 'pointer', fontSize: 12,
  fontWeight: 600, ...syne, transition: 'opacity 0.15s',
});

const lbl = { fontSize: 11, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 3, ...spaceMono };
const inp = { width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, boxSizing: 'border-box' };

const DEFAULT_REGO = `package ai.policies\n\nimport rego.v1\n\ndefault allow := false\n\n# Block harmful content\ndeny contains msg if {\n  harmful := {"violence", "abuse"}\n  some term in harmful\n  contains(lower(input.output), term)\n  msg := sprintf("Unsafe content: '%v'", [term])\n}\n\nallow if { count(deny) == 0 }\n`;

const DEFAULT_INPUT = `{\n  "agent": "my_agent",\n  "output": "Here is the answer to your question.",\n  "message": "Hello",\n  "consent": true,\n  "job_description": "",\n  "resumes": []\n}`;

// ── OPA status pill ───────────────────────────────────────────
function OpaStatus({ alive }) {
  if (alive === null) return null;
  const color = alive ? 'var(--accent)' : '#f87171';
  return (
    <span style={mkBadge(alive ? 'rgba(0,255,136,0.1)' : 'rgba(239,68,68,0.1)', color)}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
      OPA {alive ? 'Running' : 'Offline'}
    </span>
  );
}

// ── Toggle switch ─────────────────────────────────────────────
function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', background: on ? 'var(--accent)' : 'var(--border2)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </div>
  );
}

// ── Console output ────────────────────────────────────────────
function Console({ msg }) {
  if (!msg) return null;
  const isErr = msg.startsWith('❌') || msg.toLowerCase().includes('error');
  const isOk  = msg.startsWith('✅') || msg.startsWith('✓');
  return (
    <div style={{
      marginTop: 10, padding: '10px 14px', borderRadius: 6, fontSize: 12, ...mono,
      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      background: isErr ? 'rgba(239,68,68,0.08)' : isOk ? 'rgba(0,255,136,0.08)' : 'rgba(72,79,88,0.15)',
      border: `1px solid ${isErr ? 'rgba(239,68,68,0.2)' : isOk ? 'rgba(0,255,136,0.2)' : 'var(--border)'}`,
      color: isErr ? '#f87171' : isOk ? 'var(--accent)' : 'var(--text2)',
    }}>
      {msg}
    </div>
  );
}

// ── Rego textarea editor ──────────────────────────────────────
function RegoEditor({ code, onChange }) {
  return (
    <textarea
      value={code}
      onChange={e => onChange(e.target.value)}
      spellCheck={false}
      style={{
        width: '100%', height: 340, resize: 'vertical',
        background: '#0d1117', color: '#e6edf3',
        border: '1px solid var(--border)', borderRadius: 8,
        padding: '14px 16px', fontSize: 12, lineHeight: 1.65,
        ...mono, outline: 'none', boxSizing: 'border-box', tabSize: 2,
      }}
    />
  );
}

// ── Audit log row ─────────────────────────────────────────────
function AuditRow({ log }) {
  const [open, setOpen] = useState(false);
  const isDeny = log.decision === 'deny';
  const hasDetail = log.violations?.length > 0 || log.input_snapshot;
  return (
    <div style={{ borderRadius: 7, overflow: 'hidden', border: `1px solid ${isDeny ? 'rgba(239,68,68,0.2)' : 'rgba(0,255,136,0.15)'}`, marginBottom: 6 }}>
      <div
        onClick={() => hasDetail && setOpen(x => !x)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: hasDetail ? 'pointer' : 'default', background: isDeny ? 'rgba(239,68,68,0.06)' : 'rgba(0,255,136,0.04)' }}
      >
        <span>{isDeny ? '🚫' : '✅'}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', ...syne }}>{log.check_point}</span>
        <span style={{ fontSize: 10, color: 'var(--text3)', ...mono }}>{log.node_id ? `node: ${log.node_id.slice(0,8)}…` : ''}</span>
        <span style={{ fontSize: 11, color: isDeny ? '#f87171' : '#34d399', fontWeight: 700, ...mono, marginLeft: 'auto' }}>{log.decision.toUpperCase()}</span>
        <span style={{ fontSize: 10, color: 'var(--text3)', ...mono }}>{new Date(log.created_at).toLocaleTimeString()}</span>
        {hasDetail && <span style={{ color: 'var(--text3)', fontSize: 10 }}>{open ? '▲' : '▼'}</span>}
      </div>
      {open && (
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${isDeny ? 'rgba(239,68,68,0.15)' : 'var(--border)'}`, background: 'var(--surface2)' }}>
          {log.violations?.length > 0 && (
            <div style={{ marginBottom: log.input_snapshot ? 10 : 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 5 }}>VIOLATIONS</div>
              {log.violations.map((v, i) => (
                <div key={i} style={{ fontSize: 11, color: '#f87171', ...mono, marginBottom: 3 }}>→ {v}</div>
              ))}
            </div>
          )}
          {log.input_snapshot && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 5 }}>INPUT SNAPSHOT</div>
              <pre style={{ fontSize: 11, color: '#94a3b8', margin: 0, whiteSpace: 'pre-wrap', maxHeight: 180, overflow: 'auto', ...mono }}>
                {JSON.stringify(log.input_snapshot, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main PolicyPage ───────────────────────────────────────────
export default function PolicyPage() {
  const [policies, setPolicies]   = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [opaAlive, setOpaAlive]   = useState(null);
  const [selected, setSelected]   = useState(null);
  const [isNew, setIsNew]         = useState(false);
  const [code, setCode]           = useState('');
  const [name, setName]           = useState('');
  const [desc, setDesc]           = useState('');
  const [scope, setScope]         = useState('global');
  const [testInput, setTestInput] = useState(DEFAULT_INPUT);
  const [msg, setMsg]             = useState('');
  const [saving, setSaving]       = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tab, setTab]             = useState('editor');
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    try {
      const [pols, health, wfs] = await Promise.all([
        policiesApi.list(),
        policiesApi.opaHealth().catch(() => ({ opa_running: false })),
        api.get('/workflows/').then(r => r.data),
      ]);
      setPolicies(pols);
      setOpaAlive(health.opa_running);
      setWorkflows(wfs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectPolicy = async (p) => {
    setIsNew(false); setSelected(p); setMsg('');
    try {
      const full = await policiesApi.get(p.id);
      setCode(full.rego_code); setName(full.name);
      setDesc(full.description || ''); setScope(full.scope);
      setSelected(full);
    } catch { setMsg('❌ Failed to load policy'); }
  };

  const startNew = () => {
    setIsNew(true); setSelected(null);
    setCode(DEFAULT_REGO); setName(''); setDesc(''); setScope('global'); setMsg('');
  };

  const handleToggle = async (id) => {
    try {
      const u = await policiesApi.toggle(id);
      setPolicies(ps => ps.map(p => p.id === id ? { ...p, enabled: u.enabled } : p));
    } catch { setMsg('❌ Toggle failed'); }
  };

  const handleCompile = async () => {
    setMsg('Checking syntax…');
    try {
      const r = await policiesApi.compile(code);
      setMsg(r.status === 'success' ? '✅ Syntax valid' : `❌ ${r.error}`);
    } catch { setMsg('❌ Compile request failed'); }
  };

  const handleTest = async () => {
    setMsg('Running evaluation…');
    try {
      const input = JSON.parse(testInput);
      const r = await policiesApi.test(code, input);
      if (r.status === 'error') { setMsg(`❌ ${r.error}`); return; }
      setMsg(r.violated
        ? `❌ Violations:\n${r.violations.map(v => `  • ${v}`).join('\n')}`
        : '✅ Policy passed — no violations');
    } catch (e) { setMsg(`❌ ${e.message}`); }
  };

  const handleSave = async () => {
    if (!name.trim()) { setMsg('❌ Policy name is required'); return; }
    setSaving(true); setMsg('Saving…');
    try {
      const check = await policiesApi.compile(code);
      if (check.status === 'error') { setMsg(`❌ Syntax error:\n${check.error}`); return; }
      if (isNew) {
        const p = await policiesApi.create({ name, description: desc, scope, rego_code: code, enabled: true });
        setIsNew(false); setSelected(p); setMsg('✅ Policy created and pushed to OPA');
      } else {
        const p = await policiesApi.update(selected.id, { name, description: desc, scope, rego_code: code });
        setSelected(p); setMsg('✅ Policy updated');
      }
      await load();
    } catch (e) { setMsg(`❌ ${e.response?.data?.detail || e.message}`); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected || !window.confirm(`Delete "${selected.name}"?`)) return;
    try {
      await policiesApi.delete(selected.id);
      setSelected(null); setCode(''); setName(''); setMsg('');
      await load();
    } catch { setMsg('❌ Delete failed'); }
  };

  const loadAudit = async () => {
    try { setAuditLogs(await policiesApi.auditLogs({ limit: 100 })); }
    catch { setAuditLogs([]); }
  };

  useEffect(() => { if (tab === 'audit') loadAudit(); }, [tab]);

  const handleAssign = async (wf) => {
    if (!selected) return;
    const assigned = selected?.assignments?.some(a => a.workflow_id === wf.id);
    try {
      if (assigned) await policiesApi.unassign(selected.id, wf.id);
      else await policiesApi.assign(selected.id, wf.id);
      const full = await policiesApi.get(selected.id);
      setSelected(full);
    } catch (e) { setMsg(`❌ ${e.response?.data?.detail || e.message}`); }
  };

  const hasPanel = selected || isNew;

  return (
    <div style={{ height: '100%', display: 'flex', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '20px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ ...syne, fontWeight: 800, fontSize: 18, color: 'var(--text)', margin: 0 }}>Policies</h2>
          <OpaStatus alive={opaAlive} />
        </div>

        {loading
          ? <p style={{ color: 'var(--text3)', fontSize: 12, ...mono }}>Loading…</p>
          : <>
              {policies.map(p => (
                <div key={p.id} onClick={() => selectPolicy(p)} style={{
                  padding: '11px 13px', borderRadius: 8, cursor: 'pointer',
                  background: selected?.id === p.id ? 'rgba(0,255,136,0.08)' : 'var(--surface)',
                  border: `1px solid ${selected?.id === p.id ? 'rgba(0,255,136,0.3)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', ...syne, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <span style={mkBadge(p.scope === 'global' ? 'rgba(124,58,237,0.15)' : 'rgba(14,165,233,0.15)', p.scope === 'global' ? '#a855f7' : '#38bdf8')}>{p.scope}</span>
                      <span style={mkBadge('rgba(72,79,88,0.2)', 'var(--text3)')}>v{p.version}</span>
                    </div>
                  </div>
                  <Toggle on={p.enabled} onToggle={e => { e.stopPropagation(); handleToggle(p.id); }} />
                </div>
              ))}
              <button onClick={startNew} style={{ ...mkBtn('transparent', 'var(--accent)', 'rgba(0,255,136,0.3)'), marginTop: 4 }}>+ New Policy</button>
            </>
        }
      </div>

      {/* ── Editor panel ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!hasPanel ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text3)' }}>
            <span style={{ fontSize: 44 }}>🛡️</span>
            <p style={{ ...mono, fontSize: 13 }}>Select a policy or create a new one</p>
          </div>
        ) : (
          <>
            {/* Header bar */}
            <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={lbl}>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="Policy name" />
              </div>
              <div style={{ flex: 2, minWidth: 200 }}>
                <label style={lbl}>Description</label>
                <input value={desc} onChange={e => setDesc(e.target.value)} style={inp} placeholder="What does this policy enforce?" />
              </div>
              <div style={{ width: 180 }}>
                <label style={lbl}>Scope</label>
                <select value={scope} onChange={e => setScope(e.target.value)} style={inp}>
                  <option value="global">Global — all workflows</option>
                  <option value="local">Local — specific workflow</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignSelf: 'flex-end' }}>
                {!isNew && <button onClick={handleDelete} style={mkBtn('transparent', '#f87171', 'rgba(239,68,68,0.2)')}>Delete</button>}
                <button onClick={handleCompile} style={mkBtn('transparent', 'var(--fn-light)', 'rgba(14,165,233,0.3)')}>Compile</button>
                <button onClick={handleSave} disabled={saving} style={mkBtn('var(--accent)', '#000')}>{saving ? 'Saving…' : isNew ? 'Create' : 'Save'}</button>
              </div>
            </div>

            {/* Workflow assignment — only when local scope */}
            {scope === 'local' && (
              <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(14,165,233,0.04)' }}>
                <label style={lbl}>Assign to Workflows</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {workflows.length === 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text3)', ...mono }}>No workflows found</span>
                  )}
                  {workflows.map(wf => {
                    const assigned = selected?.assignments?.some(a => String(a.workflow_id) === String(wf.id));
                    return (
                      <button
                        key={wf.id}
                        onClick={() => handleAssign(wf)}
                        style={{
                          padding: '4px 12px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', ...syne,
                          border: assigned ? '1px solid var(--accent)' : '1px solid var(--border)',
                          background: assigned ? 'rgba(0,255,136,0.12)' : 'transparent',
                          color: assigned ? 'var(--accent)' : 'var(--text3)',
                        }}
                      >
                        {assigned ? '✓ ' : ''}{wf.name}
                      </button>
                    );
                  })}
                  {isNew && (
                    <span style={{ fontSize: 11, color: 'var(--text3)', ...mono, alignSelf: 'center' }}>
                      Save the policy first to assign workflows
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              {[['editor', '📝 Editor'], ['test', '🧪 Test'], ['audit', '📋 Audit Log']].map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, ...syne, background: 'transparent', color: tab === t ? 'var(--accent)' : 'var(--text3)', borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`, transition: 'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

              {tab === 'editor' && (
                <>
                  <div style={{ fontSize: 11, color: 'var(--text3)', ...mono, marginBottom: 8 }}>
                    Package: <span style={{ color: 'var(--accent)' }}>ai.policies</span> — pushed to OPA sidecar on save
                  </div>
                  <RegoEditor code={code} onChange={setCode} />
                  <Console msg={msg} />
                  <AiAssistant
                    title="Policy Assistant"
                    placeholder="Describe a policy rule in plain English…"
                    accentColor="#a855f7"
                    height={420}
                    systemPrompt={`You are an expert in Open Policy Agent (OPA) and the Rego policy language.
The user wants to write policies for an AI agent workflow system.
The OPA package used is: ai.policies
Input shape available to policies:
  input.agent        - node title (lowercased)
  input.output       - text output from the agent/node
  input.message      - original user message
  input.check_point  - one of: workflow_input, inter_node, mcp_call, workflow_output
  input.node_type    - agent, function, output
  input.node_title   - human-readable node title
  input.workflow_id  - UUID
  input.workflow_name- workflow name

When asked to generate a policy, output ONLY the complete valid Rego code block.
Use: package ai.policies, import rego.v1
Use deny contains msg if { ... } pattern.
Always end with: allow if { count(deny) == 0 }
Do not include explanation before or after the code block unless explicitly asked.`}
                    onInsert={(text) => {
                      // Extract code block if present
                      const match = text.match(/```[\w]*\n?([\s\S]*?)```/);
                      setCode(match ? match[1].trim() : text.trim());
                    }}
                  />
                </>
              )}

              {tab === 'test' && (
                <>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', ...spaceMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Rego Code</div>
                      <RegoEditor code={code} onChange={setCode} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', ...spaceMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Test Input (JSON)</div>
                      <textarea value={testInput} onChange={e => setTestInput(e.target.value)} spellCheck={false} style={{ width: '100%', height: 340, resize: 'vertical', background: '#0d1117', color: '#e6edf3', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', fontSize: 12, lineHeight: 1.65, ...mono, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                    <button onClick={handleTest} style={mkBtn('var(--fn-light)', '#000')}>▶ Run Test</button>
                    <button onClick={handleCompile} style={mkBtn('transparent', 'var(--text2)', 'var(--border)')}>Compile Check</button>
                  </div>
                  <Console msg={msg} />
                </>
              )}

              {tab === 'audit' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)', ...mono }}>Last 100 policy decisions</span>
                    <button onClick={loadAudit} style={mkBtn('transparent', 'var(--text3)', 'var(--border)')}>↻ Refresh</button>
                  </div>
                  {auditLogs.length === 0
                    ? <p style={{ color: 'var(--text3)', fontSize: 12, ...mono, textAlign: 'center', padding: 32 }}>No audit entries yet.</p>
                    : auditLogs.map(l => <AuditRow key={l.id} log={l} />)
                  }
                </>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}
