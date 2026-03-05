import { useCallback } from 'react';
import useWorkflowStore from '../store/workflowStore';

/**
 * Returns a mousedown handler that initiates drag for a given node.
 * Attaches mousemove/mouseup to document for smooth dragging outside node bounds.
 *
 * @param {string} nodeId
 * @param {{ x: number, y: number }} nodePos  - current node position
 * @returns {(e: MouseEvent) => void}
 */
export function useNodeDrag(nodeId, nodePos) {
  const dragNode = useWorkflowStore((s) => s.dragNode);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);

  const handleMouseDown = useCallback(
    (e) => {
      // Don't start drag if clicking a port
      if (e.target.dataset.port) return;
      e.stopPropagation();

      setSelectedNode(nodeId);

      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      const startNodeX = nodePos.x;
      const startNodeY = nodePos.y;

      const onMove = (me) => {
        const dx = me.clientX - startMouseX;
        const dy = me.clientY - startMouseY;
        dragNode(nodeId, startNodeX + dx, startNodeY + dy);
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [nodeId, nodePos, dragNode, setSelectedNode]
  );

  return handleMouseDown;
}
