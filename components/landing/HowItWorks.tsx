'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Plus, CheckCircle2, BarChart3 } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: <Plus size={22} />,
    title: 'Define your habits',
    description:
      'Create habits with flexible frequencies — daily, specific days, or X times per week. Set a target type (check-off, numeric, duration) and pick a colour and icon.',
    accent: 'var(--accent-primary)',
    glow: 'var(--accent-glow-md)',
    border: 'var(--border-accent)',
    detail: [
      'Custom icon + colour',
      'Category organisation',
      'Reminder time (per habit)',
    ],
  },
  {
    number: '02',
    icon: <CheckCircle2 size={22} />,
    title: 'Check in daily',
    description:
      "Open the dashboard, tap your habits done. The live indicator shows real-time sync across devices. Forgot yesterday? Use backfill logging.",
    accent: 'var(--indigo)',
    glow: 'var(--indigo-glow)',
    border: 'rgba(139,127,232,0.35)',
    detail: [
      'One-tap check-in',
      'Backfill any past day',
      'Notes per entry',
    ],
  },
  {
    number: '03',
    icon: <BarChart3 size={22} />,
    title: 'Analyse and improve',
    description:
      'The dashboard surfaces your strongest day of the week, momentum vs last week, streaks at risk, and your full 365-day heatmap.',
    accent: 'var(--cyan)',
    glow: 'var(--cyan-glow)',
    border: 'rgba(91,199,218,0.35)',
    detail: [
      'Year-view heatmap',
      'Completion rate trends',
      'Achievement badges',
    ],
  },
];

function StepCard({ step, index }: { step: (typeof STEPS)[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: 'relative' }}
    >
      {/* Connector line (not on last card) */}
      {index < STEPS.length - 1 && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 40,
            left: 'calc(50% + 100px)',
            width: 'calc(100% - 100px)',
            height: 1,
            background: `linear-gradient(to right, ${step.accent}40, transparent)`,
            display: 'none', // hidden on mobile, shown via CSS below
          }}
          className="hf-step-connector"
        />
      )}

      <div
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${step.border}`,
          borderRadius: 'var(--r-xl)',
          padding: '28px 24px',
          boxShadow: 'var(--glass-highlight), var(--shadow-md)',
          height: '100%',
        }}
      >
        {/* Step number + icon row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--r-lg)',
            background: step.glow,
            border: `1px solid ${step.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: step.accent,
            flexShrink: 0,
          }}>
            {step.icon}
          </div>
          <div>
            <span style={{
              fontSize: 10.5,
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: step.accent,
              fontWeight: 600,
            }}>
              Step {step.number}
            </span>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "'Outfit'",
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: '3px 0 0',
            }}>
              {step.title}
            </h3>
          </div>
        </div>

        <p style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 18px',
        }}>
          {step.description}
        </p>

        {/* Detail bullets */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {step.detail.map(d => (
            <li key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <CheckCircle2 size={13} color={step.accent} strokeWidth={2.5} />
              <span style={{ color: 'var(--text-secondary)' }}>{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-60px' });

  return (
    <section
      id="how-it-works"
      style={{
        padding: 'clamp(64px, 8vw, 120px) clamp(16px, 5vw, 64px)',
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

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Section header */}
        <div ref={headingRef} style={{ textAlign: 'center', marginBottom: 'clamp(40px, 5vw, 60px)' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 12 }}
          >
            <span className="eyebrow" style={{ letterSpacing: '0.14em' }}>How it works</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.06 }}
            style={{
              fontSize: 'clamp(28px, 3.5vw, 44px)',
              fontWeight: 800,
              fontFamily: "'Outfit'",
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              margin: '0 0 14px',
            }}
          >
            Three steps to{' '}
            <span className="gradient-text">total consistency.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.12 }}
            style={{
              fontSize: 16,
              color: 'var(--text-secondary)',
              maxWidth: 480,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            No complex setup. No steep learning curve. Be tracking your first habit within 2 minutes.
          </motion.p>
        </div>

        {/* Steps grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: 'var(--space-4)',
          position: 'relative',
        }}>
          {STEPS.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
