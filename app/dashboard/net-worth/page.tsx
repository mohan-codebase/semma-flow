'use client';

import { TrendingUp, Construction } from 'lucide-react';

export default function NetWorthPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <TrendingUp size={32} color="#10B981" />
      </div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Net Worth Tracker</h1>
      <p style={{ margin: '0 0 24px', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Track assets, liabilities, and net worth growth over time.<br />Coming soon.
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 13, fontWeight: 600 }}>
        <Construction size={14} /> In Development
      </div>
    </div>
  );
}
