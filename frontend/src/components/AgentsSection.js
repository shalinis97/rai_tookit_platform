import React, { useEffect, useState } from 'react';
import { getAgents, createAgent, updateAgent, deleteAgent, getUseCases } from '../api';
import AgentModal from './AgentModal';
import CertificateModal from './CertificateModal';

function SkeletonGrid() {
  return (
    <div className="skeleton-grid">
      {[1, 2, 3].map((i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-stripe" />
          <div className="sk-line w-60" />
          <div className="sk-line w-80" />
          <div className="sk-line w-40" style={{ marginTop: 18 }} />
        </div>
      ))}
    </div>
  );
}

function AgentsSection() {
  const [agents,    setAgents]    = useState([]);
  const [useCases,  setUseCases]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [certAgent, setCertAgent] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [agentData, ucData] = await Promise.all([getAgents(), getUseCases()]);
      setAgents(agentData);
      setUseCases(ucData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (a)  => { setEditing(a);  setModalOpen(true); };

  const handleSave = async (data) => {
    editing ? await updateAgent(editing.id, data) : await createAgent(data);
    await load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this agent?')) return;
    await deleteAgent(id);
    await load();
  };

  const ucName = (id) => useCases.find((u) => u.id === id)?.name;

  return (
    <div>
      <div className="section-header">
        <div className="section-heading">
          <h2 className="section-title">Agents</h2>
          <span className="section-subtitle">Manage AI agents registered on the platform</span>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Agent
        </button>
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : agents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap">🤖</div>
          <h3>No agents yet</h3>
          <p>Register your first AI agent and assign it to a use case.</p>
          <button className="btn btn-primary" onClick={openCreate}>
            + New Agent
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {agents.map((agent) => (
            <div className="card" key={agent.id}>
              <div className="card-stripe purple" />
              <div className="card-body">
                <div className="card-top-row">
                  <div className="card-icon purple">🤖</div>
                  <div>
                    <div className="card-title">{agent.name}</div>
                  </div>
                </div>

                {agent.description && (
                  <div className="card-desc">{agent.description}</div>
                )}

                {agent.use_case_id && (
                  <div className="card-tags">
                    <span className="tag tag-purple">
                      {ucName(agent.use_case_id)}
                    </span>
                  </div>
                )}

                <div className="card-meta">
                  <span>🗓</span>
                  Created {new Date(agent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>

                <div className="card-divider" />

                <div className="card-actions">
                  <button
                    className="btn btn-cert btn-sm"
                    onClick={() => setCertAgent(agent)}
                  >
                    🏅 Certificate
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(agent)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(agent.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <AgentModal
          initial={editing}
          useCases={useCases}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      {certAgent && (
        <CertificateModal agent={certAgent} onClose={() => setCertAgent(null)} />
      )}
    </div>
  );
}

export default AgentsSection;
