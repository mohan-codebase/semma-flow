import React from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function AchievementsLoading() {
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="shimmer" style={{ height: 12, width: 130, borderRadius: 4 }} />
          <div className="shimmer" style={{ height: 32, width: 240, borderRadius: 8 }} />
        </div>

        {/* Achievement grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                height: 140,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-xl)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="shimmer" style={{ height: 44, width: 44, borderRadius: 'var(--r-md)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="shimmer" style={{ height: 14, width: '70%', borderRadius: 4, marginBottom: 8 }} />
                  <div className="shimmer" style={{ height: 10, width: '50%', borderRadius: 4 }} />
                </div>
              </div>
              <div className="shimmer" style={{ height: 6, width: '100%', borderRadius: 99 }} />
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
