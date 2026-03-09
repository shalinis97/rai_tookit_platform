import React from 'react';
import { Field, Input, Textarea, Select } from '../UI/Field';
import AiAssistant from '../UI/AiAssistant';

/**
 * @param {{ config: object, onChange: (key, value) => void }} props
 */
export default function FunctionConfig({ config = {}, onChange }) {
  return (
    <>
      <Field label="Runtime">
        <Select
          value={config.runtime || 'python'}
          onChange={(e) => onChange('runtime', e.target.value)}
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </Select>
      </Field>

      <Field label="Function Code">
        <Textarea
          className="code-editor"
          value={config.code || ''}
          onChange={(e) => onChange('code', e.target.value)}
          placeholder={config.runtime === 'javascript'
            ? `async (input) => {\n  // Your code here\n  return { output: input.output };\n}`
            : `async def run(input):\n    # Your code here\n    return {"output": input.get("output", "")}`
          }
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

      <div style={{
        padding: 10, borderRadius: 6,
        background: 'var(--surface2)',
        fontSize: 11, color: 'var(--text3)',
        fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.6,
      }}>
        Return a plain object with an <span style={{ color: 'var(--fn-light)' }}>output</span> key.{' '}
        <span style={{ color: 'var(--fn-light)' }}>input</span> contains the previous node's output.
      </div>

      <AiAssistant
        title="Function Assistant"
        placeholder="Describe what this function should do…"
        accentColor="#38bdf8"
        height={400}
        systemPrompt={`You are an expert Python and JavaScript developer helping build functions for an AI workflow engine.
Each function node runs user-defined code. The function receives an input dict/object and must return a dict/object.

For Python, the function signature is:
  async def run(input: dict) -> dict:

For JavaScript:
  async (input) => { ... return { output: "..." }; }

Available input fields:
  input["output"]   - text output from the previous node
  input["message"]  - original user message
  input["history"]  - conversation history array
  input["original"] - original input data

When generating code:
- Always return a dict/object with at least an "output" key
- Handle missing keys gracefully with .get() or optional chaining
- Keep code focused and concise
- Output ONLY the code block, no explanation unless asked
- Wrap in appropriate code fences (python or javascript)`}
        onInsert={(text) => {
          const match = text.match(/```(?:python|javascript|js)?\n?([\s\S]*?)```/);
          onChange('code', match ? match[1].trim() : text.trim());
        }}
      />
    </>
  );
}
