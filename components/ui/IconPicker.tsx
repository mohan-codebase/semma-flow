'use client';

import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, X } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  color?: string;
}

// Curated list of habit-relevant icons to show by default
const COMMON_ICONS = [
  'Zap', 'Flame', 'Target', 'Check-Circle-2', 'Activity', 'Award', 'Trophy',
  'Heart', 'Smile', 'Sun', 'Moon', 'Coffee', 'Utensils', 'Glass-Water', 'Apple',
  'Dumbbell', 'Footprints', 'Bicycle', 'Timer', 'Clock', 'Calendar', 'Brain',
  'Book', 'Book-Open', 'Pen-Tool', 'Music', 'Camera', 'Code', 'Terminal',
  'Medal', 'Star', 'Shield', 'Lock', 'Bell', 'Smartphone', 'Mail', 'Cloud',
  'Wind', 'Droplets', 'Tree-Pine', 'Mountain', 'Leaf', 'Flower-2', 'Palette',
  'Wallet', 'Coins', 'Briefcase', 'Graduation-Cap', 'Mic', 'Headphones', 'Video',
  'Gamepad-2', 'ShoppingCart', 'Plane', 'Map', 'Navigation', 'Compass'
];

function DynamicIcon({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  const pascal = name
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  const Icon = (LucideIcons as any)[pascal];
  return Icon ? <Icon size={size} color={color} /> : <LucideIcons.Circle size={size} color={color} />;
}

export default function IconPicker({ value, onChange, color = 'var(--accent-primary)' }: IconPickerProps) {
  const [search, setSearch] = useState('');
  
  const filteredIcons = useMemo(() => {
    if (!search) return COMMON_ICONS;
    
    // Search through all Lucide icons if user types something
    const query = search.toLowerCase().replace(/[-_]/g, '');
    const all = Object.keys(LucideIcons).filter(name => {
      // Filter out internal lucide components
      if (name.length < 3) return false;
      if (['createLucideIcon', 'LucideProps'].includes(name)) return false;
      return name.toLowerCase().includes(query);
    });
    
    // Sort results: common ones first, then alphabetical
    return all.sort((a, b) => {
      const aCommon = COMMON_ICONS.includes(a);
      const bCommon = COMMON_ICONS.includes(b);
      if (aCommon && !bCommon) return -1;
      if (!aCommon && bCommon) return 1;
      return a.localeCompare(b);
    }).slice(0, 60); // Limit results for performance
  }, [search]);

  // Convert kebab-case value back to TitleCase for display if needed
  const selectedDisplay = value;

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
          // Normalize names for comparison (kebab-case vs PascalCase)
          const normalized = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
          const active = value === normalized;
          
          return (
            <button
              key={name}
              type="button"
              onClick={() => onChange(normalized)}
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
              <DynamicIcon name={name} size={18} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: color, fontWeight: 600, fontSize: 13 }}>
          <DynamicIcon name={value} size={16} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{value}</span>
        </div>
      </div>
    </div>
  );
}
