'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16"
      style={{
        background: 'var(--bg-glass-strong)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="p-1.5 rounded-lg" style={{ background: 'var(--accent-glow-md)', border: '1px solid var(--border-accent)' }}>
          <Zap size={16} style={{ color: 'var(--accent-primary)' }} fill="var(--accent-primary)" />
        </div>
        <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display, inherit)' }}>
          HabitForge
        </span>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link href="/login">
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Sign In
          </button>
        </Link>
        <Link href="/signup">
          <button
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: 'var(--accent-primary)',
              color: 'var(--accent-on-primary)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-primary)')}
          >
            Get Started Free
          </button>
        </Link>
      </div>
    </nav>
  );
}
