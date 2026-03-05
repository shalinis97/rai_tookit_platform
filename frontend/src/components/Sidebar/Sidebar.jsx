import React from 'react';
import NodePalette from './NodePalette';
import WorkflowList from './WorkflowList';

const LABEL_STYLE = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '1.5px',
  color: 'var(--text3)',
  textTransform: 'uppercase',
  marginBottom: 10,
  fontFamily: 'Space Mono, monospace',
};

const SECTION_STYLE = {
  padding: 16,
  borderBottom: '1px solid var(--border)',
};

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* NODE PALETTE */}
      <div style={SECTION_STYLE}>
        <div style={LABEL_STYLE}>Node Types</div>
        <NodePalette />
      </div>

      {/* WORKFLOW LIST */}
      <div
        style={{
          ...SECTION_STYLE,
          borderBottom: 'none',
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={LABEL_STYLE}>Saved Workflows</div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <WorkflowList />
        </div>
      </div>
    </aside>
  );
}
