import React from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function HabitsLoading() {
  return (
    <DashboardShell>
      <div
        style={{
          padding: 'clamp(12px, 2.5vw, 32px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(16px, 2vw, 24px)',
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="shimmer" style={{ height: 12, width: 120, borderRadius: 4 }} />
            <div className="shimmer" style={{ height: 32, width: 200, borderRadius: 8 }} />
          </div>
          <div className="shimmer" style={{ height: 38, width: 120, borderRadius: 10 }} />
        </div>

        {/* Habit cards */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 80,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--r-xl)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div className="shimmer" style={{ height: 40, width: 40, borderRadius: 'var(--r-md)', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="shimmer" style={{ height: 14, width: '40%', borderRadius: 4 }} />
              <div className="shimmer" style={{ height: 10, width: '25%', borderRadius: 4 }} />
            </div>
            <div className="shimmer" style={{ height: 32, width: 32, borderRadius: '50%', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
