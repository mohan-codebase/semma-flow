'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Plane } from 'lucide-react';
import { formatDate } from '@/lib/trip/format';

function diff(target: Date) {
  const ms = target.getTime() - Date.now();
  const clamped = Math.max(ms, 0);
  return {
    started: ms <= 0,
    days: Math.floor(clamped / 86_400_000),
    hours: Math.floor((clamped / 3_600_000) % 24),
    minutes: Math.floor((clamped / 60_000) % 60),
    seconds: Math.floor((clamped / 1000) % 60),
  };
}

export default function Countdown({
  startDate,
  endDate,
  tripName,
}: {
  startDate: string;
  endDate: string;
  tripName: string;
}) {
  const target = new Date(`${startDate}T00:00:00`);
  // Stable placeholder until mount to avoid hydration mismatch.
  const [t, setT] = useState({ started: false, days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate]);

  const units = [
    { 
      label: 'Days', 
      value: t.days, 
      color: '#F472B6', 
      glow: 'rgba(244, 114, 182, 0.25)',
      gradient: 'linear-gradient(135deg, #FFFFFF 20%, #F472B6 100%)',
      bg: 'rgba(244, 114, 182, 0.04)',
      border: 'rgba(244, 114, 182, 0.2)'
    },
    { 
      label: 'Hours', 
      value: t.hours, 
      color: '#A78BFA', 
      glow: 'rgba(167, 139, 250, 0.25)',
      gradient: 'linear-gradient(135deg, #FFFFFF 20%, #A78BFA 100%)',
      bg: 'rgba(167, 139, 250, 0.04)',
      border: 'rgba(167, 139, 250, 0.2)'
    },
    { 
      label: 'Mins', 
      value: t.minutes, 
      color: '#22D3EE', 
      glow: 'rgba(34, 211, 238, 0.25)',
      gradient: 'linear-gradient(135deg, #FFFFFF 20%, #22D3EE 100%)',
      bg: 'rgba(34, 211, 238, 0.04)',
      border: 'rgba(34, 211, 238, 0.2)'
    },
    { 
      label: 'Secs', 
      value: t.seconds, 
      color: '#FCA5A5', 
      glow: 'rgba(252, 165, 165, 0.25)',
      gradient: 'linear-gradient(135deg, #FFFFFF 20%, #FCA5A5 100%)',
      bg: 'rgba(252, 165, 165, 0.04)',
      border: 'rgba(252, 165, 165, 0.2)'
    },
  ];

  return (
    <div
      style={{
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border-medium)',
        background: 'linear-gradient(170deg, var(--bg-secondary) 0%, rgba(124, 58, 237, 0.05) 100%)',
        padding: 16,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 14,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle colorful top highlight decoration */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #F472B6, #A78BFA, #22D3EE, #FCA5A5)',
        }}
      />

      <div>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
          <Plane size={15} style={{ color: 'var(--accent-light)', transform: 'rotate(45deg)' }} /> {tripName}
        </p>
        <p style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <CalendarDays size={13} style={{ color: 'var(--text-muted)' }} />
          {formatDate(startDate)} – {formatDate(endDate)}
        </p>
      </div>

      {t.started ? (
        <p style={{ margin: '8px 0', fontSize: 14.5, fontWeight: 700, color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Outfit', sans-serif" }}>
          The adventure has begun 🏔️
        </p>
      ) : (
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          {units.map((u) => (
            <div
              key={u.label}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 4px',
                borderRadius: '12px',
                background: u.bg,
                border: `1px solid ${u.border}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                transition: 'border-color 0.2s ease, background 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = u.color;
                e.currentTarget.style.background = u.bg.replace('0.04', '0.09');
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                e.currentTarget.style.boxShadow = `0 4px 14px ${u.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = u.border;
                e.currentTarget.style.background = u.bg;
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.12)';
              }}
            >
              <span
                style={{
                  fontSize: '26px',
                  fontWeight: 850,
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: "'Outfit', sans-serif",
                  background: u.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1,
                }}
              >
                {String(u.value).padStart(2, '0')}
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: u.color,
                  marginTop: '4px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  opacity: 0.85,
                }}
              >
                {u.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
