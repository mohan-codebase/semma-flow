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

import CustomSelect from '@/components/ui/Select';

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[] | { value: string; label: string }[];
}) {
  return <CustomSelect value={value} onChange={onChange} options={options} />;
}

export function TextField({
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  step,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
  step?: string | number;
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      step={step}
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
