import React, { useState } from 'react';
import AgentsPage from '../../pages/AgentsPage';
import PolicyPage from '../../pages/PolicyPage';
import QuarantinePage from '../../pages/QuarantinePage';

const TABS = [
  { id: 'agents',     label: 'Agents' },
  { id: 'policy',     label: 'Policy' },
  { id: 'quarantine', label: '🔒 Quarantine' },
];

export default function AppShell({ onEditWorkflow, onNewWorkflow, onUseWorkflow, onEditFromQuarantine }) {
  const [activeTab, setActiveTab] = useState('agents');

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: 'var(--bg)', overflow: 'hidden',
    }}>
      {/* TOP NAV */}
      <header style={{
        height: 72, minHeight: 72, flexShrink: 0,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 28px', zIndex: 100, position: 'relative',
      }}>
        <nav style={{
          display: 'flex', gap: 2,
          background: 'var(--surface2)', padding: '5px',
          borderRadius: 10, border: '1px solid var(--border)',
        }}>
          {TABS.map(tab => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 32px', borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif', fontWeight: 600,
                  fontSize: 13, transition: 'all 0.15s',
                  background: isActive ? 'var(--bg)' : 'transparent',
                  color: tab.id === 'quarantine'
                    ? (isActive ? '#f87171' : 'rgba(248,113,113,0.5)')
                    : (isActive ? 'var(--text)' : 'var(--text3)'),
                  boxShadow: isActive ? '0 1px 6px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* PAGE CONTENT */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'agents' && (
          <AgentsPage
            onEditWorkflow={onEditWorkflow}
            onNewWorkflow={onNewWorkflow}
            onUseWorkflow={onUseWorkflow}
          />
        )}
        {activeTab === 'policy' && <PolicyPage />}
        {activeTab === 'quarantine' && (
          <QuarantinePage onEditWorkflow={onEditFromQuarantine} />
        )}
      </main>
    </div>
  );
}
