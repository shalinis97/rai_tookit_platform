import React, { useState, useEffect, useCallback } from 'react';
import { policiesApi } from '../api/policies';

const mono  = { fontFamily: 'IBM Plex Mono, monospace' };
const syne  = { fontFamily: 'Syne, sans-serif' };

export default function QuarantinePage({ onEditWorkflow }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [releasing, setReleasing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setWorkflows(await policiesApi.quarantine.list()); }
    catch { setWorkflows([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (wf) => {
    // Open workflow in editor — unquarantine happens on save
    onEditWorkflow?.(wf);
  };

  return (
<div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', padding: 32 }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🔒</span>
            <h2 style={{ ...syne, fontWeight: 800, fontSize: 28, color: 'var(--text)', letterSpacing: '-1px', margin: 0 }}>
              Quarantine
            </h2>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: 'rgba(239,68,68,0.15)', color: '#f87171',
              fontFamily: 'Space Mono, monospace',
            }}>
              {workflows.length} blocked
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text3)', ...mono, margin: 0, lineHeight: 1.6 }}>
            Workflows quarantined by policy violations. Edit and save a workflow to restore it.
          </p>
        </div>

        {/* Info banner */}
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 24, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
          <span style={{ fontSize: 12, color: '#f87171', ...mono, lineHeight: 1.6 }}>
            Quarantined workflows cannot be used until the violation is resolved. Open the workflow in the editor, fix the configuration, then save — it will automatically be restored to active.
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <p style={{ color: 'var(--text3)', fontSize: 13, ...mono }}>Loading…</p>
        ) : workflows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <p style={{ fontSize: 14, ...syne, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>No quarantined workflows</p>
            <p style={{ fontSize: 12, ...mono }}>All workflows are operating within policy bounds.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {workflows.map(wf => (
              <QuarantineCard
                key={wf.id}
                wf={wf}
                releasing={releasing === wf.id}
                onEdit={() => handleEdit(wf)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuarantineCard({ wf, onEdit }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid rgba(239,68,68,0.25)',
      borderLeft: '3px solid #f87171',
      borderRadius: 10, overflow: 'hidden',
    }}>
      {/* Main row */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', ...syne }}>{wf.name}</span>
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase' }}>
              quarantined
            </span>
          </div>
          {wf.description && (
            <p style={{ fontSize: 12, color: 'var(--text3)', ...mono, margin: '0 0 8px 26px', lineHeight: 1.5 }}>{wf.description}</p>
          )}
          <div style={{ display: 'flex', gap: 16, marginLeft: 26 }}>
            {wf.last_policy_name && (
              <span style={{ fontSize: 11, color: 'var(--text3)', ...mono }}>
                Policy: <span style={{ color: '#f87171' }}>{wf.last_policy_name}</span>
              </span>
            )}
            {wf.last_violated_at && (
              <span style={{ fontSize: 11, color: 'var(--text3)', ...mono }}>
                Quarantined: {new Date(wf.last_violated_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {wf.last_violations?.length > 0 && (
            <button
              onClick={() => setOpen(x => !x)}
              style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.25)', background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 11, fontFamily: 'Space Mono, monospace' }}
            >
              {open ? '▲' : '▼'} {wf.last_violations.length} violation{wf.last_violations.length !== 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={onEdit}
            style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid rgba(0,255,136,0.3)', background: 'rgba(0,255,136,0.08)', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Syne, sans-serif' }}
          >
            ✏️ Edit Workflow
          </button>
        </div>
      </div>

      {/* Violations detail */}
      {open && wf.last_violations?.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(239,68,68,0.15)', padding: '12px 20px 12px 46px', background: 'rgba(239,68,68,0.04)' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Violations
          </div>
          {wf.last_violations.map((v, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
              <span style={{ color: '#f87171', flexShrink: 0 }}>→</span>
              <span style={{ fontSize: 12, color: '#f87171', ...mono, lineHeight: 1.5 }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
