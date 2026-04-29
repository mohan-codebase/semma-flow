'use client';

import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Flame, BarChart3, Trophy, CalendarCheck, Brain, Zap,
  Moon, Sparkles, RefreshCw, SmilePlus,
} from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  glow: string;
}

const FEATURES: Feature[] = [
  {
    icon: <Flame size={20} />,
    title: 'Streak System',
    description: 'Watch your longest streak grow. Fire animations, glow effects, and a personal best counter keep you hooked.',
    accent: 'var(--warm)',
    glow: 'var(--warm-glow)',
  },
  {
    icon: <BarChart3 size={20} />,
    title: 'Advanced Analytics',
    description: 'Year-view heatmaps, 7/30/90-day progress charts, weekday patterns, and momentum scores — all built-in.',
    accent: 'var(--accent-primary)',
    glow: 'var(--accent-glow)',
  },
  {
    icon: <Trophy size={20} />,
    title: 'Achievement Badges',
    description: '18 unlockable milestones from "Getting Started" to "Year Warrior". Rarity tiers: common, rare, epic, legendary.',
    accent: 'var(--indigo)',
    glow: 'var(--indigo-glow)',
  },
  {
    icon: <SmilePlus size={20} />,
    title: 'Mood Tracking',
    description: 'Log your mood and energy daily. Discover which habits correlate with your best days.',
    accent: 'var(--pink)',
    glow: 'var(--pink-glow)',
  },
  {
    icon: <CalendarCheck size={20} />,
    title: 'Backfill Logging',
    description: "Forgot to log yesterday? No problem. Log any past day with notes. Your history stays accurate.",
    accent: 'var(--cyan)',
    glow: 'var(--cyan-glow)',
  },
  {
    icon: <Brain size={20} />,
    title: 'Smart Categories',
    description: 'Organise habits into Health, Learning, Work, and custom categories. Filter and analyse by category.',
    accent: 'var(--accent-light)',
    glow: 'var(--accent-glow)',
  },
  {
    icon: <Zap size={20} />,
    title: 'Realtime Sync',
    description: 'Check in on desktop, see it on mobile instantly. Supabase realtime keeps every device in sync.',
    accent: 'var(--warm)',
    glow: 'var(--warm-glow)',
  },
  {
    icon: <RefreshCw size={20} />,
    title: 'Flexible Frequency',
    description: 'Daily, specific days, X per week, X per month. Set habits to match your actual lifestyle, not a rigid grid.',
    accent: 'var(--indigo)',
    glow: 'var(--indigo-glow)',
  },
  {
    icon: <Moon size={20} />,
    title: 'Dark & Light Themes',
    description: "A meticulously tuned dark-first design system. Switch to light mode with one click — no jarring flashes.",
    accent: 'var(--cyan)',
    glow: 'var(--cyan-glow)',
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 3) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="lift"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-xl)',
        padding: '22px 20px',
        boxShadow: 'var(--glass-highlight), var(--shadow-sm)',
        cursor: 'default',
      }}
    >
      {/* Icon chip */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 'var(--r-md)',
        background: feature.glow,
        border: `1px solid ${feature.accent}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: feature.accent,
        marginBottom: 14,
        flexShrink: 0,
      }}>
        {feature.icon}
      </div>

      <h3 style={{
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--text-primary)',
        fontFamily: "'Outfit'",
        letterSpacing: '-0.02em',
        margin: '0 0 8px',
      }}>
        {feature.title}
      </h3>
      <p style={{
        fontSize: 13.5,
        color: 'var(--text-secondary)',
        lineHeight: 1.55,
        margin: 0,
      }}>
        {feature.description}
      </p>
    </motion.div>
  );
}

export default function Features() {
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-60px' });

  return (
    <section
      id="features"
      style={{
        padding: 'clamp(64px, 8vw, 120px) clamp(16px, 5vw, 64px)',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      {/* Section header */}
      <div ref={headingRef} style={{ textAlign: 'center', marginBottom: 'clamp(40px, 5vw, 64px)' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={headingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 12 }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px',
            borderRadius: 999,
            background: 'var(--accent-glow)',
            border: '1px solid var(--border-accent)',
            fontSize: 11.5,
            fontWeight: 600,
            color: 'var(--accent-primary)',
            fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            <Sparkles size={11} />
            Everything you need
          </span>
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
            margin: '0 0 16px',
          }}
        >
          Built for people who are{' '}
          <span className="gradient-text">serious about growth.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={headingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.12 }}
          style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: 540,
            margin: '0 auto',
          }}
        >
          Semma Flow packs analytics, gamification, and journaling into a single clean interface — no bloat, no clutter.
        </motion.p>
      </div>

      {/* Feature grid — 3 cols on lg, 2 on md, 1 on sm */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
        gap: 'var(--space-4)',
      }}>
        {FEATURES.map((feature, i) => (
          <FeatureCard key={feature.title} feature={feature} index={i} />
        ))}
      </div>
    </section>
  );
}
