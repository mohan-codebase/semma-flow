'use client';

import React from 'react';
import { motion } from 'framer-motion';

type PaddingSize = 'sm' | 'md' | 'lg' | 'none';
type Tone = 'neutral' | 'mint' | 'indigo' | 'pink' | 'cyan' | 'warm';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: PaddingSize;
  tone?: Tone;
  onClick?: () => void;
}

const paddingMap: Record<PaddingSize, string> = {
  none: '0px',
  sm: '14px',
  md: '20px',
  lg: '28px',
};

const toneGlow: Record<Tone, string> = {
  neutral: 'rgba(0,0,0,0.0)',
  mint:    'var(--accent-glow)',
  indigo:  'var(--indigo-glow)',
  pink:    'var(--pink-glow)',
  cyan:    'var(--cyan-glow)',
  warm:    'var(--warm-glow)',
};

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  tone = 'neutral',
  onClick,
}: CardProps) {
  const baseStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--r-xl)',
    padding: paddingMap[padding],
    position: 'relative',
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : undefined,
    boxShadow: `var(--glass-highlight), var(--shadow-xs)`,
  };

  if (!hover && !onClick) {
    return (
      <div style={baseStyle} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      style={baseStyle}
      className={className}
      onClick={onClick}
      whileHover={
        hover
          ? {
              y: -1,
              boxShadow: `var(--glass-highlight), var(--shadow-md), 0 0 24px ${toneGlow[tone]}`,
              borderColor: 'var(--border-default)',
            }
          : undefined
      }
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
    >
      {children}
    </motion.div>
  );
}
