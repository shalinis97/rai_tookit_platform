import useWorkflowStore from '../store/workflowStore';

const NODE_WIDTH = 220;
const NODE_HEIGHT_MID = 68; // approximate vertical midpoint of a node

/**
 * Derived selectors and helpers on top of the workflow store.
 */
export function useWorkflow() {
  const store = useWorkflowStore();

  const activeWorkflow = store.getActiveWorkflow();
  const selectedNode = store.getSelectedNode();

  /**
   * Returns the canvas-space {x, y} of a node's port.
   * @param {string} nodeId
   * @param {'in'|'out'} side
   */
  const getPortPosition = (nodeId, side) => {
    const node = activeWorkflow?.nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return {
      x: side === 'out' ? node.x + NODE_WIDTH : node.x,
      y: node.y + NODE_HEIGHT_MID,
    };
  };

  return {
    ...store,
    activeWorkflow,
    selectedNode,
    getPortPosition,
  };
}
