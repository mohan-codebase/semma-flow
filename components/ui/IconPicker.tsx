'use client';

import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { DynamicIcon, HABIT_ICON_NAMES } from '@/lib/icons';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
}

export default function IconPicker({ value, onChange, color = 'var(--accent-primary)' }: IconPickerProps) {
  const [search, setSearch] = useState('');

  // Search is scoped to the curated, bundled set — no full-Lucide load, so
  // every result is guaranteed to render the same icon downstream.
  const filteredIcons = useMemo(() => {
    if (!search) return HABIT_ICON_NAMES;
    const query = search.toLowerCase().replace(/[-_]/g, '');
    return HABIT_ICON_NAMES.filter((n) => n.replace(/[-_]/g, '').includes(query));
  }, [search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
          <Search size={14} />
        </div>
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: '8px 12px 8px 32px',
            fontSize: 13,
            outline: 'none',
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Icon Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
          gap: 6,
          maxHeight: 200,
          overflowY: 'auto',
          padding: '4px',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          background: 'var(--bg-card)',
        }}
        className="hf-custom-scrollbar"
      >
        {filteredIcons.map((name) => {
          const active = value === name;

          return (
            <button
              key={name}
              type="button"
              onClick={() => onChange(name)}
              title={name}
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                border: `1px solid ${active ? color : 'transparent'}`,
                background: active ? `${color}15` : 'transparent',
                color: active ? color : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <DynamicIcon name={name} size={18} color="currentColor" />
            </button>
          );
        })}
        {filteredIcons.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No icons found
          </div>
        )}
      </div>

      {/* Selected Preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selected:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color, fontWeight: 600, fontSize: 13 }}>
          <DynamicIcon name={value} size={16} color="currentColor" />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{value}</span>
        </div>
      </div>
    </div>
  );
}
