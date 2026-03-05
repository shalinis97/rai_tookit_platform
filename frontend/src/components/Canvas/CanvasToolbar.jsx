import React from 'react';
import { useWorkflow } from '../../hooks/useWorkflow';

const TOOL_STYLE = {
  width: 32,
  height: 32,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  cursor: 'pointer',
  color: 'var(--text3)',
  transition: 'all 0.15s',
  border: 'none',
  background: 'transparent',
  fontFamily: 'Syne, sans-serif',
};

export default function CanvasToolbar() {
  const { zoom, setZoom, clearConnecting } = useWorkflow();

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        display: 'flex',
        gap: 4,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 4,
      }}
    >
      {[
        { label: '↖', title: 'Select', action: () => clearConnecting() },
        { label: '+', title: 'Zoom in',  action: () => setZoom(zoom + 0.1) },
        { label: '−', title: 'Zoom out', action: () => setZoom(zoom - 0.1) },
        { label: '⊡', title: 'Reset zoom', action: () => setZoom(1) },
      ].map((tool) => (
        <button
          key={tool.label}
          title={tool.title}
          onClick={tool.action}
          style={TOOL_STYLE}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface2)';
            e.currentTarget.style.color = 'var(--text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text3)';
          }}
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}
