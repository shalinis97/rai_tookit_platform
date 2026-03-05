import React from 'react';

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  fontSize: 13,
  fontFamily: 'IBM Plex Mono, monospace',
  outline: 'none',
  transition: 'border-color 0.15s',
  resize: 'none',
};

/**
 * Reusable labeled form field wrapper.
 * Passes fieldStyle to the child via clone if child is a native element.
 */
export function Field({ label, children, style = {} }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'var(--text3)',
            marginBottom: 6,
            fontFamily: 'Space Mono, monospace',
          }}
        >
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

/** Styled text input */
export function Input({ onFocus, onBlur, style = {}, ...props }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <input
      style={{
        ...inputStyle,
        borderColor: focused ? 'var(--accent)' : 'var(--border)',
        ...style,
      }}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      {...props}
    />
  );
}

/** Styled textarea */
export function Textarea({ onFocus, onBlur, style = {}, className = '', ...props }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <textarea
      className={className}
      style={{
        ...inputStyle,
        minHeight: 100,
        lineHeight: 1.6,
        borderColor: focused ? 'var(--accent)' : 'var(--border)',
        ...style,
      }}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      {...props}
    />
  );
}

/** Styled select */
export function Select({ onFocus, onBlur, style = {}, children, ...props }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <select
      style={{
        ...inputStyle,
        appearance: 'none',
        cursor: 'pointer',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238b949e'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        backgroundSize: '10px',
        backgroundBlendMode: 'normal',
        backgroundColor: 'var(--surface2)',
        paddingRight: 28,
        borderColor: focused ? 'var(--accent)' : 'var(--border)',
        ...style,
      }}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      {...props}
    >
      {children}
    </select>
  );
}
