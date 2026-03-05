import React, { useRef, useState, useCallback } from 'react';
import WorkflowNode from '../Nodes/WorkflowNode';
import EdgeLayer from './EdgeLayer';
import CanvasToolbar from './CanvasToolbar';
import RunPanel from './RunPanel';
import { useWorkflow } from '../../hooks/useWorkflow';

export default function Canvas({ onToast }) {
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const {
    activeWorkflow,
    selectedNodeId,
    connectingFrom,
    setSelectedNode,
    setConnectingFrom,
    clearConnecting,
    addNode,
    addEdge,
  } = useWorkflow();

  /* ── Drop node from palette ─────────────────────────────── */
  const handleDrop = useCallback(
    (e) => {
      const type = e.dataTransfer.getData('nodeType');
      if (!type) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 110;
      const y = e.clientY - rect.top - 50;
      addNode(type, x, y);
      onToast?.(`${type.charAt(0).toUpperCase() + type.slice(1)} node added`, 'info');
    },
    [addNode, onToast]
  );

  /* ── Mouse move — update in-progress connection line ─────── */
  const handleMouseMove = useCallback(
    (e) => {
      if (!connectingFrom) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [connectingFrom]
  );

  /* ── Click canvas background — deselect / cancel connect ── */
  const handleCanvasClick = useCallback(
    (e) => {
      if (
        e.target === canvasRef.current ||
        e.target.classList.contains('canvas-nodes-layer')
      ) {
        setSelectedNode(null);
        clearConnecting();
      }
    },
    [setSelectedNode, clearConnecting]
  );

  /* ── Port clicked ────────────────────────────────────────── */
  const handlePortClick = useCallback(
    (nodeId, portType) => {
      if (!connectingFrom) {
        // Start connecting from output port only
        if (portType === 'out' || portType === 'else') {
          setConnectingFrom({ nodeId, portType });
        }
        return;
      }

      // Finish connection on input port of a different node
      if (connectingFrom.nodeId !== nodeId && portType === 'in') {
        const created = addEdge(connectingFrom.nodeId, nodeId);
        if (created) {
          onToast?.('Connection created', 'success');
        } else {
          onToast?.('Connection already exists', 'error');
        }
      }
      clearConnecting();
    },
    [connectingFrom, addEdge, setConnectingFrom, clearConnecting, onToast]
  );

  return (
    <div
      ref={canvasRef}
      className="canvas-grid"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onMouseMove={handleMouseMove}
      onClick={handleCanvasClick}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        cursor: connectingFrom ? 'crosshair' : 'default',
      }}
    >
      <CanvasToolbar />

      {/* Empty state */}
      {activeWorkflow?.nodes.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 48, opacity: 0.1 }}>⬡</div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text3)',
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            drag nodes from the sidebar to get started
          </div>
        </div>
      )}

      {/* SVG edge layer */}
      <EdgeLayer mousePos={connectingFrom ? mousePos : null} />

      {/* Nodes */}
      <div className="canvas-nodes-layer" style={{ position: 'absolute', inset: 0 }}>
        {activeWorkflow?.nodes.map((node) => (
          <WorkflowNode
            key={node.id}
            node={node}
            selected={node.id === selectedNodeId}
            onPortClick={handlePortClick}
          />
        ))}
      </div>

      <RunPanel />
    </div>
  );
}
