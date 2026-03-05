import React from 'react';
import Button from '../UI/Button';
import { useWorkflow } from '../../hooks/useWorkflow';

/**
 * @param {{ onNew: fn, onSave: fn, onRun: fn }} props
 */
export default function TopBar({ onNew, onSave, onRun }) {
  const { workflows, activeWfId, setActiveWorkflow, activeWorkflow, runStatus } = useWorkflow();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 52,
        minHeight: 52,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* LOGO */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 18,
          letterSpacing: '-0.5px',
          color: 'var(--text)',
        }}
      >
        <div
          className="animate-logo-pulse"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--accent)',
            flexShrink: 0,
          }}
        />
        FlowMind
      </div>

      {/* CENTER — workflow selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 12,
            color: 'var(--text2)',
          }}
        >
          <span>⚡</span>
          <select
            value={activeWfId}
            onChange={(e) => setActiveWorkflow(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 12,
              cursor: 'pointer',
              minWidth: 160,
            }}
          >
            {workflows.map((w) => (
              <option key={w.id} value={w.id} style={{ background: 'var(--surface2)' }}>
                {w.name}
              </option>
            ))}
          </select>
          <span
            style={{
              fontSize: 9,
              fontFamily: 'Space Mono, monospace',
              color: activeWorkflow?.status === 'active' ? 'var(--accent)' : 'var(--text3)',
            }}
          >
            {activeWorkflow?.status?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* RIGHT — actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button variant="ghost" onClick={onNew}>+ New</Button>
        <Button variant="ghost" icon="💾" onClick={onSave}>Save</Button>
        <Button
          variant="primary"
          onClick={onRun}
          disabled={runStatus === 'running'}
        >
          {runStatus === 'running' ? '⏳ Running…' : '▶ Run'}
        </Button>
      </div>
    </header>
  );
}
