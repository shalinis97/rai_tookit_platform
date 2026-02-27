import React, { useEffect, useState } from 'react';
import { getPolicies, createPolicy, updatePolicy, deletePolicy } from '../api';
import PolicyModal from './PolicyModal';

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

function PoliciesTab() {
  const [policies,  setPolicies]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setPolicies(await getPolicies());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (p)  => { setEditing(p);  setModalOpen(true); };

  const handleSave = async (data) => {
    editing ? await updatePolicy(editing.id, data) : await createPolicy(data);
    await load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this policy?')) return;
    await deletePolicy(id);
    await load();
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-heading">
          <h2 className="section-title">Policies</h2>
          <span className="section-subtitle">Governance rules and compliance policies for your agents</span>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Policy
        </button>
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : policies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap">📜</div>
          <h3>No policies yet</h3>
          <p>Define governance policies to control how agents operate.</p>
          <button className="btn btn-primary" onClick={openCreate}>
            + New Policy
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {policies.map((p) => (
            <div className="card" key={p.id}>
              <div className="card-stripe green" />
              <div className="card-body">
                <div className="card-top-row">
                  <div className="card-icon green">📜</div>
                  <div>
                    <div className="card-title">{p.name}</div>
                  </div>
                </div>

                {p.description && (
                  <div className="card-desc">{p.description}</div>
                )}

                <div className="card-meta">
                  <span>🗓</span>
                  Created {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>

                <div className="card-divider" />

                <div className="card-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <PolicyModal
          initial={editing}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

export default PoliciesTab;
