import { create } from 'zustand';
import { genId } from '../utils/idGen';

const useWorkflowStore = create((set, get) => ({
  // ─── STATE ────────────────────────────────────────────────
  workflows: [],           // loaded from backend on mount
  activeWfId: null,
  selectedNodeId: null,
  connectingFrom: null,    // { nodeId, portType } | null
  runStatus: 'idle',       // 'idle' | 'running' | 'done' | 'error'
  zoom: 1,

  // ─── SELECTORS ────────────────────────────────────────────
  getActiveWorkflow: () => {
    const { workflows, activeWfId } = get();
    return workflows.find((w) => w.id === activeWfId) || null;
  },

  getSelectedNode: () => {
    const { selectedNodeId } = get();
    const wf = get().getActiveWorkflow();
    return wf?.nodes.find((n) => n.id === selectedNodeId) || null;
  },

  // ─── WORKFLOW LIST ACTIONS (API-driven) ───────────────────

  /** Replace the full workflow list (called after initial fetch) */
  setWorkflows: (workflows) => set({ workflows }),

  /** Merge a fully-loaded workflow (with nodes+edges) into the list */
  mergeWorkflow: (full) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === full.id ? { ...w, ...full } : w
      ),
    })),

  // ─── WORKFLOW ACTIONS ──────────────────────────────────────
  setActiveWorkflow: (id) =>
    set({ activeWfId: id, selectedNodeId: null, connectingFrom: null }),

  createWorkflow: (name, description = '') => {
    const id = genId('wf');
    const newWf = {
      id,
      name,
      description,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      nodes: [],
      edges: [],
    };
    set((state) => ({
      workflows: [...state.workflows, newWf],
      activeWfId: id,
      selectedNodeId: null,
    }));
    return id;
  },

  saveWorkflow: (meta) => {
    const { activeWfId } = get();
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === activeWfId ? { ...w, ...meta } : w
      ),
    }));
  },

  deleteWorkflow: (id) => {
    const { workflows, activeWfId } = get();
    const remaining = workflows.filter((w) => w.id !== id);
    set({
      workflows: remaining,
      activeWfId: id === activeWfId ? (remaining[0]?.id || null) : activeWfId,
      selectedNodeId: null,
    });
  },

  // ─── NODE ACTIONS ──────────────────────────────────────────
  addNode: (type, x, y) => {
    const { activeWfId } = get();
    const newNode = {
      id: genId('n'),
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
      x: Math.max(0, x),
      y: Math.max(0, y),
      config: {},
    };
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === activeWfId
          ? { ...w, nodes: [...w.nodes, newNode] }
          : w
      ),
      selectedNodeId: newNode.id,
    }));
    return newNode.id;
  },

  updateNode: (updatedNode) => {
    const { activeWfId } = get();
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === activeWfId
          ? {
              ...w,
              nodes: w.nodes.map((n) =>
                n.id === updatedNode.id ? updatedNode : n
              ),
            }
          : w
      ),
    }));
  },

  deleteNode: (nodeId) => {
    const { activeWfId } = get();
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === activeWfId
          ? {
              ...w,
              nodes: w.nodes.filter((n) => n.id !== nodeId),
              edges: w.edges.filter(
                (e) => e.from !== nodeId && e.to !== nodeId
              ),
            }
          : w
      ),
      selectedNodeId: null,
    }));
  },

  dragNode: (nodeId, x, y) => {
    const { activeWfId } = get();
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === activeWfId
          ? {
              ...w,
              nodes: w.nodes.map((n) =>
                n.id === nodeId
                  ? { ...n, x: Math.max(0, x), y: Math.max(0, y) }
                  : n
              ),
            }
          : w
      ),
    }));
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  // ─── EDGE ACTIONS ──────────────────────────────────────────
  addEdge: (fromNodeId, toNodeId, sourceHandle = 'out') => {
    const { activeWfId } = get();
    const wf = get().getActiveWorkflow();
    const exists = wf?.edges.some(
      (e) => e.from === fromNodeId && e.to === toNodeId && e.source_handle === sourceHandle
    );
    if (exists) return false;

    const newEdge = { id: genId('e'), from: fromNodeId, to: toNodeId, source_handle: sourceHandle };
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === activeWfId
          ? { ...w, edges: [...w.edges, newEdge] }
          : w
      ),
    }));
    return true;
  },

  deleteEdge: (edgeId) => {
    const { activeWfId } = get();
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === activeWfId
          ? { ...w, edges: w.edges.filter((e) => e.id !== edgeId) }
          : w
      ),
    }));
  },

  // ─── CONNECTION STATE ──────────────────────────────────────
  setConnectingFrom: (val) => set({ connectingFrom: val }),
  clearConnecting: () => set({ connectingFrom: null }),

  // ─── RUN STATE ─────────────────────────────────────────────
  setRunStatus: (status) => set({ runStatus: status }),

  // ─── ZOOM ──────────────────────────────────────────────────
  setZoom: (zoom) => set({ zoom: Math.min(2, Math.max(0.3, zoom)) }),
}));

export default useWorkflowStore;
