import React from 'react';

/**
 * @param {{ tabs: string[], active: string, onChange: (tab: string) => void }} props
 */
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        marginBottom: 16,
        background: 'var(--surface2)',
        padding: 3,
        borderRadius: 7,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '6px 8px',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'Syne, sans-serif',
            borderRadius: 5,
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.15s',
            background: active === tab ? 'var(--surface3)' : 'transparent',
            color: active === tab ? 'var(--text)' : 'var(--text3)',
          }}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
}
