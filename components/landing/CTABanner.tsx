'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Flame } from 'lucide-react';
import Link from 'next/link';

export default function CTABanner() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section
      ref={ref}
      style={{
        padding: 'clamp(48px, 6vw, 80px) clamp(16px, 5vw, 64px)',
        position: 'relative',
      }}
    >
      {/* Divider line top */}
      <div style={{
        position: 'absolute',
        top: 0, left: '10%', right: '10%',
        height: 1,
        background: 'linear-gradient(to right, transparent, var(--border-default), transparent)',
      }} />

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'relative',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--r-2xl)',
            padding: 'clamp(36px, 5vw, 64px)',
            textAlign: 'center',
            overflow: 'hidden',
            boxShadow: '0 0 60px rgba(16,229,176,0.08), var(--shadow-lg)',
          }}
        >
          {/* Background glow */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(16,229,176,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Flame icon */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: 'var(--r-xl)',
            background: 'var(--warm-glow)',
            border: '1px solid rgba(244,183,64,0.3)',
            marginBottom: 20,
          }}>
            <Flame size={24} color="var(--warm)" className="fire-glow" />
          </div>

          <h2 style={{
            fontSize: 'clamp(26px, 3.5vw, 44px)',
            fontWeight: 800,
            fontFamily: "'Outfit'",
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            margin: '0 0 14px',
            position: 'relative',
          }}>
            Ready to build your{' '}
            <span className="gradient-text">best year yet?</span>
          </h2>

          <p style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: 440,
            margin: '0 auto 32px',
            position: 'relative',
          }}>
            Join 1,200+ builders who are already tracking smarter. Start in under 2 minutes — no credit card needed.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap',
            position: 'relative',
          }}>
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 28px',
                  borderRadius: 'var(--r-lg)',
                  background: 'var(--accent-primary)',
                  color: 'var(--accent-on-primary)',
                  fontSize: 15, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 0 32px rgba(16,229,176,0.28)',
                }}
              >
                Start for free
                <ArrowRight size={16} />
              </motion.button>
            </Link>
            <Link href="/#pricing">
              <button style={{
                padding: '14px 24px',
                borderRadius: 'var(--r-lg)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 15, fontWeight: 600,
                border: '1px solid var(--border-default)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s ease, color 0.15s ease',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-medium)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                See pricing
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
