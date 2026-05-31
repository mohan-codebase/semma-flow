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
    { label: 'Days', value: t.days },
    { label: 'Hours', value: t.hours },
    { label: 'Min', value: t.minutes },
    { label: 'Sec', value: t.seconds },
  ];

  return (
    <div
      style={{
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        padding: 22,
        color: '#fff',
        background: 'linear-gradient(140deg, var(--accent-primary), #9333EA 60%, #6D28D9)',
        height: '100%',
      }}
    >
      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, opacity: 0.95 }}>
        <Plane size={15} /> {tripName}
      </p>
      <p style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.85 }}>
        <CalendarDays size={13} />
        {formatDate(startDate)} – {formatDate(endDate)}
      </p>

      {t.started ? (
        <p style={{ marginTop: 20, fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
          The adventure has begun! 🏔️
        </p>
      ) : (
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {units.map((u) => (
            <div
              key={u.label}
              style={{
                background: 'rgba(255,255,255,0.16)',
                borderRadius: 12,
                padding: '12px 4px',
                textAlign: 'center',
                backdropFilter: 'blur(4px)',
              }}
            >
              <p style={{ margin: 0, fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontFamily: "'Outfit', sans-serif" }}>
                {String(u.value).padStart(2, '0')}
              </p>
              <p style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85 }}>
                {u.label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
