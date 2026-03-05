import React from 'react';
import { Field, Input, Textarea, Select } from '../UI/Field';

const MODELS = [
  // 250k token tier (high capability)
  'gpt-5.2',
  'o3',

  // 2.5M token tier (high volume)
  'gpt-5-mini',
  'o3-mini',
  'gpt-4.1-mini',
  'gpt-4o-mini',
];

/**
 * @param {{ config: object, onChange: (key, value) => void }} props
 */
export default function AgentConfig({ config = {}, onChange }) {
  return (
    <>
      <Field label="Model">
        <Select value={config.model || 'gpt-4o-mini'} onChange={(e) => onChange('model', e.target.value)}>
          {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
      </Field>

      <Field label="System Prompt">
        <Textarea
          value={config.systemPrompt || ''}
          onChange={(e) => onChange('systemPrompt', e.target.value)}
          placeholder="You are a helpful assistant..."
        />
      </Field>

      <Field label="Prompt Template">
        <Textarea
          value={config.prompt || ''}
          onChange={(e) => onChange('prompt', e.target.value)}
          placeholder="Use {{variable}} for dynamic values..."
          style={{ minHeight: 100 }}
        />
      </Field>

      {/* <Field label={`Temperature — ${config.temperature ?? 0.7}`}>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={config.temperature ?? 0.7}
          onChange={(e) => onChange('temperature', parseFloat(e.target.value))}
        />
      </Field> */}

      <Field label="Max Tokens">
        <Input
          type="number"
          value={config.maxTokens || 1000}
          onChange={(e) => onChange('maxTokens', parseInt(e.target.value))}
        />
      </Field>
    </>
  );
}
