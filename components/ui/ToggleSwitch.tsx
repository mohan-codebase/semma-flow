'use client';

import React from 'react';
import { DynamicIcon } from '@/lib/icons';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  /** Accessible name, e.g. "Switch to dark mode". */
  ariaLabel: string;
  /** Optional icon names (from lib/icons) shown inside the thumb per state. */
  onIcon?: string;
  offIcon?: string;
  onIconColor?: string;
  offIconColor?: string;
}

/**
 * Liquid-glass pill toggle. Mobile-safe by construction: the visual 58×32 pill
 * lives in an inner element so the global `button { min-height: 44px }` rule
 * inflates only the (invisible) tap target, never the track — and the thumb is
 * symmetric in both states. Use this everywhere instead of hand-rolling a
 * sliding switch.
 */
export default function ToggleSwitch({
  checked, onChange, ariaLabel,
  onIcon, offIcon, onIconColor = '#555555', offIconColor = '#a6a6a6',
}: ToggleSwitchProps) {
  const icon = checked ? onIcon : offIcon;
  const iconColor = checked ? onIconColor : offIconColor;

  return (
    <button
      onClick={onChange}
      aria-label={ariaLabel}
      aria-pressed={checked}
      style={{
        border: 'none', background: 'transparent', padding: 0, margin: 0,
        cursor: 'pointer', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <span style={{
        display: 'block', position: 'relative',
        width: 58, height: 32, borderRadius: 'var(--r-pill)',
        background: checked
          ? 'linear-gradient(135deg, rgba(85, 85, 85,0.55) 0%, rgba(114, 114, 114,0.35) 100%)'
          : 'linear-gradient(135deg, rgba(188, 188, 188,0.45) 0%, rgba(218, 218, 218,0.30) 100%)',
        boxShadow: checked
          ? '0 0 0 1px rgba(114, 114, 114,0.5), inset 0 1px 0 rgba(255, 255, 255,0.18), 0 4px 16px rgba(85, 85, 85,0.45)'
          : '0 0 0 1px rgba(188, 188, 188,0.6), inset 0 1px 0 rgba(255, 255, 255,0.55), 0 2px 8px rgba(85, 85, 85,0.15)',
        transition: 'all 0.3s ease',
      }}>
        <span style={{
          position: 'absolute', top: 4, left: checked ? 30 : 4,
          width: 24, height: 24, borderRadius: '50%',
          background: checked
            ? 'linear-gradient(145deg, rgba(255, 255, 255,0.95) 0%, rgba(235, 235, 235,0.85) 100%)'
            : 'linear-gradient(145deg, rgba(255, 255, 255,0.98) 0%, rgba(255, 255, 255,0.80) 100%)',
          boxShadow: checked
            ? '0 0 0 1px rgba(255, 255, 255,0.25), 0 2px 8px rgba(85, 85, 85,0.5), inset 0 1px 0 rgba(255, 255, 255,0.9)'
            : '0 0 0 1px rgba(188, 188, 188,0.4), 0 2px 6px rgba(0, 0, 0,0.12), inset 0 1px 0 rgba(255, 255, 255,1)',
          transition: 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon && <DynamicIcon name={icon} size={12} color={iconColor} />}
        </span>
      </span>
    </button>
  );
}
