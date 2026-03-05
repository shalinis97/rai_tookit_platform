import React, { useState } from 'react';
import Button from '../UI/Button';
import { Field, Input } from '../UI/Field';

/**
 * @param {{ onCreate: (name: string) => void, onClose: () => void }} props
 */
export default function NewWorkflowModal({ onCreate, onClose }) {
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
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
          width: 440,
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
          ✨ New Workflow
        </div>

        <div style={{ padding: 20 }}>
          <Field label="Workflow Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Customer Support Bot"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
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
          <Button variant="primary" onClick={handleCreate} disabled={!name.trim()}>
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
