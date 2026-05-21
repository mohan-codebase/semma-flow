'use client';

import { ClipboardList, Construction } from 'lucide-react';

export default function WeeklyReviewPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <ClipboardList size={32} color="#F59E0B" />
      </div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Weekly Review</h1>
      <p style={{ margin: '0 0 24px', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Structured weekly retrospective combining habits, goals, and expenses.<br />Coming soon.
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: 13, fontWeight: 600 }}>
        <Construction size={14} /> In Development
      </div>
    </div>
  );
}
