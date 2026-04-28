import React from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

/**
 * Premium dashboard skeleton shell.
 * Mimics the layout of the dashboard to prevent layout shifts.
 */
export default function DashboardLoading() {
  return (
    <DashboardShell>
      <div
        style={{
          padding: 'clamp(12px, 2.5vw, 32px) clamp(12px, 2.5vw, 32px) clamp(32px, 4vw, 48px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(16px, 2vw, 24px)',
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        {/* Header Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="shimmer" style={{ height: 12, width: 140, borderRadius: 4 }} />
          <div className="shimmer" style={{ height: 32, width: '60%', maxWidth: 400, borderRadius: 8 }} />
        </div>

        {/* Banner Skeleton */}
        <div className="shimmer" style={{ height: 160, width: '100%', borderRadius: 24, opacity: 0.6 }} />

        {/* Stats Grid Skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 124,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-xl)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="shimmer" style={{ height: 10, width: '45%', borderRadius: 4, marginBottom: 20 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="shimmer" style={{ height: 40, width: 40, borderRadius: 'var(--r-md)', flexShrink: 0 }} />
                  <div className="shimmer" style={{ height: 32, width: '40%', borderRadius: 8 }} />
                </div>
              </div>
              <div className="shimmer" style={{ height: 12, width: '60%', borderRadius: 4, marginTop: 12 }} />
            </div>
          ))}
        </div>

        {/* 2-Column Main Layout Skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: 'clamp(16px, 2vw, 24px)',
            alignItems: 'start',
          }}
          className="hf-dashboard-grid"
        >
          {/* Left Column: Habits + Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2vw, 24px)' }}>
            <div className="shimmer" style={{ height: 400, width: '100%', borderRadius: 24, opacity: 0.4 }} />
            <div className="shimmer" style={{ height: 300, width: '100%', borderRadius: 24, opacity: 0.4 }} />
          </div>

          {/* Right Column: Feed + Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2vw, 24px)' }}>
            <div className="shimmer" style={{ height: 260, width: '100%', borderRadius: 24, opacity: 0.5 }} />
            <div className="shimmer" style={{ height: 340, width: '100%', borderRadius: 24, opacity: 0.5 }} />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .hf-dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </DashboardShell>
  );
}
