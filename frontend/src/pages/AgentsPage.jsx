import React, { useState } from 'react';
import { useWorkflow } from '../hooks/useWorkflow';
import { workflowsApi } from '../api/workflows';
import useWorkflowStore from '../store/workflowStore';
import { NODE_TYPES } from '../constants/nodeTypes';

const STATUS = {
  active:      { dot: 'var(--accent)',       bg: 'rgba(0,255,136,0.1)' },
  draft:       { dot: 'var(--text3)',         bg: 'rgba(72,79,88,0.2)' },
  archived:    { dot: 'var(--trigger-light)', bg: 'rgba(239,68,68,0.1)' },
  quarantined: { dot: '#f87171',             bg: 'rgba(239,68,68,0.15)' },
};

function WorkflowCard({ wf, onEdit, onUse, style }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [hovered, setHovered]             = useState(false);
  const s = STATUS[wf.status] || STATUS.draft;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    try {
      setDeleting(true);
      await workflowsApi.delete(wf.id);
      useWorkflowStore.getState().deleteWorkflow(wf.id);
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const typeCounts = {};
  (wf.nodes || []).forEach(n => { typeCounts[n.type] = (typeCounts[n.type] || 0) + 1; });

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hovered ? 'rgba(0,255,136,0.2)' : 'var(--border)'}`,
        borderTop: `2px solid ${hovered ? 'var(--accent)' : 'var(--border2)'}`,
        borderRadius: 10, padding: '18px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'all 0.18s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.2)',
        opacity: deleting ? 0.4 : 1,
        ...style,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
            color: 'var(--text)', marginBottom: 3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{wf.name}</div>
          {wf.description && (
            <div style={{
              fontSize: 11, color: 'var(--text3)', fontFamily: 'IBM Plex Mono, monospace',
              lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>{wf.description}</div>
          )}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 20, background: s.bg, flexShrink: 0,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />
          <span style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', color: s.dot, textTransform: 'uppercase', fontWeight: 700 }}>
            {wf.status}
          </span>
        </div>
      </div>

      {/* Node type pills */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', minHeight: 20 }}>
        {Object.entries(typeCounts).map(([type, count]) => {
          const info = NODE_TYPES[type];
          if (!info) return null;
          return (
            <span key={type} style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 7px', borderRadius: 4, fontSize: 10,
              fontFamily: 'Space Mono, monospace',
              background: info.colorAlpha, color: info.badgeStyle.color,
            }}>
              {info.icon} {count}
            </span>
          );
        })}
        {!(wf.nodes || []).length && (
          <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'IBM Plex Mono, monospace' }}>
            Empty canvas
          </span>
        )}
      </div>

      {/* Meta */}
      <div style={{
        fontSize: 10, color: 'var(--text3)', fontFamily: 'IBM Plex Mono, monospace',
        display: 'flex', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 10,
      }}>
        <span>{(wf.nodes||[]).length} nodes</span>
        <span>{(wf.edges||[]).length} edges</span>
        <span style={{ marginLeft: 'auto' }}>{(wf.created_at||'').slice(0,10)}</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        {/* Use — disabled if quarantined */}
        {wf.status === 'quarantined' ? (
          <div style={{ flex: 1, padding: '9px 0', borderRadius: 6, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, letterSpacing: '0.2px' }}>
            🔒 Quarantined
          </div>
        ) : (
          <button
            onClick={() => onUse(wf)}
            style={{ flex: 1, padding: '9px 0', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#000', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.2px' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 18px rgba(0,255,136,0.35)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            Use
          </button>
        )}
        {/* Edit */}
        <button
          onClick={() => onEdit(wf)}
          style={{
            padding: '9px 14px', borderRadius: 6,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text2)', fontFamily: 'Syne, sans-serif',
            fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
        >
          ✏ Edit
        </button>
        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          title={confirmDelete ? 'Click again to confirm' : 'Delete'}
          style={{
            padding: '9px 12px', borderRadius: 6,
            background: confirmDelete ? 'rgba(239,68,68,0.15)' : 'transparent',
            border: `1px solid ${confirmDelete ? 'var(--trigger)' : 'var(--border)'}`,
            color: confirmDelete ? 'var(--trigger-light)' : 'var(--text3)',
            fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 12,
            cursor: deleting ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!confirmDelete) { e.currentTarget.style.borderColor = 'var(--trigger)'; e.currentTarget.style.color = 'var(--trigger-light)'; }}}
          onMouseLeave={e => { if (!confirmDelete) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; }}}
        >
          {deleting ? '…' : confirmDelete ? '✓?' : '🗑'}
        </button>
      </div>
      {confirmDelete && !deleting && (
        <div style={{ fontSize: 10, color: 'var(--trigger)', fontFamily: 'IBM Plex Mono, monospace', textAlign: 'center', marginTop: -4 }}>
          Click 🗑 again to confirm delete
        </div>
      )}
    </div>
  );
}

export default function AgentsPage({ onEditWorkflow, onNewWorkflow, onUseWorkflow }) {
  const { workflows } = useWorkflow();
  const [search, setSearch] = useState('');

  const filtered = workflows.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── UPPER HALF ──────────────────────────────────────── */}
      <div style={{
        flex: '0 0 42%', display: 'flex', flexDirection: 'column',
        padding: '0 44px',
        background: `
          radial-gradient(ellipse at 75% 10%, rgba(0,255,136,0.05) 0%, transparent 50%),
          radial-gradient(ellipse at 15% 90%, rgba(124,58,237,0.05) 0%, transparent 50%)
        `,
        borderBottom: '1px solid var(--border)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />

        {/* Left: Create Workflow — Right: चक्रView logo */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 28, paddingBottom: 0, position: 'relative', zIndex: 1,
        }}>
          {/* Create Workflow button — left */}
          <button
            onClick={onNewWorkflow}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 20px', borderRadius: 8,
              background: 'var(--accent)', color: '#000',
              fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: 13, border: 'none', cursor: 'pointer',
              transition: 'all 0.18s', letterSpacing: '0.2px',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(0,255,136,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
            Create Workflow
          </button>

          {/* चक्रView logo — right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--accent)', boxShadow: '0 0 14px var(--accent)',
              animation: 'logoPulse 2s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: 40, color: 'var(--text)', letterSpacing: '-1px',
            }}>चक्रview</span>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: 10, fontFamily: 'Space Mono, monospace',
            color: 'var(--accent)', letterSpacing: '2px',
            textTransform: 'uppercase', marginBottom: 10,
          }}>
            Agent Workflows
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 'clamp(26px, 3.5vw, 48px)', color: 'var(--text)',
            letterSpacing: '-2px', lineHeight: 1.08, margin: '0 0 16px',
          }}>
            Select a workflow<br />
            <span style={{ color: 'var(--text2)', fontWeight: 400, letterSpacing: '-1px' }}>to chat with or edit</span>
          </h1>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text3)', fontSize: 13, pointerEvents: 'none',
              }}>⌕</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search workflows…"
                style={{
                  width: 260, padding: '8px 10px 8px 30px', borderRadius: 7,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 12, outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'IBM Plex Mono, monospace' }}>
              {filtered.length} workflow{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ── LOWER HALF — cards ──────────────────────────────── */}
      <div style={{
        flex: 1, overflowX: 'auto', overflowY: 'auto',
        padding: '24px 44px',
      }}>
        {filtered.length === 0 ? (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text3)', gap: 12,
          }}>
            <div style={{ fontSize: 48, opacity: 0.08 }}>⬡</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13 }}>
              {search ? 'No workflows match your search' : 'No workflows yet'}
            </div>
            {!search && (
              <button onClick={onNewWorkflow} style={{
                marginTop: 4, padding: '8px 20px', borderRadius: 7,
                background: 'var(--accent)', color: '#000',
                fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: 13, border: 'none', cursor: 'pointer',
              }}>
                + Create your first workflow
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(filtered.length, 4)}, minmax(260px, 1fr))`,
            gap: 16, alignContent: 'start',
          }}>
            {filtered.map((wf, i) => (
              <WorkflowCard
                key={wf.id}
                wf={wf}
                onEdit={onEditWorkflow}
                onUse={onUseWorkflow}
                style={{ animation: `slideUpCard 0.25s ease ${i * 0.05}s both` }}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUpCard {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
