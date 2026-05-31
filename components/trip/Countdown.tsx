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
    { label: 'd', value: t.days },
    { label: 'h', value: t.hours },
    { label: 'm', value: t.minutes },
    { label: 's', value: t.seconds },
  ];

  return (
    <div
      style={{
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        padding: 16,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 14,
      }}
    >
      <div>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
          <Plane size={14} color="var(--accent-light)" /> {tripName}
        </p>
        <p style={{ margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <CalendarDays size={12} />
          {formatDate(startDate)} – {formatDate(endDate)}
        </p>
      </div>

      {t.started ? (
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--accent-light)' }}>
          The adventure has begun 🏔️
        </p>
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          {units.map((u) => (
            <span key={u.label} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', fontFamily: "'Outfit', sans-serif" }}>
                {String(u.value).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
