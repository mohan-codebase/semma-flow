'use client';

import { BookOpen, Construction } from 'lucide-react';

export default function JournalPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <BookOpen size={32} color="#8B5CF6" />
      </div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Daily Journal</h1>
      <p style={{ margin: '0 0 24px', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        End-of-day reflections, mood tracking, and gratitude entries.<br />Coming soon.
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontSize: 13, fontWeight: 600 }}>
        <Construction size={14} /> In Development
      </div>
    </div>
  );
}
