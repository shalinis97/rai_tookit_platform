import React, { useState } from 'react';
import { useWorkflow } from '../../hooks/useWorkflow';
import { workflowsApi } from '../../api/workflows';

export default function WorkflowList() {
  const { workflows, activeWfId, setActiveWorkflow, deleteWorkflow } = useWorkflow();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (e, wfId) => {
    e.stopPropagation();

    if (confirmDeleteId === wfId) {
      try {
        setDeletingId(wfId);
        await workflowsApi.delete(wfId);
        deleteWorkflow(wfId);
      } catch (err) {
        console.error('Delete failed:', err.message);
      } finally {
        setDeletingId(null);
        setConfirmDeleteId(null);
      }
    } else {
      setConfirmDeleteId(wfId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  if (workflows.length === 0) {
    return (
      <div style={{
        padding: '20px 0', textAlign: 'center',
        fontSize: 11, color: 'var(--text3)',
        fontFamily: 'IBM Plex Mono, monospace',
      }}>
        No workflows yet.<br />Click "+ New" to create one.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {workflows.map((wf) => {
        const isActive      = wf.id === activeWfId;
        const isConfirming  = confirmDeleteId === wf.id;
        const isDeleting    = deletingId === wf.id;

        return (
          <div
            key={wf.id}
            onClick={() => setActiveWorkflow(wf.id)}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${isActive ? 'rgba(0,255,136,0.3)' : 'transparent'}`,
              background: isActive ? 'rgba(0,255,136,0.06)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              opacity: isDeleting ? 0.4 : 1,
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--surface2)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }
              const btn = e.currentTarget.querySelector('.wf-delete-btn');
              if (btn) btn.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }
              const btn = e.currentTarget.querySelector('.wf-delete-btn');
              if (btn && !isConfirming) btn.style.opacity = '0';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
              <span style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text)',
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {wf.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span style={{
                  fontSize: 9, fontFamily: 'Space Mono, monospace',
                  padding: '1px 5px', borderRadius: 3,
                  background: 'var(--surface3)', color: 'var(--text3)',
                }}>
                  {(wf.nodes || []).length} nodes
                </span>
                <button
                  className="wf-delete-btn"
                  onClick={(e) => handleDelete(e, wf.id)}
                  title={isConfirming ? 'Click again to confirm' : 'Delete workflow'}
                  disabled={isDeleting}
                  style={{
                    opacity: isConfirming ? 1 : 0,
                    transition: 'opacity 0.15s, background 0.15s',
                    width: 20, height: 20, borderRadius: 4,
                    border: 'none', cursor: isDeleting ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, flexShrink: 0,
                    background: isConfirming ? 'rgba(239,68,68,0.2)' : 'transparent',
                    color: isConfirming ? 'var(--trigger-light)' : 'var(--text3)',
                  }}
                >
                  {isDeleting ? '…' : isConfirming ? '✓' : '🗑'}
                </button>
              </div>
            </div>

            <div style={{
              fontSize: 10, color: 'var(--text3)', marginTop: 2,
              fontFamily: 'IBM Plex Mono, monospace',
            }}>
              {(wf.created_at || wf.createdAt || '').slice(0, 10)} · {wf.status}
            </div>

            {isConfirming && (
              <div style={{
                fontSize: 10, color: 'var(--trigger)', marginTop: 4,
                fontFamily: 'IBM Plex Mono, monospace',
              }}>
                click 🗑 again to confirm delete
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
