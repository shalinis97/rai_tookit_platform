import React from 'react';
import { Field, Input, Textarea, Select } from '../UI/Field';

/**
 * @param {{ config: object, onChange: (key, value) => void }} props
 */
export default function FunctionConfig({ config = {}, onChange }) {
  return (
    <>
      <Field label="Runtime">
        <Select
          value={config.runtime || 'javascript'}
          onChange={(e) => onChange('runtime', e.target.value)}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
        </Select>
      </Field>

      <Field label="Function Code">
        <Textarea
          className="code-editor"
          value={config.code || ''}
          onChange={(e) => onChange('code', e.target.value)}
          placeholder={`async (input) => {\n  // Your code here\n  return { result: input };\n}`}
          style={{ minHeight: 160 }}
        />
      </Field>

      <Field label="Timeout (ms)">
        <Input
          type="number"
          value={config.timeout || 5000}
          onChange={(e) => onChange('timeout', parseInt(e.target.value))}
        />
      </Field>

      <div
        style={{
          padding: 10,
          borderRadius: 6,
          background: 'var(--surface2)',
          fontSize: 11,
          color: 'var(--text3)',
          fontFamily: 'IBM Plex Mono, monospace',
          lineHeight: 1.6,
        }}
      >
        Use <span style={{ color: 'var(--fn-light)' }}>async (input) =&gt; {'{'} ... {'}'}</span> format.
        Return a plain object or primitive. <span style={{ color: 'var(--fn-light)' }}>input</span> contains the previous node's output.
      </div>
    </>
  );
}
