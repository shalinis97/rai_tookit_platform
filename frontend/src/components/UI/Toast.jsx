import React from 'react';

const TYPE_STYLES = {
  success: {
    background: 'rgba(0,255,136,0.15)',
    border: '1px solid rgba(0,255,136,0.3)',
    color: 'var(--accent)',
    icon: '✓',
  },
  error: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: 'var(--trigger-light)',
    icon: '✗',
  },
  info: {
    background: 'rgba(14,165,233,0.15)',
    border: '1px solid rgba(14,165,233,0.3)',
    color: 'var(--fn-light)',
    icon: 'ℹ',
  },
};

function ToastItem({ toast, onRemove }) {
  const s = TYPE_STYLES[toast.type] || TYPE_STYLES.info;
  return (
    <div
      className="animate-toast-in"
      onClick={() => onRemove(toast.id)}
      style={{
        padding: '10px 16px',
        borderRadius: 8,
        fontSize: 12,
        fontFamily: 'IBM Plex Mono, monospace',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        ...s,
      }}
    >
      <span>{s.icon}</span>
      <span>{toast.msg}</span>
    </div>
  );
}

/**
 * @param {{ toasts: Array, onRemove: (id) => void }} props
 */
export default function Toast({ toasts, onRemove }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 40,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
