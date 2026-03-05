import React from 'react';
import { Field, Input, Select } from '../UI/Field';

/**
 * @param {{ config: object, onChange: (key, value) => void }} props
 */
export default function TriggerConfig({ config = {}, onChange }) {
  const triggerType = config.triggerType || 'manual';

  return (
    <>
      <Field label="Trigger Type">
        <Select value={triggerType} onChange={(e) => onChange('triggerType', e.target.value)}>
          <option value="manual">Manual</option>
          <option value="webhook">Webhook</option>
          <option value="cron">Scheduled (CRON)</option>
          <option value="event">Event</option>
        </Select>
      </Field>

      {triggerType === 'webhook' && (
        <Field label="Webhook URL">
          <Input
            value={config.url || ''}
            onChange={(e) => onChange('url', e.target.value)}
            placeholder="/webhook/my-trigger"
          />
        </Field>
      )}

      {triggerType === 'cron' && (
        <>
          <Field label="CRON Expression">
            <Input
              value={config.cron || ''}
              onChange={(e) => onChange('cron', e.target.value)}
              placeholder="0 9 * * *"
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
            Examples: <span style={{ color: 'var(--fn-light)' }}>0 9 * * *</span> = daily 9am ·{' '}
            <span style={{ color: 'var(--fn-light)' }}>*/15 * * * *</span> = every 15 min
          </div>
        </>
      )}

      {triggerType === 'event' && (
        <Field label="Event Name">
          <Input
            value={config.eventName || ''}
            onChange={(e) => onChange('eventName', e.target.value)}
            placeholder="user.created"
          />
        </Field>
      )}
    </>
  );
}
