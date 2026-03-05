import React from 'react';
import { useWorkflow } from '../../hooks/useWorkflow';

export default function StatusBar() {
  const { activeWorkflow, connectingFrom, zoom } = useWorkflow();

  return (
    <div
      style={{
        height: 26,
        padding: '0 16px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontSize: 10,
        fontFamily: 'IBM Plex Mono, monospace',
        color: 'var(--text3)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 6px var(--accent)',
        }}
      />
      <span>FlowMind v1.0</span>
      <span style={{ marginLeft: 'auto' }}>
        {activeWorkflow?.name} · {activeWorkflow?.nodes.length ?? 0} nodes ·{' '}
        {activeWorkflow?.edges.length ?? 0} edges
      </span>
      <span>zoom: {Math.round(zoom * 100)}%</span>
      {connectingFrom && (
        <span style={{ color: 'var(--accent)' }}>
          ● connecting — click a target input port
        </span>
      )}
    </div>
  );
}
