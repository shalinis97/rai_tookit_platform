import React from 'react';

const PORT_DOT_BASE = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  border: '2px solid var(--border2)',
  background: 'var(--surface)',
  transition: 'all 0.15s',
  cursor: 'crosshair',
  flexShrink: 0,
};

function PortDot({ color, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      data-port="true"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...PORT_DOT_BASE,
        borderColor: hovered ? (color || 'var(--accent)') : 'var(--border2)',
        background:  hovered ? (color || 'var(--accent)') : 'var(--surface)',
        boxShadow:   hovered ? `0 0 6px ${color || 'var(--accent)'}` : 'none',
      }}
    />
  );
}

export default function NodePorts({ type, nodeId, onPortClick }) {
  const hasInput  = type !== 'trigger';
  const hasOutput = type !== 'output';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 12px 10px' }}>
      {/* INPUT PORT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {hasInput && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <PortDot onClick={(e) => { e.stopPropagation(); onPortClick(nodeId, 'in'); }} />
            <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'Space Mono, monospace' }}>
              in
            </span>
          </div>
        )}
      </div>

      {/* OUTPUT PORT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
        {hasOutput && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexDirection: 'row-reverse' }}>
            <PortDot onClick={(e) => { e.stopPropagation(); onPortClick(nodeId, 'out'); }} />
            <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'Space Mono, monospace' }}>
              out
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
