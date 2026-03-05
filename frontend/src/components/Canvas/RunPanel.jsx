import React from 'react';
import { useWorkflow } from '../../hooks/useWorkflow';

const STATUS_LABELS = {
  idle: 'Ready',
  running: 'Executing…',
  done: 'Completed',
  error: 'Error',
};

const STATUS_COLORS = {
  idle: 'var(--text3)',
  running: 'var(--accent)',
  done: 'var(--accent)',
  error: 'var(--trigger)',
};

export default function RunPanel() {
  const { activeWorkflow, runStatus } = useWorkflow();
  const color = STATUS_COLORS[runStatus] || STATUS_COLORS.idle;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 10,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 14,
        minWidth: 180,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          className={runStatus === 'running' ? 'animate-runner' : undefined}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            boxShadow: runStatus !== 'idle' ? `0 0 6px ${color}` : 'none',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontFamily: 'IBM Plex Mono, monospace',
            color: 'var(--text2)',
          }}
        >
          {STATUS_LABELS[runStatus] || 'Ready'}
        </span>
      </div>

      <div
        style={{
          fontSize: 10,
          fontFamily: 'IBM Plex Mono, monospace',
          color: 'var(--text3)',
        }}
      >
        {activeWorkflow?.nodes.length ?? 0} nodes ·{' '}
        {activeWorkflow?.edges.length ?? 0} edges
      </div>
    </div>
  );
}
