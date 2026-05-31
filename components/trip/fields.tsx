'use client';

import React from 'react';

const controlBase: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 13.5,
  color: 'var(--text-primary)',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 10,
  outline: 'none',
};

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', userSelect: 'none' }}>
      {children}
      {required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}
    </label>
  );
}

export function Field({
  label,
  required,
  error,
  children,
}: {
  label?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      {children}
      {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[] | { value: string; label: string }[];
}) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...controlBase, appearance: 'none', cursor: 'pointer' }}
    >
      {opts.map((o) => (
        <option key={o.value} value={o.value} style={{ background: 'var(--bg-elevated)' }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={controlBase}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...controlBase, resize: 'vertical', fontFamily: 'inherit' }}
    />
  );
}
