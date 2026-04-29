import React from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function AnalyticsLoading() {
  return (
    <DashboardShell>
      <div
        style={{
          padding: 'clamp(12px, 2.5vw, 32px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(16px, 2vw, 24px)',
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="shimmer" style={{ height: 12, width: 120, borderRadius: 4 }} />
          <div className="shimmer" style={{ height: 32, width: 220, borderRadius: 8 }} />
        </div>

        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 100,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-xl)',
                padding: '16px 20px',
              }}
            >
              <div className="shimmer" style={{ height: 10, width: '50%', borderRadius: 4, marginBottom: 16 }} />
              <div className="shimmer" style={{ height: 28, width: '60%', borderRadius: 8 }} />
            </div>
          ))}
        </div>

        {/* Chart blocks */}
        <div className="shimmer" style={{ height: 320, width: '100%', borderRadius: 24, opacity: 0.5 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="hf-analytics-grid">
          <div className="shimmer" style={{ height: 260, borderRadius: 24, opacity: 0.5 }} />
          <div className="shimmer" style={{ height: 260, borderRadius: 24, opacity: 0.5 }} />
        </div>
        <div className="shimmer" style={{ height: 240, width: '100%', borderRadius: 24, opacity: 0.4 }} />
      </div>

      <style>{`
        @media (max-width: 767px) {
          .hf-analytics-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardShell>
  );
}
