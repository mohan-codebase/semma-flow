import React from 'react';

type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  color: string;
  label: string;
  size?: BadgeSize;
}

function hexToRgba(hex: string, alpha: number): string {
  // Handle CSS variable strings or non-hex values gracefully
  if (!hex.startsWith('#')) {
    return `rgba(16, 185, 129, ${alpha})`;
  }
  const sanitized = hex.replace('#', '');
  const full =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((c) => c + c)
          .join('')
      : sanitized;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Badge({ color, label, size = 'md' }: BadgeProps) {
  const isSmall = size === 'sm';

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: hexToRgba(color, 0.15),
    color: color,
    borderRadius: '9999px',
    fontSize: isSmall ? '10px' : '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: isSmall ? '2px 7px' : '3px 10px',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  };

  return <span style={style}>{label}</span>;
}
