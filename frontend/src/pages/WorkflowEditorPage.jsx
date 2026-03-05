import React, { useState, useCallback, useEffect } from 'react';
import Canvas from '../components/Canvas/Canvas';
import ConfigPanel from '../components/ConfigPanel/ConfigPanel';
import StatusBar from '../components/UI/StatusBar';
import Toast from '../components/UI/Toast';
import SaveModal from '../components/Modals/SaveModal';
import NodePalette from '../components/Sidebar/NodePalette';
import { useToasts } from '../hooks/useToasts';
import { useWorkflow } from '../hooks/useWorkflow';
import { NODE_TYPES } from '../constants/nodeTypes';
import {
  workflowsApi, denormalizeNode, denormalizeEdge,
  normalizeNode, normalizeEdge,
} from '../api/workflows';
import { executionsApi } from '../api/executions';
import useWorkflowStore from '../store/workflowStore';

export default function WorkflowEditorPage({ workflowId, onBack }) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving]               = useState(false);

  const { toasts, add: toast, remove: removeToast } = useToasts();
  const { activeWorkflow, activeWfId, setActiveWorkflow, runStatus, setRunStatus } = useWorkflow();

  // ── Ensure the correct workflow is active ─────────────────
  useEffect(() => {
    if (workflowId && workflowId !== activeWfId) {
      setActiveWorkflow(workflowId);
    }
  }, [workflowId, activeWfId, setActiveWorkflow]);

  // ── Load full nodes+edges if not already in store ─────────
  useEffect(() => {
    if (!workflowId) return;
    const wf = useWorkflowStore.getState().workflows.find(w => w.id === workflowId);
    // If nodes is undefined or we have no data, fetch from backend
    if (!wf || !Array.isArray(wf.nodes)) {
      workflowsApi.get(workflowId)
        .then(full => {
          useWorkflowStore.getState().mergeWorkflow({
            ...full,
            nodes: (full.nodes || []).map(normalizeNode),
            edges: (full.edges || []).map(normalizeEdge),
          });
        })
        .catch(e => console.error('Failed to load workflow:', e));
    }
  }, [workflowId]);

  // ── Core save logic ───────────────────────────────────────
  const doSave = useCallback(async (meta) => {
    const wf = useWorkflowStore.getState().getActiveWorkflow();
    if (!wf) { toast('No active workflow', 'error'); return; }

    try {
      setSaving(true);

      // 1. Patch metadata (name, description, status)
      await workflowsApi.update(wf.id, {
        name:        meta.name        ?? wf.name,
        description: meta.description ?? wf.description ?? '',
        status:      'active',
      });

      // 2. Batch-replace all nodes + edges on the backend
      const nodes = (wf.nodes || []).map(denormalizeNode);
      const edges = (wf.edges || []).map(denormalizeEdge);
      await workflowsApi.batchSave(wf.id, { nodes, edges });

      // 3. Re-fetch the saved version so IDs are canonical UUIDs
      const saved = await workflowsApi.get(wf.id);
      useWorkflowStore.getState().mergeWorkflow({
        ...saved,
        nodes: (saved.nodes || []).map(normalizeNode),
        edges: (saved.edges || []).map(normalizeEdge),
      });

      toast('Workflow saved ✓', 'success');
      return true;
    } catch (e) {
      toast(`Save failed: ${e.message}`, 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // ── Quick Save (no modal) ─────────────────────────────────
  const handleQuickSave = useCallback(async () => {
    const wf = useWorkflowStore.getState().getActiveWorkflow();
    await doSave({ name: wf?.name, description: wf?.description });
  }, [doSave]);

  // ── Save As (modal) ───────────────────────────────────────
  const handleSaveAs = useCallback(async (meta) => {
    const ok = await doSave(meta);
    if (ok) setShowSaveModal(false);
  }, [doSave]);

  // ── Run workflow ──────────────────────────────────────────
  const handleRun = useCallback(async () => {
    const wf = useWorkflowStore.getState().getActiveWorkflow();
    if (!wf?.nodes?.length) { toast('Add some nodes first', 'error'); return; }
    try {
      setRunStatus('running');
      const execution = await executionsApi.trigger({
        workflow_id: wf.id, triggered_by: 'manual', input_data: {},
      });
      toast('Workflow running…', 'info');
      const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/^http/, 'ws');
      const ws = new WebSocket(`${base}/ws/executions/${execution.id}`);
      ws.onmessage = ev => {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'execution_update') {
          if (msg.status === 'completed') { setRunStatus('done');  toast('Run completed ✓', 'success'); ws.close(); }
          if (msg.status === 'failed')    { setRunStatus('error'); toast(`Failed: ${msg.error}`, 'error'); ws.close(); }
        }
      };
      ws.onerror = () => { setRunStatus('error'); toast('WebSocket failed', 'error'); };
    } catch (e) {
      setRunStatus('error');
      toast(`Run failed: ${e.message}`, 'error');
    }
  }, [toast, setRunStatus]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── EDITOR TOP BAR ────────────────────────────────── */}
      <header style={{
        height: 52, minHeight: 52, flexShrink: 0,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, zIndex: 100,
      }}>
        {/* Back */}
        <button onClick={onBack} style={btnStyle('ghost')}>← Back</button>

        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)',
            animation: 'logoPulse 2s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 15, color: 'var(--text)', letterSpacing: '-0.5px',
          }}>FlowMind</span>
        </div>

        {/* Workflow name chip */}
        {activeWorkflow && (
          <div style={{
            padding: '4px 10px', borderRadius: 6,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 12,
            color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 7,
            maxWidth: 260, overflow: 'hidden',
          }}>
            <span>⚡</span>
            <span style={{
              color: 'var(--text)', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{activeWorkflow.name}</span>
            <span style={{
              fontSize: 9, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase',
              color: activeWorkflow.status === 'active' ? 'var(--accent)' : 'var(--text3)',
              flexShrink: 0,
            }}>{activeWorkflow.status}</span>
          </div>
        )}

        {/* Right actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={handleQuickSave}
            disabled={saving}
            style={btnStyle('ghost', saving)}
          >
            {saving ? '…saving' : '💾 Save'}
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            style={btnStyle('ghost')}
          >
            Save As…
          </button>
          {/* <button
            onClick={handleRun}
            disabled={runStatus === 'running'}
            style={btnStyle('primary', runStatus === 'running')}
          >
            {runStatus === 'running' ? '⏳ Running…' : '▶ Run'}
          </button> */}
        </div>
      </header>

      {/* ── MAIN AREA ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Node palette sidebar */}
        <aside style={{
          width: 210, minWidth: 210, flexShrink: 0,
          background: 'var(--surface)', borderRight: '1px solid var(--border)',
          padding: 14, overflowY: 'auto',
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '1.5px',
            color: 'var(--text3)', textTransform: 'uppercase',
            marginBottom: 10, fontFamily: 'Space Mono, monospace',
          }}>
            Node Types
          </div>
          <NodePalette />
        </aside>

        {/* Canvas */}
        <Canvas onToast={toast} />

        {/* Config panel */}
        <ConfigPanel />
      </div>

      <StatusBar />

      {showSaveModal && (
        <SaveModal
          workflow={activeWorkflow}
          onSave={handleSaveAs}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

/* ─── Button style helper ───────────────────────────────── */
function btnStyle(variant, disabled = false) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 6,
    fontFamily: 'Syne, sans-serif', fontWeight: 600,
    fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.55 : 1, border: 'none',
  };
  if (variant === 'primary') return {
    ...base,
    background: 'var(--accent)', color: '#000',
  };
  return {
    ...base,
    background: 'transparent',
    color: 'var(--text2)',
    border: '1px solid var(--border)',
  };
}
