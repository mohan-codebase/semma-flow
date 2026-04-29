'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Zap, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  highlight: boolean;
  badge?: string;
  cta: string;
  href: string;
  icon: React.ReactNode;
  accent: string;
  glow: string;
  border: string;
  features: string[];
}

const TIERS: PricingTier[] = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for getting started and building your first habits.',
    highlight: false,
    cta: 'Start for free',
    href: '/signup',
    icon: <Check size={18} />,
    accent: 'var(--text-secondary)',
    glow: 'var(--bg-tertiary)',
    border: 'var(--border-subtle)',
    features: [
      'Up to 5 habits',
      '30-day history',
      'Basic streak tracking',
      'Weekly overview',
      'Mobile-friendly',
    ],
  },
  {
    name: 'Pro',
    price: '₹299',
    period: 'per month',
    description: 'For serious builders who want unlimited tracking and deep insights.',
    highlight: true,
    badge: 'Most popular',
    cta: 'Start Pro free',
    href: '/signup?plan=pro',
    icon: <Zap size={18} />,
    accent: 'var(--accent-primary)',
    glow: 'var(--accent-glow-md)',
    border: 'var(--border-accent)',
    features: [
      'Unlimited habits',
      '1-year full history',
      'Advanced analytics',
      'Year heatmap',
      'Mood tracking',
      'Achievement badges',
      'Backfill logging',
      'Data export (CSV)',
    ],
  },
  {
    name: 'Elite',
    price: '₹699',
    period: 'per month',
    description: 'For peak performers who want AI coaching and priority everything.',
    highlight: false,
    badge: 'Coming soon',
    cta: 'Join waitlist',
    href: '/signup?plan=elite',
    icon: <Trophy size={18} />,
    accent: 'var(--indigo)',
    glow: 'var(--indigo-glow)',
    border: 'rgba(139,127,232,0.35)',
    features: [
      'Everything in Pro',
      'AI habit coach',
      'Weekly email digest',
      'Streak freeze (4/mo)',
      'Shareable streak cards',
      'Accountability partner',
      'Priority support',
      'Early feature access',
    ],
  },
];

function TierCard({ tier, index }: { tier: PricingTier; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'relative',
        background: tier.highlight ? 'var(--bg-elevated)' : 'var(--bg-card)',
        border: `1px solid ${tier.border}`,
        borderRadius: 'var(--r-2xl)',
        padding: '28px 24px',
        boxShadow: tier.highlight
          ? 'var(--glass-highlight), 0 0 40px rgba(16,229,176,0.12), var(--shadow-lg)'
          : 'var(--glass-highlight), var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Popular badge */}
      {tier.badge && (
        <div style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '3px 12px',
          borderRadius: 999,
          background: tier.highlight ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
          color: tier.highlight ? 'var(--accent-on-primary)' : 'var(--text-muted)',
          border: `1px solid ${tier.border}`,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          {tier.badge}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--r-md)',
          background: tier.glow,
          border: `1px solid ${tier.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: tier.accent,
        }}>
          {tier.icon}
        </div>
        <div>
          <p style={{
            fontSize: 13,
            fontWeight: 700,
            color: tier.highlight ? 'var(--accent-primary)' : 'var(--text-secondary)',
            margin: 0,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontFamily: "'IBM Plex Mono', monospace",
          }}>
            {tier.name}
          </p>
        </div>
      </div>

      {/* Price */}
      <div style={{ marginBottom: 6 }}>
        <span style={{
          fontSize: 40,
          fontWeight: 800,
          fontFamily: "'Outfit'",
          color: 'var(--text-primary)',
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}>
          {tier.price}
        </span>
        <span style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          marginLeft: 6,
          fontWeight: 500,
        }}>
          /{tier.period}
        </span>
      </div>

      <p style={{
        fontSize: 13.5,
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        margin: '0 0 24px',
      }}>
        {tier.description}
      </p>

      {/* CTA button */}
      <Link href={tier.href} style={{ textDecoration: 'none', marginBottom: 24 }}>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: 'var(--r-lg)',
            background: tier.highlight ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: tier.highlight ? 'var(--accent-on-primary)' : 'var(--text-primary)',
            border: `1px solid ${tier.highlight ? 'transparent' : 'var(--border-default)'}`,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            transition: 'background 0.15s ease',
            fontFamily: 'inherit',
            boxShadow: tier.highlight ? '0 0 20px rgba(16,229,176,0.2)' : 'none',
          }}
        >
          {tier.cta}
          <ArrowRight size={14} />
        </motion.button>
      </Link>

      {/* Feature list */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
        {tier.features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5 }}>
            <Check
              size={13}
              strokeWidth={2.5}
              color={tier.highlight ? 'var(--accent-primary)' : 'var(--text-muted)'}
              style={{ flexShrink: 0 }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function Pricing() {
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-60px' });

  return (
    <section
      id="pricing"
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

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Section header */}
        <div ref={headingRef} style={{ textAlign: 'center', marginBottom: 'clamp(40px, 5vw, 64px)' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 12 }}
          >
            <span className="eyebrow">Pricing</span>
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
            Simple, honest{' '}
            <span className="gradient-text">pricing.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.12 }}
            style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}
          >
            Start free, upgrade when you need more. No hidden fees, no surprise charges.
          </motion.p>
        </div>

        {/* Tier cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: 'var(--space-4)',
          alignItems: 'start',
        }}>
          {TIERS.map((tier, i) => (
            <TierCard key={tier.name} tier={tier} index={i} />
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={headingInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{
            textAlign: 'center',
            fontSize: 12.5,
            color: 'var(--text-dimmed)',
            marginTop: 32,
          }}
        >
          All prices in INR · Billing monthly · Cancel anytime · No credit card required to start
        </motion.p>
      </div>
    </section>
  );
}
