'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Plane } from 'lucide-react';
import { formatDate } from '@/lib/trip/format';
import { useTheme } from '@/components/ui/ThemeProvider';

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
  const { theme } = useTheme();

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
      color: 'var(--pink)', 
      glow: 'rgba(147, 147, 147, 0.25)',
      gradient: 'linear-gradient(135deg, var(--text-primary) 20%, var(--pink) 100%)',
      bg: 'color-mix(in srgb, var(--pink) 6%, transparent)',
      hoverBg: 'color-mix(in srgb, var(--pink) 12%, transparent)',
      border: 'color-mix(in srgb, var(--pink) 25%, transparent)'
    },
    { 
      label: 'Hours', 
      value: t.hours, 
      color: 'var(--indigo)', 
      glow: 'rgba(153, 153, 153, 0.25)',
      gradient: 'linear-gradient(135deg, var(--text-primary) 20%, var(--indigo) 100%)',
      bg: 'color-mix(in srgb, var(--indigo) 6%, transparent)',
      hoverBg: 'color-mix(in srgb, var(--indigo) 12%, transparent)',
      border: 'color-mix(in srgb, var(--indigo) 25%, transparent)'
    },
    { 
      label: 'Mins', 
      value: t.minutes, 
      color: 'var(--cyan)', 
      glow: 'rgba(175, 175, 175, 0.25)',
      gradient: 'linear-gradient(135deg, var(--text-primary) 20%, var(--cyan) 100%)',
      bg: 'color-mix(in srgb, var(--cyan) 6%, transparent)',
      hoverBg: 'color-mix(in srgb, var(--cyan) 12%, transparent)',
      border: 'color-mix(in srgb, var(--cyan) 25%, transparent)'
    },
    { 
      label: 'Secs', 
      value: t.seconds, 
      color: 'var(--warm)', 
      glow: 'rgba(183, 183, 183, 0.25)',
      gradient: 'linear-gradient(135deg, var(--text-primary) 20%, var(--warm) 100%)',
      bg: 'color-mix(in srgb, var(--warm) 6%, transparent)',
      hoverBg: 'color-mix(in srgb, var(--warm) 12%, transparent)',
      border: 'color-mix(in srgb, var(--warm) 25%, transparent)'
    },
  ];

  const isDark = theme === 'dark';

  return (
    <div
      style={{
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border-medium)',
        background: 'linear-gradient(170deg, var(--bg-secondary) 0%, rgba(85, 85, 85, 0.05) 100%)',
        padding: 16,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 14,
        boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.25)' : 'var(--shadow-md)',
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
          height: '2.5px',
          background: 'linear-gradient(90deg, var(--pink), var(--accent-light), var(--cyan), var(--warm))',
        }}
      />

      <div>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
          <Plane size={15} style={{ color: 'var(--accent-primary)', transform: 'rotate(45deg)' }} /> {tripName}
        </p>
        <p style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <CalendarDays size={13} style={{ color: 'var(--text-muted)' }} />
          {formatDate(startDate)} – {formatDate(endDate)}
        </p>
      </div>

      {t.started ? (
        <p style={{ margin: '8px 0', fontSize: 14.5, fontWeight: 700, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Outfit', sans-serif" }}>
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
                boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.12)' : '0 2px 6px rgba(85, 85, 85, 0.04)',
                transition: 'border-color 0.2s ease, background 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = u.color;
                e.currentTarget.style.background = u.hoverBg;
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                e.currentTarget.style.boxShadow = `0 4px 14px ${u.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = u.border;
                e.currentTarget.style.background = u.bg;
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = isDark ? '0 2px 8px rgba(0, 0, 0, 0.12)' : '0 2px 6px rgba(85, 85, 85, 0.04)';
              }}
            >
              <span
                style={{
                  fontSize: '26px',
                  fontWeight: 850,
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: "'Outfit', sans-serif",
                  background: isDark ? u.gradient : 'none',
                  WebkitBackgroundClip: isDark ? 'text' : 'unset',
                  WebkitTextFillColor: isDark ? 'transparent' : 'unset',
                  color: isDark ? undefined : u.color,
                  lineHeight: 1.1,
                  display: 'inline-block',
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
