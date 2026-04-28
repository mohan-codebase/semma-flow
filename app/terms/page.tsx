'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';

const EFFECTIVE_DATE = 'April 28, 2026';

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
              borderRadius: 'var(--r-lg)', borderLeft: '3px solid var(--indigo)',
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

const TERMS_SECTIONS = [
  {
    id: 'acceptance', title: '1. Acceptance of Terms',
    content: 'By accessing or using HabitForge ("Service", "we", "our", "us"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you may not use the Service. We may update these Terms at any time; continued use constitutes acceptance of the updated Terms.',
  },
  {
    id: 'eligibility', title: '2. Eligibility',
    content: 'You must be at least 13 years old to use HabitForge. By using the Service, you represent that you meet this requirement. If you are under 18, you represent that you have your parent or guardian\'s permission.',
  },
  {
    id: 'account', title: '3. Account Registration',
    items: [
      { subtitle: 'Accuracy', text: 'You must provide accurate information when creating an account.' },
      { subtitle: 'Security', text: 'You are responsible for maintaining the confidentiality of your password and for all activity under your account.' },
      { subtitle: 'Notification of breach', text: 'You must notify us immediately at support@habitforge.app if you suspect unauthorised access to your account.' },
      { subtitle: 'One account per person', text: 'You may not create multiple accounts to circumvent any limitations or restrictions.' },
    ],
  },
  {
    id: 'acceptable-use', title: '4. Acceptable Use',
    content: 'You agree not to:',
    items: [
      { subtitle: 'Misuse the Service', text: 'Use the Service for any unlawful purpose, or in violation of any applicable laws or regulations.' },
      { subtitle: 'Automated access', text: 'Scrape, crawl, or use bots to access the Service without our prior written consent.' },
      { subtitle: 'Interference', text: 'Attempt to disrupt, disable, or impair the security or integrity of the Service or its servers.' },
      { subtitle: 'Impersonation', text: 'Impersonate any person or entity, or falsely represent your affiliation with any person or entity.' },
      { subtitle: 'IP violations', text: 'Upload or transmit content that infringes any intellectual property or privacy rights of any third party.' },
    ],
  },
  {
    id: 'intellectual-property', title: '5. Intellectual Property',
    content: 'The Service and its original content, features, and functionality are owned by HabitForge and are protected by international copyright, trademark, and other intellectual property laws. You retain ownership of the data you input (your habits and entries). You grant us a limited, non-exclusive licence to store and process your data solely to provide the Service.',
  },
  {
    id: 'subscription', title: '6. Subscriptions & Payments',
    content: 'HabitForge currently offers a free tier with all core features included. If we introduce paid plans in the future, the following will apply:',
    items: [
      { subtitle: 'Billing', text: 'Subscriptions are billed in advance on a monthly or annual basis. All fees are exclusive of applicable taxes.' },
      { subtitle: 'Cancellation', text: 'You may cancel your subscription at any time. Your access to paid features continues until the end of the current billing period.' },
      { subtitle: 'Refunds', text: 'We offer a 14-day money-back guarantee for first-time paid subscribers, no questions asked. After 14 days, payments are non-refundable.' },
      { subtitle: 'Price changes', text: 'We reserve the right to change pricing with 30 days\' notice via email or in-app notification.' },
    ],
  },
  {
    id: 'disclaimers', title: '7. Disclaimers',
    content: 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.',
  },
  {
    id: 'limitation', title: '8. Limitation of Liability',
    content: 'TO THE FULLEST EXTENT PERMITTED BY LAW, HABITFORGE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL — ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF £50 GBP OR THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRIOR TO THE CLAIM.',
  },
  {
    id: 'termination', title: '9. Termination',
    content: 'We reserve the right to suspend or terminate your account at our sole discretion, without notice, if you violate these Terms or for any other reason. You may delete your account at any time from the Settings page. Upon termination, all licences granted to you immediately cease, and we will delete your data in accordance with our Privacy Policy.',
  },
  {
    id: 'governing-law', title: '10. Governing Law',
    content: 'These Terms are governed by and construed in accordance with the laws of England and Wales, without regard to conflict-of-law principles. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.',
  },
  {
    id: 'changes-terms', title: '11. Changes to These Terms',
    content: 'We may revise these Terms at any time. If the changes are material, we will notify you via email or an in-app notice at least 14 days before they take effect. Your continued use of the Service after changes are effective constitutes your agreement to the revised Terms.',
  },
  {
    id: 'contact-terms', title: '12. Contact',
    content: 'For questions about these Terms:',
    footer: 'legal@habitforge.app',
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <PageHero
          badge="Legal"
          title="Terms of Service"
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
              {TERMS_SECTIONS.map(s => (
                <li key={s.id}>
                  <a href={`#${s.id}`} style={{ fontSize: 13.5, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--indigo)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          {TERMS_SECTIONS.map(s => <Section key={s.id} {...s} />)}

          {/* Footer nav */}
          <div style={{ paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Link href="/" style={{ fontSize: 13.5, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>← Back to home</Link>
            <Link href="/privacy" style={{ fontSize: 13.5, color: 'var(--text-muted)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>Privacy Policy →</Link>
          </div>
        </div>
      </main>
    </>
  );
}
