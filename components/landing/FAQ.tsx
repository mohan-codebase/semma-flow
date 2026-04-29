'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Is Semma Flow really free?',
    a: 'Yes. The free plan gives you up to 5 habits with 30-day history, basic streak tracking, and the full dashboard experience — forever. No credit card required.',
  },
  {
    q: 'Can I import habits from another app?',
    a: 'Not yet, but it\'s on the roadmap. For now, creating habits is fast (under 30 seconds per habit). CSV import is planned for the Pro tier.',
  },
  {
    q: 'What happens if I miss a day?',
    a: 'Your streak resets, but your history and total completions remain intact. On the Elite plan, you get Streak Freeze tokens (4/month) that protect a streak through one missed day.',
  },
  {
    q: 'Does Semma Flow send reminders?',
    a: 'You can set a reminder time per habit. Push notification delivery is coming soon — we\'re finalising the implementation. Email digests are planned for Pro.',
  },
  {
    q: 'Can I use it on my phone?',
    a: 'Semma Flow is fully responsive and works great on any mobile browser. A PWA install ("Add to Home Screen") is also coming soon so you can launch it like a native app.',
  },
  {
    q: 'How is my data stored?',
    a: 'Your data is stored in a Supabase Postgres database with Row-Level Security — only you can access your records. We never sell or share your personal data.',
  },
  {
    q: 'Can I track habits I don\'t do every day?',
    a: 'Absolutely. You can set habits to specific days of the week (e.g. "Mon, Wed, Fri"), or X times per week/month. Semma Flow adapts to your actual lifestyle.',
  },
  {
    q: 'Is there a team or family plan?',
    a: 'Not yet. A Teams plan with accountability groups and a manager dashboard is on our public roadmap for later this year.',
  },
];

function FAQItem({ item, index }: { item: (typeof FAQS)[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '18px 0',
          background: 'transparent',
          border: 'none',
          borderBottom: `1px solid ${open ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
          cursor: 'pointer',
          transition: 'border-color 0.2s ease',
        }}
      >
        <span style={{
          fontSize: 15,
          fontWeight: 600,
          color: open ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontFamily: "'Outfit'",
          letterSpacing: '-0.01em',
          transition: 'color 0.15s ease',
        }}>
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ flexShrink: 0 }}
        >
          <ChevronDown size={17} color={open ? 'var(--accent-primary)' : 'var(--text-muted)'} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{
              padding: '14px 0 18px',
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              margin: 0,
            }}>
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-60px' });

  return (
    <section
      id="faq"
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

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Section header */}
        <div ref={headingRef} style={{ textAlign: 'center', marginBottom: 'clamp(36px, 5vw, 56px)' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 12 }}
          >
            <span className="eyebrow">FAQ</span>
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
            Questions? <span className="gradient-text">Answered.</span>
          </motion.h2>
        </div>

        {/* Accordion */}
        <div>
          {FAQS.map((item, i) => (
            <FAQItem key={item.q} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
