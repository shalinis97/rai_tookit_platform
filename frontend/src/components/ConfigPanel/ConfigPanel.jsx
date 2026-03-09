import React, { useState } from 'react';
import Tabs from '../UI/Tabs';
import Button from '../UI/Button';
import { Field, Input } from '../UI/Field';
import AgentConfig from './AgentConfig';
import FunctionConfig from './FunctionConfig';
import TriggerConfig from './TriggerConfig';
import OutputConfig from './OutputConfig';
import ConditionConfig from './ConditionConfig';
import AdvancedConfig from './AdvancedConfig';
import { NODE_TYPES } from '../../constants/nodeTypes';
import { useWorkflow } from '../../hooks/useWorkflow';
import useWorkflowStore from '../../store/workflowStore';

const CONFIG_COMPONENTS = {
  agent: AgentConfig,
  function: FunctionConfig,
  trigger: TriggerConfig,
  output: OutputConfig,
  condition: ConditionConfig,
};

export default function ConfigPanel() {
  const { selectedNode, updateNode, deleteNode } = useWorkflow();
  const [tab, setTab] = useState('config');

  if (!selectedNode) return null;

  const typeInfo = NODE_TYPES[selectedNode.type];

  const handleTitleChange = (value) => {
    updateNode({ ...selectedNode, title: value });
  };

  const handleConfigChange = (key, value) => {
    updateNode({
      ...selectedNode,
      config: { ...(selectedNode.config || {}), [key]: value },
    });
  };

  const ConfigComponent = CONFIG_COMPONENTS[selectedNode.type];

  return (
    <aside
      style={{
        width: 320,
        minWidth: 320,
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'Syne, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{typeInfo?.icon}</span>
            <span>{selectedNode.title}</span>
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--text3)',
              fontFamily: 'Space Mono, monospace',
              marginTop: 2,
            }}
          >
            {selectedNode.id}
          </div>
        </div>
        <button
          onClick={() => useWorkflowStore.getState().setSelectedNode(null)}
          style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            cursor: 'pointer',
            color: 'var(--text3)',
            fontSize: 16,
            border: 'none',
            background: 'transparent',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface2)';
            e.currentTarget.style.color = 'var(--text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text3)';
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <Tabs
          tabs={['config', 'advanced']}
          active={tab}
          onChange={setTab}
        />

        {tab === 'config' && (
          <>
            <Field label="Node Name">
              <Input
                value={selectedNode.title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </Field>

            {ConfigComponent && (
              <ConfigComponent
                config={selectedNode.config || {}}
                onChange={handleConfigChange}
                node={selectedNode}
              />
            )}
          </>
        )}

        {tab === 'advanced' && (
          <AdvancedConfig
            node={selectedNode}
            config={selectedNode.config || {}}
            onChange={handleConfigChange}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
        <Button
          variant="danger"
          onClick={() => deleteNode(selectedNode.id)}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          🗑 Delete Node
        </Button>
      </div>
    </aside>
  );
}
