import React from 'react';
import NodeHeader from './NodeHeader';
import NodePreview from './NodePreview';
import NodePorts from './NodePorts';
import { useNodeDrag } from '../../hooks/useNodeDrag';
import { NODE_TYPES } from '../../constants/nodeTypes';

const BORDER_COLORS = {
  trigger: '#ef4444',
  agent: '#7c3aed',
  function: '#0ea5e9',
  output: '#f59e0b',
};

/**
 * @param {{ node: object, selected: bool, onPortClick: fn }} props
 */
export default function WorkflowNode({ node, selected, onPortClick }) {
  const handleMouseDown = useNodeDrag(node.id, { x: node.x, y: node.y });
  const borderColor = BORDER_COLORS[node.type] || 'var(--border)';

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        minWidth: 220,
        borderRadius: 12,
        background: 'var(--surface2)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        borderTop: `3px solid ${borderColor}`,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: selected
          ? '0 0 0 2px rgba(0,255,136,0.2), 0 4px 20px rgba(0,0,0,0.4)'
          : '0 4px 20px rgba(0,0,0,0.4)',
        zIndex: selected ? 10 : 1,
      }}
    >
      <NodeHeader type={node.type} title={node.title} />
      <NodePreview type={node.type} config={node.config} />
      <NodePorts type={node.type} nodeId={node.id} onPortClick={onPortClick} />
    </div>
  );
}
