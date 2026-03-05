import React from 'react';
import { NODE_TYPES } from '../../constants/nodeTypes';

/**
 * @param {{ type: string, title: string }} props
 */
export default function NodeHeader({ type, title }) {
  const info = NODE_TYPES[type];
  if (!info) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Type icon */}
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          flexShrink: 0,
          background: info.colorAlpha,
        }}
      >
        {info.icon}
      </div>

      {/* Title */}
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: 'Syne, sans-serif',
        }}
      >
        {title}
      </span>

      {/* Badge */}
      <span
        style={{
          fontSize: 9,
          fontFamily: 'Space Mono, monospace',
          padding: '2px 6px',
          borderRadius: 3,
          fontWeight: 700,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          flexShrink: 0,
          ...info.badgeStyle,
        }}
      >
        {info.label}
      </span>
    </div>
  );
}
