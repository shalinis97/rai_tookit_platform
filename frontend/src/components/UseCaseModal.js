import React, { useState } from 'react';
import Modal from './Modal';

const emptySection = () => ({ id: null, title: '', content: '' });

function UseCaseModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [sections, setSections] = useState(
    initial?.sections?.length ? initial.sections.map((s) => ({ ...s })) : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addSection = () => setSections((prev) => [...prev, emptySection()]);

  const removeSection = (idx) =>
    setSections((prev) => prev.filter((_, i) => i !== idx));

  const updateSection = (idx, field, value) =>
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), description: description.trim(), sections });
      onClose();
    } catch (e) {
      setError(e.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={initial ? 'Edit Use Case' : 'New Use Case'}
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
          placeholder="Use case name"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the use case…"
        />
      </div>

      <div className="form-group">
        <div className="sections-label">Sections</div>

        {sections.length > 0 && (
          <div className="sections-list">
            {sections.map((sec, idx) => (
              <div className="section-item" key={idx}>
                <div className="section-item-header">
                  <span className="section-num">Section {idx + 1}</span>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removeSection(idx)}
                  >
                    Remove
                  </button>
                </div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <input
                    className="form-input"
                    value={sec.title}
                    onChange={(e) => updateSection(idx, 'title', e.target.value)}
                    placeholder="Section title"
                  />
                </div>
                <textarea
                  className="form-textarea"
                  value={sec.content}
                  onChange={(e) => updateSection(idx, 'content', e.target.value)}
                  placeholder="Section content…"
                  style={{ minHeight: 70 }}
                />
              </div>
            ))}
          </div>
        )}

        <button className="add-section-btn" onClick={addSection}>
          + Add Section
        </button>
      </div>
    </Modal>
  );
}

export default UseCaseModal;
