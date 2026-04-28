'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface EmptyStateProps {
  /** Large emoji or icon used as the illustration (e.g. "🔥", "📊", "🏆") */
  emoji: string;
  /** Bold headline */
  title: string;
  /** Softer explanation text — 1–2 sentences */
  description: string;
  /** Optional primary CTA */
  cta?: React.ReactNode;
  /** Optional secondary link / text below CTA */
  hint?: React.ReactNode;
  /** Accent colour used for the glow ring (default: var(--accent-primary)) */
  accentColor?: string;
  /** Compact variant — less vertical padding */
  compact?: boolean;
}

/**
 * Reusable premium empty state.
 * Animates in from below on first render.
 */
export default function EmptyState({
  emoji,
  title,
  description,
  cta,
  hint,
  accentColor = 'var(--accent-primary)',
  compact = false,
}: EmptyStateProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });

  const py = compact ? '36px' : '64px';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: `${py} 24px`,
        gap: compact ? 12 : 16,
      }}
    >
      {/* Emoji illustration with glow ring */}
      <div style={{ position: 'relative', marginBottom: compact ? 2 : 6 }}>
        {/* Outer glow ring */}
        <div style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: compact ? 52 : 72,
            height: compact ? 52 : 72,
            borderRadius: compact ? 16 : 20,
            background: `${accentColor}14`,
            border: `1px solid ${accentColor}30`,
            boxShadow: `0 0 28px ${accentColor}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: compact ? 26 : 34,
            lineHeight: 1,
            position: 'relative',
          }}
        >
          {emoji}
        </motion.div>
      </div>

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 5 : 8, maxWidth: 300 }}>
        <h3 style={{
          margin: 0,
          fontSize: compact ? 16 : 18,
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: "'Outfit', sans-serif",
          letterSpacing: '-0.02em',
        }}>
          {title}
        </h3>
        <p style={{
          margin: 0,
          fontSize: compact ? 13 : 14,
          color: 'var(--text-muted)',
          lineHeight: 1.65,
        }}>
          {description}
        </p>
      </div>

      {/* CTA */}
      {cta && (
        <div style={{ marginTop: compact ? 4 : 8 }}>
          {cta}
        </div>
      )}

      {/* Hint text */}
      {hint && (
        <p style={{
          margin: 0,
          fontSize: 12,
          color: 'var(--text-dimmed)',
          lineHeight: 1.5,
          maxWidth: 260,
        }}>
          {hint}
        </p>
      )}
    </motion.div>
  );
}
