import React from 'react';

const VARIANTS = {
  primary: {
    background: 'var(--accent)',
    color: '#000',
    border: '1px solid var(--accent)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text2)',
    border: '1px solid var(--border)',
  },
  danger: {
    background: 'transparent',
    color: 'var(--trigger)',
    border: '1px solid var(--trigger)',
  },
};

const HOVER_STYLES = `
  .fm-btn-primary:hover { background: var(--accent2) !important; box-shadow: 0 0 16px rgba(0,255,136,0.3); }
  .fm-btn-ghost:hover   { border-color: var(--border2) !important; color: var(--text) !important; background: var(--surface2) !important; }
  .fm-btn-danger:hover  { background: rgba(239,68,68,0.1) !important; }
`;

/**
 * @param {{ variant?: 'primary'|'ghost'|'danger', icon?: string, onClick?: fn, disabled?: bool, style?: object, children: React.ReactNode }} props
 */
export default function Button({
  variant = 'ghost',
  icon,
  onClick,
  disabled = false,
  style = {},
  children,
  ...rest
}) {
  const base = VARIANTS[variant] || VARIANTS.ghost;

  return (
    <>
      <style>{HOVER_STYLES}</style>
      <button
        className={`fm-btn-${variant}`}
        onClick={onClick}
        disabled={disabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 14px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'Syne, sans-serif',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.15s',
          letterSpacing: '0.3px',
          ...base,
          ...style,
        }}
        {...rest}
      >
        {icon && <span>{icon}</span>}
        {children}
      </button>
    </>
  );
}
