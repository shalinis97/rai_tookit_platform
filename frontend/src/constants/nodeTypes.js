export const NODE_TYPES = {
  trigger: {
    label: 'Trigger',
    icon: '⚡',
    color: '#ef4444',
    colorAlpha: 'rgba(239,68,68,0.2)',
    badge: 'badge-trigger',
    badgeStyle: { background: 'rgba(239,68,68,0.25)', color: '#f87171' },
    description: 'Start workflow',
  },
  agent: {
    label: 'Agent',
    icon: '🤖',
    color: '#7c3aed',
    colorAlpha: 'rgba(124,58,237,0.2)',
    badge: 'badge-agent',
    badgeStyle: { background: 'rgba(124,58,237,0.25)', color: '#a855f7' },
    description: 'AI-powered node',
  },
  function: {
    label: 'Function',
    icon: '⚙️',
    color: '#0ea5e9',
    colorAlpha: 'rgba(14,165,233,0.2)',
    badge: 'badge-function',
    badgeStyle: { background: 'rgba(14,165,233,0.25)', color: '#38bdf8' },
    description: 'Custom code block',
  },
  condition: {
    label: 'Condition',
    icon: '◈',
    color: '#10b981',
    colorAlpha: 'rgba(16,185,129,0.2)',
    badge: 'badge-condition',
    badgeStyle: { background: 'rgba(16,185,129,0.25)', color: '#34d399' },
    description: 'If / else branching',
  },
  output: {
    label: 'Output',
    icon: '📤',
    color: '#f59e0b',
    colorAlpha: 'rgba(245,158,11,0.2)',
    badge: 'badge-output',
    badgeStyle: { background: 'rgba(245,158,11,0.25)', color: '#fbbf24' },
    description: 'Send results',
  },
};

export const NODE_TYPE_KEYS = Object.keys(NODE_TYPES);
