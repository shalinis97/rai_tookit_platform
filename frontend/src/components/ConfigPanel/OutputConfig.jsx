import React from 'react';
import { Field, Input, Select } from '../UI/Field';

/**
 * @param {{ config: object, onChange: (key, value) => void }} props
 */
export default function OutputConfig({ config = {}, onChange }) {
  const channel = config.channel || 'webhook';

  return (
    <>
      <Field label="Output Channel">
        <Select value={channel} onChange={(e) => onChange('channel', e.target.value)}>
          <option value="webhook">Webhook</option>
          <option value="email">Email</option>
          <option value="slack">Slack</option>
          <option value="database">Database</option>
          <option value="console">Console Log</option>
        </Select>
      </Field>

      <Field label="Response Format">
        <Select
          value={config.format || 'json'}
          onChange={(e) => onChange('format', e.target.value)}
        >
          <option value="json">JSON</option>
          <option value="text">Plain Text</option>
          <option value="markdown">Markdown</option>
        </Select>
      </Field>

      {channel === 'email' && (
        <Field label="To">
          <Input
            value={config.to || ''}
            onChange={(e) => onChange('to', e.target.value)}
            placeholder="recipient@example.com"
            type="email"
          />
        </Field>
      )}

      {channel === 'slack' && (
        <Field label="Slack Channel">
          <Input
            value={config.slackChannel || ''}
            onChange={(e) => onChange('slackChannel', e.target.value)}
            placeholder="#general"
          />
        </Field>
      )}

      {channel === 'webhook' && (
        <Field label="Callback URL">
          <Input
            value={config.callbackUrl || ''}
            onChange={(e) => onChange('callbackUrl', e.target.value)}
            placeholder="https://your-server.com/callback"
          />
        </Field>
      )}
    </>
  );
}
