'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  handle: string;
  role: string;
  avatar: string;
  text: string;
  stars: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Arjun Sharma',
    handle: '@arjun_builds',
    role: 'Full-stack developer',
    avatar: '👨🏽‍💻',
    text: `Finally a habit tracker that doesn't feel like a toy. The analytics alone are worth it — I can see exactly which days I underperform and why.`,
    stars: 5,
  },
  {
    name: 'Priya Menon',
    handle: '@priya.moves',
    role: 'Marathon runner',
    avatar: '🏃🏽‍♀️',
    text: 'I track 12 habits across training, nutrition, and recovery. The category system and year heatmap keep me accountable like nothing else has.',
    stars: 5,
  },
  {
    name: 'Kiran Nair',
    handle: '@kirannair',
    role: 'Startup founder',
    avatar: '🚀',
    text: 'The mood tracking + habit correlation is genuinely insightful. I discovered my productivity peaks when I meditate AND exercise. Changed my morning routine.',
    stars: 5,
  },
  {
    name: 'Sneha Iyer',
    handle: '@sneha.reads',
    role: 'PhD student',
    avatar: '📚',
    text: 'Backfill logging is a game changer. Life gets busy — being able to log yesterday without losing my streak keeps me from giving up entirely.',
    stars: 5,
  },
  {
    name: 'Rahul Verma',
    handle: '@rahulv',
    role: 'Product manager',
    avatar: '🎯',
    text: `The streak system is genuinely addictive. I'm 61 days into a meditation streak and I would NOT let it break. The fire animation on completion still makes me smile.`,
    stars: 5,
  },
  {
    name: 'Ananya Krishnan',
    handle: '@ananya.k',
    role: 'Fitness coach',
    avatar: '💪',
    text: 'I recommend this to all my clients now. The visual design is premium, the interface is clean, and it just works. My clients actually stick with it.',
    stars: 5,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} fill="var(--warm)" color="var(--warm)" />
      ))}
    </div>
  );
}

function TestimonialCard({ t, index }: { t: Testimonial; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-xl)',
        padding: '20px 18px',
        boxShadow: 'var(--glass-highlight), var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <StarRating count={t.stars} />

      <p style={{
        fontSize: 14,
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        margin: 0,
        flex: 1,
      }}>
        &ldquo;{t.text}&rdquo;
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}>
          {t.avatar}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {t.name}
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0 }}>
            {t.role} · {t.handle}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Testimonials() {
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-60px' });

  return (
    <section
      id="testimonials"
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
        <div ref={headingRef} style={{ textAlign: 'center', marginBottom: 'clamp(40px, 5vw, 60px)' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 12 }}
          >
            <span className="eyebrow">Testimonials</span>
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
            Loved by people who{' '}
            <span className="gradient-text">take their growth seriously.</span>
          </motion.h2>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
          gap: 'var(--space-4)',
        }}>
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.handle} t={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
