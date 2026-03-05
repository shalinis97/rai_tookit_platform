import React from 'react';
import { NODE_TYPES } from '../../constants/nodeTypes';

export default function NodePalette() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Object.entries(NODE_TYPES).map(([type, info]) => (
        <div
          key={type}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('nodeType', type)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 8,
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            cursor: 'grab',
            transition: 'all 0.15s',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border2)';
            e.currentTarget.style.transform = 'translateX(2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              flexShrink: 0,
              background: info.colorAlpha,
            }}
          >
            {info.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
              {info.label}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
              {info.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
