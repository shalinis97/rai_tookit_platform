import React from 'react';
import Button from '../UI/Button';
import { useWorkflow } from '../../hooks/useWorkflow';

export default function TopBar({ onNew, onSave, onRun }) {
  const { workflows, activeWfId, setActiveWorkflow, activeWorkflow, runStatus } = useWorkflow();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        height: 72,
        minHeight: 72,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* LOGO */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'Syne, sans-serif', fontWeight: 800,
        fontSize: 20, letterSpacing: '-0.5px', color: 'var(--text)',
      }}>
        <div className="animate-logo-pulse" style={{
          width: 10, height: 20, borderRadius: '50%',
          background: 'var(--accent)', flexShrink: 0,
        }} />
        FlowMind
      </div>

      {/* CENTER — workflow selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 16px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 15,
          color: 'var(--text2)',
        }}>
          <span style={{ fontSize: 15 }}>⚡</span>
          <select
            value={activeWfId}
            onChange={(e) => setActiveWorkflow(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 13, cursor: 'pointer', minWidth: 180,
            }}
          >
            {workflows.map((w) => (
              <option key={w.id} value={w.id} style={{ background: 'var(--surface2)' }}>
                {w.name}
              </option>
            ))}
          </select>
          <span style={{
            fontSize: 10, fontFamily: 'Space Mono, monospace',
            color: activeWorkflow?.status === 'active' ? 'var(--accent)' : 'var(--text3)',
          }}>
            {activeWorkflow?.status?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* RIGHT — actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Button variant="ghost" onClick={onNew} style={{ padding: '10px 20px', fontSize: 14 }}>+ New</Button>
        <Button variant="ghost" icon="💾" onClick={onSave} style={{ padding: '10px 20px', fontSize: 14 }}>Save</Button>
        <Button
          variant="primary"
          onClick={onRun}
          disabled={runStatus === 'running'}
          style={{ padding: '10px 22px', fontSize: 14 }}
        >
          {runStatus === 'running' ? '⏳ Running…' : '▶ Run'}
        </Button>
      </div>
    </header>
  );
}