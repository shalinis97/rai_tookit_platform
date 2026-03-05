import React from 'react';
import { Field, Input, Select } from '../UI/Field';

/**
 * @param {{ node: object, config: object, onChange: (key, value) => void }} props
 */
export default function AdvancedConfig({ node, config = {}, onChange }) {
  return (
    <>
      <Field label="Node ID">
        <Input value={node.id} readOnly style={{ opacity: 0.5, cursor: 'default' }} />
      </Field>

      <Field label="Node Type">
        <Input value={node.type} readOnly style={{ opacity: 0.5, cursor: 'default' }} />
      </Field>

      <Field label="Retry on Failure">
        <Select
          value={config.retry || '0'}
          onChange={(e) => onChange('retry', e.target.value)}
        >
          <option value="0">No retry</option>
          <option value="1">1 retry</option>
          <option value="3">3 retries</option>
          <option value="5">5 retries</option>
        </Select>
      </Field>

      <Field label="Retry Delay (ms)">
        <Input
          type="number"
          value={config.retryDelay || 1000}
          onChange={(e) => onChange('retryDelay', parseInt(e.target.value))}
          disabled={!config.retry || config.retry === '0'}
        />
      </Field>

      <Field label="Error Handling">
        <Select
          value={config.onError || 'stop'}
          onChange={(e) => onChange('onError', e.target.value)}
        >
          <option value="stop">Stop workflow</option>
          <option value="continue">Continue anyway</option>
          <option value="skip">Skip this node</option>
        </Select>
      </Field>

      <Field label="Node Description (internal)">
        <Input
          value={config.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="What does this node do?"
        />
      </Field>
    </>
  );
}
