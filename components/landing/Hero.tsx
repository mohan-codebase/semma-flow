'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Flame, BarChart3, Trophy, CheckCircle2, Zap, Shield } from 'lucide-react';

/* ─── Animated number counter ─────────────────────────────────────────── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(to / 40);
    const id = setInterval(() => {
      start = Math.min(start + step, to);
      setValue(start);
      if (start >= to) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [inView, to]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {value.toLocaleString()}{suffix}
    </span>
  );
}

/* ─── Mini habit card for the dashboard preview ─────────────────────── */
function MiniHabitCard({
  icon,
  name,
  streak,
  color,
  done,
  delay,
}: {
  icon: string;
  name: string;
  streak: number;
  color: string;
  done: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: done ? `${color}12` : 'var(--bg-tertiary)',
        border: `1px solid ${done ? `${color}30` : 'var(--border-subtle)'}`,
        borderRadius: 'var(--r-lg)',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--r-md)',
          background: `${color}20`,
          border: `1px solid ${color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {name}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
          🔥 {streak} day streak
        </p>
      </div>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: `2px solid ${done ? color : 'var(--border-default)'}`,
          background: done ? color : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.2s ease',
        }}
      >
        {done && <CheckCircle2 size={12} color="#fff" strokeWidth={3} />}
      </div>
    </motion.div>
  );
}

/* ─── Dashboard preview panel ──────────────────────────────────────────── */
function DashboardPreview() {
  const habits = [
    { icon: '🧘', name: 'Morning Meditation', streak: 34, color: '#8B7FE8', done: true },
    { icon: '🏃', name: 'Morning Run', streak: 12, color: '#10E5B0', done: true },
    { icon: '📚', name: 'Read 30 mins', streak: 7, color: '#F4B740', done: false },
    { icon: '💧', name: 'Drink 8 glasses', streak: 21, color: '#5BC7DA', done: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{
        perspective: 1000,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--r-2xl)',
        padding: 20,
        boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.06)',
        maxWidth: 360,
        width: '100%',
      }}
    >
      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
            Today's Habits
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit'", margin: '2px 0 0' }}>
            3 of 4 done
          </p>
        </div>
        <div style={{
          padding: '4px 10px',
          borderRadius: 999,
          background: 'var(--accent-glow-md)',
          border: '1px solid rgba(16,229,176,0.3)',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--accent-primary)',
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          75%
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 4,
        borderRadius: 99,
        background: 'var(--border-subtle)',
        marginBottom: 16,
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '75%' }}
          transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
          style={{
            height: '100%',
            borderRadius: 99,
            background: 'linear-gradient(90deg, var(--accent-primary), var(--cyan))',
          }}
        />
      </div>

      {/* Habit list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {habits.map((h, i) => (
          <MiniHabitCard key={h.name} {...h} delay={0.7 + i * 0.1} />
        ))}
      </div>

      {/* Streak badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.4, duration: 0.4 }}
        style={{
          marginTop: 16,
          padding: '10px 14px',
          background: 'linear-gradient(135deg, rgba(244,183,64,0.12), rgba(244,183,64,0.06))',
          border: '1px solid rgba(244,183,64,0.25)',
          borderRadius: 'var(--r-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Flame size={14} color="var(--warm)" />
        <span style={{ fontSize: 12, color: 'var(--warm)', fontWeight: 600 }}>
          34-day streak on Meditation · Personal best!
        </span>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Hero ─────────────────────────────────────────────────────────── */
export default function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const fadeUp = (delay = 0) => ({
    initial: mounted ? { opacity: 0, y: 18 } : false as const,
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        padding: 'clamp(80px, 10vw, 120px) clamp(16px, 5vw, 64px) clamp(64px, 8vw, 100px)',
      }}
    >
      {/* Background orbs */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', top: '-15%', left: '-5%',
          width: '55%', height: '60%',
          background: 'radial-gradient(ellipse, rgba(16,229,176,0.10) 0%, transparent 70%)',
          filter: 'blur(1px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-5%',
          width: '45%', height: '50%',
          background: 'radial-gradient(ellipse, rgba(139,127,232,0.10) 0%, transparent 70%)',
          filter: 'blur(1px)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 'clamp(40px, 6vw, 80px)',
          alignItems: 'center',
        }}
          className="hf-hero-grid"
        >
          {/* Left: Copy */}
          <div>
            {/* Badge */}
            <motion.div {...fadeUp(0.1)} style={{ marginBottom: 24 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '5px 12px 5px 8px',
                borderRadius: 999,
                background: 'var(--accent-glow)',
                border: '1px solid var(--border-accent)',
                fontSize: 12, fontWeight: 600,
                color: 'var(--accent-primary)',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  display: 'inline-block',
                }} className="glow-pulse" />
                Now in public beta
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 {...fadeUp(0.2)} style={{
              fontSize: 'clamp(36px, 5.5vw, 68px)',
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              margin: '0 0 20px',
            }}>
              Build habits that{' '}
              <span className="gradient-text">actually stick.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p {...fadeUp(0.3)} style={{
              fontSize: 'clamp(15px, 1.8vw, 19px)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '0 0 36px',
              maxWidth: 520,
            }}>
              Semma Flow is the performance-grade habit tracker for builders, athletes, and lifelong learners. Streaks, analytics, mood tracking — everything in one place.
            </motion.p>

            {/* CTA buttons */}
            <motion.div {...fadeUp(0.4)} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '13px 24px',
                    borderRadius: 'var(--r-lg)',
                    background: 'var(--accent-primary)',
                    color: 'var(--accent-on-primary)',
                    fontSize: 15, fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 0 28px rgba(16,229,176,0.25)',
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  Start for free
                  <ArrowRight size={16} />
                </motion.button>
              </Link>
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '13px 24px',
                    borderRadius: 'var(--r-lg)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: 15, fontWeight: 600,
                    border: '1px solid var(--border-default)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                >
                  Sign in
                </motion.button>
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.div {...fadeUp(0.5)} style={{
              display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
            }}>
              {[
                { icon: <Shield size={13} />, text: 'No credit card needed' },
                { icon: <Zap size={13} />, text: 'Free forever plan' },
                { icon: <CheckCircle2 size={13} />, text: 'Cancel anytime' },
              ].map(({ icon, text }) => (
                <span key={text} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 500,
                }}>
                  <span style={{ color: 'var(--accent-primary)' }}>{icon}</span>
                  {text}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: Dashboard preview */}
          <motion.div
            {...fadeUp(0.3)}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <DashboardPreview />
          </motion.div>
        </div>

        {/* Stats strip */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            marginTop: 'clamp(48px, 8vw, 80px)',
            background: 'var(--border-subtle)',
            borderRadius: 'var(--r-xl)',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
          }}
          className="hf-stats-strip"
        >
          {[
            { value: 1200, suffix: '+', label: 'Active users' },
            { value: 8400, suffix: '+', label: 'Habits tracked' },
            { value: 96, suffix: '%', label: 'Streak retention' },
          ].map(({ value, suffix, label }) => (
            <div key={label} style={{
              padding: 'clamp(20px, 3vw, 32px)',
              background: 'var(--bg-card)',
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: 'clamp(28px, 3.5vw, 42px)',
                fontWeight: 800,
                fontFamily: "'Outfit'",
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                margin: '0 0 4px',
              }}>
                <Counter to={value} suffix={suffix} />
              </p>
              <p style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                margin: 0,
                fontWeight: 500,
              }}>
                {label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
