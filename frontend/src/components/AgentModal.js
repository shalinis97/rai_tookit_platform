import React, { useState } from 'react';
import Modal from './Modal';

function AgentModal({ initial, useCases, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [useCaseId, setUseCaseId] = useState(initial?.use_case_id || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        use_case_id: useCaseId || null,
      });
      onClose();
    } catch (e) {
      setError(e.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={initial ? 'Edit Agent' : 'New Agent'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label className="form-label">Name *</label>
        <input
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Agent name"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the agent…"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Associated Use Case</label>
        <select
          className="form-select"
          value={useCaseId}
          onChange={(e) => setUseCaseId(e.target.value)}
        >
          <option value="">— None —</option>
          {useCases.map((uc) => (
            <option key={uc.id} value={uc.id}>{uc.name}</option>
          ))}
        </select>
      </div>
    </Modal>
  );
}

export default AgentModal;
