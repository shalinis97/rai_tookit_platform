import React from 'react';
import { getBezierPath } from '../../utils/bezier';
import { useWorkflow } from '../../hooks/useWorkflow';

/**
 * @param {{ mousePos: {x,y} }} props
 */
export default function EdgeLayer({ mousePos }) {
  const { activeWorkflow, connectingFrom, getPortPosition, runStatus, deleteEdge } = useWorkflow();

  if (!activeWorkflow) return null;

  const isRunning = runStatus === 'running';

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <defs>
        <marker id="arrow-default" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--border2)" />
        </marker>
        <marker id="arrow-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--accent)" />
        </marker>
      </defs>

      {/* Existing edges */}
      {activeWorkflow.edges.map((edge) => {
        const handle = edge.source_handle || 'out';
        const from = getPortPosition(edge.from, handle);
        const to = getPortPosition(edge.to, 'in');
        const d = getBezierPath(from.x, from.y, to.x, to.y);
        const isTrueBranch  = handle === 'true';
        const isFalseBranch = handle === 'false';
        const edgeColor = isTrueBranch ? '#34d399' : isFalseBranch ? '#f87171' : (isRunning ? 'var(--accent)' : 'var(--border2)');
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;

        return (
          <g key={edge.id}>
            <path
              d={d}
              fill="none"
              strokeWidth={1.5}
              stroke={edgeColor}
              strokeDasharray={isRunning ? '6' : undefined}
              className={isRunning ? 'animate-edge-dash' : undefined}
              markerEnd={`url(#${isRunning ? 'arrow-active' : 'arrow-default'})`}
            />
            {(isTrueBranch || isFalseBranch) && (
              <g>
                <rect x={midX - 16} y={midY - 8} width={32} height={16} rx={4} fill="var(--surface)" stroke={edgeColor} strokeWidth={1} />
                <text x={midX} y={midY + 4} textAnchor="middle" fontSize={9} fill={edgeColor} fontFamily="Space Mono, monospace" fontWeight={700}>
                  {handle.toUpperCase()}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* In-progress connection line */}
      {connectingFrom && mousePos && (() => {
        const from = getPortPosition(connectingFrom.nodeId, 'out');
        return (
          <path
            d={getBezierPath(from.x, from.y, mousePos.x, mousePos.y)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="5"
            opacity={0.7}
          />
        );
      })()}
    </svg>
  );
}
