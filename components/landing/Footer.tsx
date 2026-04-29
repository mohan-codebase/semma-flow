'use client';

import Link from 'next/link';
import { Zap, Twitter, Github, Heart } from 'lucide-react';

const LINKS = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Changelog', href: '/changelog' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  Account: [
    { label: 'Sign in', href: '/login' },
    { label: 'Create account', href: '/signup' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        position: 'relative',
        borderTop: '1px solid var(--border-subtle)',
        padding: 'clamp(40px, 6vw, 72px) clamp(16px, 5vw, 64px) clamp(24px, 4vw, 40px)',
      }}
    >
      {/* Subtle glow at top */}
      <div style={{
        position: 'absolute',
        top: -1,
        left: '20%',
        right: '20%',
        height: 1,
        background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)',
        opacity: 0.5,
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) repeat(3, minmax(0, 1fr))',
          gap: 'clamp(32px, 4vw, 48px)',
        }}
          className="hf-footer-grid"
        >
          {/* Brand column */}
          <div>
            {/* Logo */}
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14, textDecoration: 'none' }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--r-sm)',
                background: 'var(--accent-glow-md)',
                border: '1px solid var(--border-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Zap size={14} color="var(--accent-primary)" fill="var(--accent-primary)" />
              </div>
              <span style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: "'Outfit'",
                letterSpacing: '-0.02em',
              }}>
                Semma Flow
              </span>
            </Link>

            <p style={{
              fontSize: 13.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '0 0 20px',
              maxWidth: 260,
            }}>
              The performance-grade habit tracker for builders, athletes, and lifelong learners.
            </p>

            {/* Social links */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { icon: <Twitter size={15} />, href: 'https://twitter.com', label: 'Twitter' },
                { icon: <Github size={15} />, href: 'https://github.com', label: 'GitHub' },
              ].map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--r-sm)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    transition: 'border-color 0.15s ease, color 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <p style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: "'IBM Plex Mono', monospace",
                margin: '0 0 14px',
              }}>
                {category}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      style={{
                        fontSize: 13.5,
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          marginTop: 'clamp(32px, 5vw, 56px)',
          paddingTop: 20,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <p style={{ fontSize: 12.5, color: 'var(--text-dimmed)', margin: 0 }}>
            © {year} Semma Flow. All rights reserved.
          </p>
          <p style={{
            fontSize: 12.5,
            color: 'var(--text-dimmed)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            Built with <Heart size={11} fill="var(--danger)" color="var(--danger)" /> for the relentless
          </p>
        </div>
      </div>
    </footer>
  );
}
