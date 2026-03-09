import React, { useState, useCallback } from 'react';
import AppShell from './components/Layout/AppShell';
import WorkflowEditorPage from './pages/WorkflowEditorPage';
import ChatPage from './pages/ChatPage';
import { useWorkflowData } from './hooks/useWorkflowData';
import QuarantinePage from './pages/QuarantinePage';
import { workflowsApi as wfApi } from './api/workflows';
import { workflowsApi } from './api/workflows';
import useWorkflowStore from './store/workflowStore';

/**
 * Views:
 *   'shell'   — Agents / Policy home
 *   'editor'  — Canvas workflow editor
 *   'chat'    — Chat interface for using a workflow
 */
export default function App() {
  const [view, setView]               = useState('shell');
  const [editingId, setEditingId]     = useState(null);
  const [chatWorkflow, setChatWorkflow] = useState(null);

  const { loading, error, refetch } = useWorkflowData();

  // ── Open editor ───────────────────────────────────────────
  const openEditor = useCallback((workflow) => {
    useWorkflowStore.getState().setActiveWorkflow(workflow.id);
    setEditingId(workflow.id);
    setView('editor');
  }, []);

  // ── Create new workflow ───────────────────────────────────
  const openNewWorkflow = useCallback(async () => {
    try {
      const created = await workflowsApi.create({ name: 'New Workflow', status: 'draft' });
      useWorkflowStore.getState().setWorkflows([
        ...useWorkflowStore.getState().workflows,
        { ...created, nodes: [], edges: [] },
      ]);
      useWorkflowStore.getState().setActiveWorkflow(created.id);
      setEditingId(created.id);
      setView('editor');
    } catch (e) {
      console.error('Failed to create workflow:', e);
    }
  }, []);

  // ── Open chat for a workflow ──────────────────────────────
  const openChat = useCallback((workflow) => {
    setChatWorkflow(workflow);
    setView('chat');
  }, []);

  // ── Back from editor → refetch full list ─────────────────
  const goBackFromEditor = useCallback(async () => {
    setView('shell');
    setEditingId(null);
    await refetch();
  }, [refetch]);

  // ── Back from chat → shell (session reset by unmounting) ──
  const goBackFromChat = useCallback(async () => {
    setChatWorkflow(null);
    setView('shell');
    await refetch();   // refresh workflow list so quarantine status shows
  }, [refetch]);

  // ── Edit quarantined workflow ──────────────────────────────
  const openEditFromQuarantine = useCallback(async (wf) => {
    try {
      const full = await wfApi.get(wf.id);
      const store = useWorkflowStore.getState();
      const already = store.workflows.find(w => w.id === wf.id);
      if (!already) {
        store.setWorkflows([...store.workflows, full]);
      }
      store.setActiveWorkflow(wf.id);
      setEditingId(wf.id);
      setView('editor');
    } catch (e) { console.error(e); }
  }, []);

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)',
        color: 'var(--text3)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, gap: 10,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--accent)', animation: 'logoPulse 1s ease-in-out infinite',
        }} />
        Connecting to FlowMind…
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', background: 'var(--bg)',
        color: 'var(--trigger-light)', fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 12, gap: 8,
      }}>
        <div style={{ fontSize: 32 }}>⚠</div>
        <div>Cannot connect to backend</div>
        <div style={{ color: 'var(--text3)', fontSize: 10 }}>
          {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'} — {error}
        </div>
        <button onClick={refetch} style={{
          marginTop: 8, padding: '7px 16px', borderRadius: 6,
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text2)', fontFamily: 'Syne, sans-serif',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Retry</button>
      </div>
    );
  }

  if (view === 'editor') {
    return <WorkflowEditorPage workflowId={editingId} onBack={goBackFromEditor} />;
  }

  if (view === 'chat') {
    return <ChatPage workflow={chatWorkflow} onBack={goBackFromChat} />;
  }

  return (
    <AppShell
      onEditWorkflow={openEditor}
      onNewWorkflow={openNewWorkflow}
      onUseWorkflow={openChat}
      onEditFromQuarantine={openEditFromQuarantine}
    />
  );
}
