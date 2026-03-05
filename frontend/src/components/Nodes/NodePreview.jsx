import React from 'react';

function getPreviewText(type, config = {}) {
  switch (type) {
    case 'agent':
      return config.prompt || 'No prompt configured';
    case 'function':
      return config.code || 'No code yet';
    case 'trigger':
      return `Type: ${config.triggerType || 'manual'}${config.cron ? ` · ${config.cron}` : ''}`;
    case 'output':
      return `Channel: ${config.channel || 'none'} · Format: ${config.format || 'json'}`;
    default:
      return '';
  }
}

/**
 * @param {{ type: string, config: object }} props
 */
export default function NodePreview({ type, config }) {
  const text = getPreviewText(type, config);
  const isCode = type === 'function';

  return (
    <div
      style={{
        padding: '8px 12px',
        fontSize: 11,
        color: isCode ? 'var(--fn-light)' : 'var(--text2)',
        lineHeight: 1.5,
        fontFamily: 'IBM Plex Mono, monospace',
        maxHeight: 52,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
      }}
    >
      {text}
    </div>
  );
}
