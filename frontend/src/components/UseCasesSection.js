import React, { useEffect, useState } from 'react';
import { getUseCases, createUseCase, updateUseCase, deleteUseCase } from '../api';
import UseCaseModal from './UseCaseModal';

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

function UseCasesSection() {
  const [useCases, setUseCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setUseCases(await getUseCases());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (uc) => { setEditing(uc); setModalOpen(true); };

  const handleSave = async (data) => {
    editing ? await updateUseCase(editing.id, data) : await createUseCase(data);
    await load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this use case?')) return;
    await deleteUseCase(id);
    await load();
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-heading">
          <h2 className="section-title">Use Cases</h2>
          <span className="section-subtitle">Define the scenarios your agents operate in</span>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Use Case
        </button>
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : useCases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap">📋</div>
          <h3>No use cases yet</h3>
          <p>Create your first use case to define the context your agents work within.</p>
          <button className="btn btn-primary" onClick={openCreate}>
            + New Use Case
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {useCases.map((uc) => (
            <div className="card" key={uc.id}>
              <div className="card-stripe" />
              <div className="card-body">
                <div className="card-top-row">
                  <div className="card-icon">📋</div>
                  <div>
                    <div className="card-title">{uc.name}</div>
                  </div>
                </div>

                {uc.description && (
                  <div className="card-desc">{uc.description}</div>
                )}

                {uc.sections?.length > 0 && (
                  <div className="card-tags">
                    <span className="tag tag-blue">
                      {uc.sections.length} section{uc.sections.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                <div className="card-meta">
                  <span>🗓</span>
                  Created {new Date(uc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>

                <div className="card-divider" />

                <div className="card-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(uc)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(uc.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <UseCaseModal
          initial={editing}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

export default UseCasesSection;
