import React, { useState } from 'react';
import Button from '../UI/Button';
import { Field, Input, Textarea } from '../UI/Field';

/**
 * @param {{ workflow: object, onSave: (meta) => void, onClose: () => void }} props
 */
export default function SaveModal({ workflow, onSave, onClose }) {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim() });
  };

  return (
    <div
      className="animate-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="animate-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 12,
          width: 480,
          maxWidth: '90vw',
        }}
      >
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: 16,
            fontWeight: 700,
            fontFamily: 'Syne, sans-serif',
          }}
        >
          💾 Save Workflow
        </div>

        <div style={{ padding: 20 }}>
          <Field label="Workflow Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Workflow"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this workflow do?"
              style={{ minHeight: 80 }}
            />
          </Field>
        </div>

        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>
            Save Workflow
          </Button>
        </div>
      </div>
    </div>
  );
}
