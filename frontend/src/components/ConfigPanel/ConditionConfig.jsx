import React from 'react';
import { Field, Select, Input } from '../UI/Field';

const OPERATORS = [
  { value: 'contains',     label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'equals',       label: 'equals' },
  { value: 'not_equals',   label: 'not equals' },
  { value: 'gt',           label: '> greater than' },
  { value: 'lt',           label: '< less than' },
  { value: 'gte',          label: '>= greater or equal' },
  { value: 'lte',          label: '<= less or equal' },
  { value: 'starts_with',  label: 'starts with' },
  { value: 'ends_with',    label: 'ends with' },
  { value: 'is_empty',     label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
];

const mono = { fontFamily: 'IBM Plex Mono, monospace' };

export default function ConditionConfig({ config = {}, onChange }) {
  return (
    <>
      <div style={{
        padding: '10px 12px', borderRadius: 7, marginBottom: 12,
        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
        fontSize: 11, color: '#34d399', ...mono, lineHeight: 1.6,
      }}>
        Routes execution to <span style={{ color: '#34d399', fontWeight: 700 }}>true</span> or{' '}
        <span style={{ color: '#f87171', fontWeight: 700 }}>false</span> branch based on condition.
      </div>

      <Field label="Field to check">
        <Input
          value={config.field || 'output'}
          onChange={(e) => onChange('field', e.target.value)}
          placeholder="output, message, result.status…"
        />
      </Field>

      <Field label="Operator">
        <Select
          value={config.operator || 'contains'}
          onChange={(e) => onChange('operator', e.target.value)}
        >
          {OPERATORS.map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </Select>
      </Field>

      {!['is_empty', 'is_not_empty'].includes(config.operator) && (
        <Field label="Value">
          <Input
            value={config.value || ''}
            onChange={(e) => onChange('value', e.target.value)}
            placeholder="Value to compare against…"
          />
        </Field>
      )}

      <Field label="Case sensitive">
        <Select
          value={config.caseSensitive ? 'yes' : 'no'}
          onChange={(e) => onChange('caseSensitive', e.target.value === 'yes')}
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </Select>
      </Field>

      <div style={{ padding: '10px 12px', borderRadius: 7, background: 'var(--surface2)', fontSize: 11, color: 'var(--text3)', ...mono, lineHeight: 1.7 }}>
        <div style={{ marginBottom: 6, color: 'var(--text2)', fontWeight: 600 }}>Examples:</div>
        <div>field: <span style={{ color: '#38bdf8' }}>output</span> → checks the text output</div>
        <div>field: <span style={{ color: '#38bdf8' }}>result.status</span> → nested field access</div>
        <div>field: <span style={{ color: '#38bdf8' }}>message</span> → original user message</div>
      </div>
    </>
  );
}
