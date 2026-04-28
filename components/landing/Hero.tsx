'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, ArrowRight, Shield, Activity, Star } from 'lucide-react';

export default function Hero() {
  // Prevent Framer Motion from flashing invisible on SSR hydration.
  // On first render (server + hydration), skip the initial animation state.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-primary)] p-6">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent-glow)] rounded-full blur-[120px] opacity-20 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--cyan)] rounded-full blur-[120px] opacity-10" />

      <motion.div
        initial={mounted ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl text-center"
      >
        {/* Badge */}
        <motion.div
          initial={mounted ? { opacity: 0, scale: 0.9 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[13px] font-medium text-[var(--accent-primary)] mb-8"
        >
          <Star size={14} fill="var(--accent-primary)" />
          <span>The Next-Gen Performance Engine</span>
        </motion.div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--text-primary)] mb-6 font-display">
          Forge Habits for <br />
          <span className="gradient-text">Peak Performance</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
          HabitForge is the high-performance OS for your life. Build elite routines, track progress with precision, and achieve total discipline.
        </p>

        {/* CTA Section */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-on-primary)] font-bold text-lg flex items-center gap-2 shadow-[0_0_20px_rgba(16,229,176,0.2)]"
            >
              Get Started Free
              <ArrowRight size={20} />
            </motion.button>
          </Link>
          <Link href="/login">
            <button className="px-8 py-4 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold text-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors">
              Sign In
            </button>
          </Link>
        </div>

        {/* Social Proof / Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-3xl mx-auto border-t border-[var(--border-subtle)] pt-12">
          <div className="flex gap-4 items-start">
            <div className="p-2 rounded-lg bg-[var(--accent-glow-md)] border border-[var(--border-accent)]">
              <Zap size={20} className="text-[var(--accent-primary)]" />
            </div>
            <div>
              <h3 className="text-[var(--text-primary)] font-semibold mb-1">Ultra-Fast</h3>
              <p className="text-[var(--text-dimmed)] text-sm">Real-time sync across all your devices.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <Shield size={20} className="text-[var(--cyan)]" />
            </div>
            <div>
              <h3 className="text-[var(--text-primary)] font-semibold mb-1">Privacy First</h3>
              <p className="text-[var(--text-dimmed)] text-sm">Your data is encrypted and secure.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <Activity size={20} className="text-[var(--purple)]" />
            </div>
            <div>
              <h3 className="text-[var(--text-primary)] font-semibold mb-1">Deep Insights</h3>
              <p className="text-[var(--text-dimmed)] text-sm">Advanced analytics on your habits.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 w-full h-[30vh] bg-gradient-to-t from-[var(--bg-primary)] to-transparent pointer-events-none" />
    </div>
  );
}
