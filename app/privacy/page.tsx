'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';

const EFFECTIVE_DATE = 'April 28, 2026';

/* ─── Shared layout primitives ─────────────────────────────────── */

function PageHero({ badge, title, subtitle }: { badge: string; title: string; subtitle: React.ReactNode }) {
  return (
    <div style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'linear-gradient(to bottom, var(--bg-secondary), var(--bg-primary))',
      padding: 'clamp(80px, 10vw, 120px) clamp(16px, 5vw, 64px) clamp(36px, 5vw, 56px)',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <span style={{
          display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--accent-primary)', fontFamily: "'IBM Plex Mono', monospace",
          padding: '5px 14px', borderRadius: 100, border: '1px solid var(--border-accent)',
          background: 'var(--accent-glow)', marginBottom: 20,
        }}>{badge}</span>
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'var(--text-primary)',
          fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 14px',
        }}>{title}</h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{subtitle}</p>
      </div>
    </div>
  );
}

function Section({ id, title, content, items, footer }: {
  id: string; title: string; content?: string;
  items?: { subtitle: string; text: string }[]; footer?: string;
}) {
  return (
    <section id={id} style={{ scrollMarginTop: 88 }}>
      <h2 style={{
        fontSize: 'clamp(17px, 2vw, 20px)', fontWeight: 700, color: 'var(--text-primary)',
        fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em', margin: '0 0 14px',
      }}>{title}</h2>
      {content && <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.75, margin: items ? '0 0 16px' : 0 }}>{content}</p>}
      {items && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(item => (
            <div key={item.subtitle} style={{
              padding: '14px 18px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--r-lg)', borderLeft: '3px solid var(--accent-primary)',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", margin: '0 0 5px' }}>{item.subtitle}</p>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{item.text}</p>
            </div>
          ))}
        </div>
      )}
      {footer && (
        <p style={{
          fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.65, marginTop: 14,
          padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--r-md)',
          border: '1px solid var(--border-subtle)',
        }}>{footer}</p>
      )}
    </section>
  );
}

const PRIVACY_SECTIONS = [
  {
    id: 'overview', title: '1. Overview',
    content: 'HabitForge ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. If you disagree with its terms, please discontinue use of the Service.',
  },
  {
    id: 'data-collected', title: '2. Information We Collect',
    items: [
      { subtitle: 'Account Information', text: 'Email address and optional display name. Passwords are never stored in plaintext — authentication is handled by Supabase with bcrypt hashing.' },
      { subtitle: 'Habit & Entry Data', text: 'Habits you create (name, icon, colour, category, reminder time) and daily check-in entries (date, completion status, optional notes).' },
      { subtitle: 'Push Notification Tokens', text: 'If you opt in, we store your browser push subscription endpoint and encryption keys. These are used solely to deliver habit reminders and deleted on unsubscribe.' },
      { subtitle: 'Usage Analytics', text: 'Anonymised, aggregate usage data only. We do not use Google Analytics or build advertising profiles.' },
      { subtitle: 'Device & Browser', text: 'User-agent string for debugging. We do not track cross-site behaviour.' },
    ],
  },
  {
    id: 'data-use', title: '3. How We Use Your Information',
    items: [
      { subtitle: 'Provide the Service', text: 'Authentication, habit display, streak and analytics computation.' },
      { subtitle: 'Reminders', text: 'Sending push notifications at your configured times, if opted in.' },
      { subtitle: 'Product Improvement', text: 'Understanding aggregate usage patterns. We never sell your data.' },
      { subtitle: 'Security', text: 'Detecting and preventing fraud, abuse, and unauthorised access.' },
      { subtitle: 'Legal Compliance', text: 'Complying with applicable laws and lawful government requests.' },
    ],
  },
  {
    id: 'data-sharing', title: '4. Data Sharing & Third Parties',
    content: 'We do not sell, trade, or rent your personal information. We use the following sub-processors:',
    items: [
      { subtitle: 'Supabase', text: 'Database hosting and authentication. Data stored in the EU (Frankfurt). See supabase.com/privacy.' },
      { subtitle: 'Vercel', text: 'Application hosting. See vercel.com/legal/privacy-policy.' },
      { subtitle: 'Browser Push Services', text: "Push notifications route through the browser vendor's push service (FCM/APNs). We only send encrypted payloads." },
    ],
  },
  {
    id: 'data-retention', title: '5. Data Retention',
    content: 'We retain your data for as long as your account is active. On account deletion, all data is permanently removed within 30 days. Anonymised aggregate metrics may be retained indefinitely.',
  },
  {
    id: 'your-rights', title: '6. Your Rights',
    content: 'Depending on your jurisdiction (GDPR, CCPA, etc.) you may have the right to:',
    items: [
      { subtitle: 'Access', text: 'Request a copy of all personal data we hold about you.' },
      { subtitle: 'Correction', text: 'Request correction of inaccurate data.' },
      { subtitle: 'Deletion', text: 'Request deletion of your account and all associated data.' },
      { subtitle: 'Portability', text: 'Export your habits and entries in JSON format.' },
      { subtitle: 'Objection', text: 'Object to processing for certain purposes.' },
    ],
    footer: 'To exercise any right, email privacy@habitforge.app. We respond within 30 days.',
  },
  {
    id: 'cookies', title: '7. Cookies & Local Storage',
    content: 'HabitForge uses the following browser storage:',
    items: [
      { subtitle: 'Auth Cookies', text: 'Supabase sets a secure, HttpOnly session cookie to keep you logged in.' },
      { subtitle: 'Preferences (localStorage)', text: 'Theme and onboarding state. These never leave your device.' },
      { subtitle: 'Push State (localStorage)', text: 'Subscription status cached locally to avoid unnecessary prompts.' },
    ],
    footer: 'We do not use third-party advertising or tracking cookies.',
  },
  {
    id: 'security', title: '8. Security',
    content: 'We use TLS in transit, Row Level Security (RLS) on all database tables, regular dependency auditing, and VAPID-authenticated Web Push. No internet transmission is 100% secure — we cannot guarantee absolute security.',
  },
  {
    id: 'children', title: "9. Children's Privacy",
    content: 'The Service is not directed at children under 13. We do not knowingly collect data from children under 13. Contact privacy@habitforge.app immediately if you believe a child has registered.',
  },
  {
    id: 'changes', title: '10. Changes to This Policy',
    content: 'We may update this policy. Material changes will be communicated via email or in-app banner. Continued use after changes constitutes acceptance.',
  },
  {
    id: 'contact', title: '11. Contact',
    content: 'For privacy questions or data requests:',
    footer: 'privacy@habitforge.app',
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <PageHero
          badge="Legal"
          title="Privacy Policy"
          subtitle={<>Effective date: <strong style={{ color: 'var(--text-primary)' }}>{EFFECTIVE_DATE}</strong></>}
        />

        <div style={{
          maxWidth: 800, margin: '0 auto',
          padding: 'clamp(40px, 6vw, 72px) clamp(16px, 5vw, 40px)',
          display: 'flex', flexDirection: 'column', gap: 48,
        }}>
          {/* TOC */}
          <nav aria-label="Contents" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-xl)', padding: '22px 26px', boxShadow: 'var(--glass-highlight)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", margin: '0 0 12px' }}>Contents</p>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRIVACY_SECTIONS.map(s => (
                <li key={s.id}>
                  <a href={`#${s.id}`} style={{ fontSize: 13.5, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          {PRIVACY_SECTIONS.map(s => <Section key={s.id} {...s} />)}

          {/* Footer nav */}
          <div style={{ paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Link href="/" style={{ fontSize: 13.5, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>← Back to home</Link>
            <Link href="/terms" style={{ fontSize: 13.5, color: 'var(--text-muted)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>Terms of Service →</Link>
          </div>
        </div>
      </main>
    </>
  );
}
