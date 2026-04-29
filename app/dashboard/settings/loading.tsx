import React from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function SettingsLoading() {
  return (
    <DashboardShell>
      <div
        style={{
          padding: 'clamp(12px, 2.5vw, 32px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          maxWidth: 640,
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="shimmer" style={{ height: 32, width: 140, borderRadius: 8 }} />
          <div className="shimmer" style={{ height: 12, width: 260, borderRadius: 4 }} />
        </div>

        {/* Section cards */}
        {[180, 220, 160, 100].map((h, i) => (
          <div
            key={i}
            style={{
              height: h,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 16,
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div className="shimmer" style={{ height: 18, width: 18, borderRadius: 4 }} />
              <div className="shimmer" style={{ height: 16, width: 120, borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="shimmer" style={{ height: 40, width: '100%', borderRadius: 10 }} />
              {i < 2 && <div className="shimmer" style={{ height: 40, width: '100%', borderRadius: 10 }} />}
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
