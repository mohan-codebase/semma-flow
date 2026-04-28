'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';

interface WeekDayData {
  date: string;
  percentage: number;
  isToday: boolean;
}

function dayLabel(d: string) {
  try { return format(parseISO(d), 'EEE'); } catch { return '---'; }
}
function fullDate(d: string) {
  try { return format(parseISO(d), 'MMM d'); } catch { return d; }
}

function barColor(pct: number): string {
  if (pct === 0)   return 'var(--bg-elevated)';
  if (pct <= 40)   return 'rgba(239,68,68,0.55)';
  if (pct <= 70)   return 'rgba(245,158,11,0.65)';
  return '#10B981';
}

export default function WeeklyOverview({ weekData }: { weekData: WeekDayData[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const maxPct = Math.max(...weekData.map((d) => d.percentage), 1);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
          This Week
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono'" }}>
          {Math.round(weekData.reduce((s, d) => s + d.percentage, 0) / (weekData.length || 1))}% avg
        </span>
      </div>

      <div className="hf-weekly-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {weekData.map((day, i) => {
          const color    = barColor(day.percentage);
          const barH     = day.percentage === 0 ? 4 : Math.max(8, Math.round((day.percentage / maxPct) * 56));
          const isHov    = hov === i;

          return (
            <div
              key={day.date}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', cursor: 'default' }}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
            >
              {/* Tooltip */}
              {isHov && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 9,
                    padding: '7px 11px',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    pointerEvents: 'none',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{fullDate(day.date)}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{day.percentage}%</p>
                </motion.div>
              )}

              {/* Bar chart column */}
              <div style={{ width: '100%', height: 64, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: barH }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.05 }}
                  style={{
                    width: '100%',
                    minHeight: 4,
                    borderRadius: 4,
                    background: day.isToday && day.percentage > 0
                      ? `linear-gradient(180deg, #34D399, #10B981)`
                      : color,
                    boxShadow: day.isToday && day.percentage > 0 ? '0 0 10px rgba(16,185,129,0.3)' : 'none',
                    transition: 'background 0.2s',
                    opacity: isHov ? 1 : 0.85,
                  }}
                />
              </div>

              {/* Day label */}
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: day.isToday ? 700 : 500,
                  color: day.isToday ? 'var(--accent-primary)' : 'var(--text-muted)',
                  letterSpacing: '0.02em',
                }}
              >
                {dayLabel(day.date)}
              </span>

              {/* Today dot */}
              {day.isToday && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-primary)', marginTop: -4 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
