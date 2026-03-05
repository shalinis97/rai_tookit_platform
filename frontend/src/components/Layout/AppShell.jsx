import React, { useState } from 'react';
import AgentsPage from '../../pages/AgentsPage';
import PolicyPage from '../../pages/PolicyPage';

const TABS = [
  { id: 'agents', label: 'Agents' },
  { id: 'policy', label: 'Policy' },
];

export default function AppShell({ onEditWorkflow, onNewWorkflow, onUseWorkflow }) {
  const [activeTab, setActiveTab] = useState('agents');

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: 'var(--bg)', overflow: 'hidden',
    }}>
      {/* ── TOP NAV — only Agents / Policy tabs ───────────────── */}
      <header style={{
        height: 52, minHeight: 52, flexShrink: 0,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 28px', zIndex: 100, position: 'relative',
      }}>
        <nav style={{
          display: 'flex', gap: 2,
          background: 'var(--surface2)', padding: '3px',
          borderRadius: 8, border: '1px solid var(--border)',
        }}>
          {TABS.map(tab => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '5px 24px', borderRadius: 6,
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif', fontWeight: 600,
                  fontSize: 13, transition: 'all 0.15s',
                  background: isActive ? 'var(--bg)' : 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--text3)',
                  boxShadow: isActive ? '0 1px 6px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ── PAGE CONTENT ──────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'agents' && (
          <AgentsPage
            onEditWorkflow={onEditWorkflow}
            onNewWorkflow={onNewWorkflow}
            onUseWorkflow={onUseWorkflow}
          />
        )}
        {activeTab === 'policy' && <PolicyPage />}
      </main>
    </div>
  );
}
