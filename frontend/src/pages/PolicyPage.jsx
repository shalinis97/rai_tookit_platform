import React, { useState } from 'react';

const DUMMY_POLICIES = [
  {
    id: 'p1', name: 'Data Retention Policy', status: 'active',
    description: 'Defines how long workflow execution logs and output data are retained before automatic deletion.',
    rules: ['Execution logs retained for 90 days', 'Output data purged after 30 days', 'Node logs archived after 60 days'],
    updatedAt: '2024-01-15',
  },
  {
    id: 'p2', name: 'Agent Safety Policy', status: 'active',
    description: 'Governs acceptable use of AI agents within workflows, including rate limits and content filtering.',
    rules: ['Max 100 agent calls per workflow run', 'Content filtering enabled by default', 'PII detection required for output nodes'],
    updatedAt: '2024-01-18',
  },
  {
    id: 'p3', name: 'Execution Rate Limits', status: 'draft',
    description: 'Controls how frequently workflows can be triggered to prevent abuse and manage infrastructure costs.',
    rules: ['Max 10 concurrent executions per workspace', 'Webhook triggers limited to 1000/day', 'CRON workflows run at 5-minute minimum intervals'],
    updatedAt: '2024-01-20',
  },
  {
    id: 'p4', name: 'Access Control Policy', status: 'draft',
    description: 'Defines who can create, edit, and run workflows within the platform.',
    rules: ['Admins can manage all workflows', 'Editors can create and edit their own workflows', 'Viewers can run but not modify workflows'],
    updatedAt: '2024-01-22',
  },
];

const STATUS_STYLE = {
  active: { bg: 'rgba(0,255,136,0.1)', color: 'var(--accent)', dot: 'var(--accent)' },
  draft:  { bg: 'rgba(139,148,158,0.1)', color: 'var(--text3)', dot: 'var(--text3)' },
};

function PolicyCard({ policy }) {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS_STYLE[policy.status] || STATUS_STYLE.draft;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div
        style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}
        onClick={() => setExpanded(x => !x)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
              {policy.name}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 20,
              background: s.bg, fontSize: 9,
              fontFamily: 'Space Mono, monospace', color: s.color,
              textTransform: 'uppercase', fontWeight: 700,
            }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
              {policy.status}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.5, margin: 0 }}>
            {policy.description}
          </p>
        </div>
        <span style={{ color: 'var(--text3)', fontSize: 12, flexShrink: 0, marginTop: 2, transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px', background: 'var(--surface2)' }}>
          <div style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Rules</div>
          {policy.rules.map((rule, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>→</span>
              <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.5 }}>{rule}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'IBM Plex Mono, monospace' }}>
              Last updated: {policy.updatedAt}
            </span>
            <button style={{
              padding: '5px 12px', borderRadius: 5,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text3)', fontFamily: 'Syne, sans-serif',
              fontSize: 11, fontWeight: 600, cursor: 'not-allowed', opacity: 0.5,
            }}>
              Edit Policy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PolicyPage() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', padding: 32 }}>
      <div style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: 28, color: 'var(--text)', letterSpacing: '-1px', margin: 0,
            }}>
              Policies
            </h2>
            <span style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 9,
              fontFamily: 'Space Mono, monospace', background: 'rgba(245,158,11,0.15)',
              color: 'var(--output-light)', fontWeight: 700, textTransform: 'uppercase',
            }}>
              Coming Soon
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'IBM Plex Mono, monospace', margin: 0 }}>
            Governance rules that control how agents behave across all workflows.
          </p>
        </div>

        {/* Info banner */}
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 24,
          background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>ℹ</span>
          <span style={{ fontSize: 12, color: 'var(--fn-light)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.5 }}>
            Policy management is under development. The policies shown below are examples of what will be configurable.
          </span>
        </div>

        {/* Policy cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DUMMY_POLICIES.map(policy => (
            <PolicyCard key={policy.id} policy={policy} />
          ))}
        </div>
      </div>
    </div>
  );
}
