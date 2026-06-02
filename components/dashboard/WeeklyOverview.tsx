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
  if (pct <= 40)   return 'rgba(104, 104, 104,0.55)';
  if (pct <= 70)   return 'rgba(166, 166, 166,0.65)';
  return 'var(--accent-primary)';
}

const CHART_H = 88;
const GRID_LINES = [25, 50, 75, 100];

export default function WeeklyOverview({ weekData }: { weekData: WeekDayData[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const maxPct = Math.max(...weekData.map((d) => d.percentage), 1);
  const avgPct = Math.round(weekData.reduce((s, d) => s + d.percentage, 0) / (weekData.length || 1));

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: '20px 20px 16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            7-Day Overview
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {weekData[0] ? `${fullDate(weekData[0].date)} – ${fullDate(weekData[weekData.length - 1].date)}` : 'This week'}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: avgPct >= 70 ? 'var(--accent-glow)' : avgPct >= 40 ? 'var(--indigo-glow)' : 'var(--bg-tertiary)',
          border: `1px solid ${avgPct >= 70 ? 'color-mix(in srgb, var(--accent-primary) 25%, transparent)' : 'var(--border-subtle)'}`,
          borderRadius: 8,
        }}>
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: avgPct >= 70 ? 'var(--accent-primary)' : avgPct >= 40 ? 'var(--indigo)' : 'var(--text-secondary)',
            fontFamily: "'IBM Plex Mono'",
            letterSpacing: '-0.02em',
          }}>
            {avgPct}%
          </span>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>avg</span>
        </div>
      </div>

      {/* Chart area with grid lines */}
      <div style={{ position: 'relative' }}>
        {/* Horizontal grid lines */}
        {GRID_LINES.map((line) => (
          <div
            key={line}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 28 + (line / 100) * CHART_H,
              height: 1,
              background: 'var(--border-subtle)',
              opacity: 0.5,
              pointerEvents: 'none',
            }}
          />
        ))}

        <div className="hf-weekly-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {weekData.map((day, i) => {
            const color    = barColor(day.percentage);
            const barH     = day.percentage === 0 ? 3 : Math.max(6, Math.round((day.percentage / 100) * CHART_H));
            const isHov    = hov === i;

            return (
              <div
                key={day.date}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative', cursor: 'default' }}
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
              >
                {/* Tooltip */}
                {isHov && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      whiteSpace: 'nowrap',
                      zIndex: 10,
                      pointerEvents: 'none',
                    }}
                  >
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{fullDate(day.date)}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{day.percentage}%</p>
                  </motion.div>
                )}

                {/* Bar chart column */}
                <div style={{ width: '100%', height: CHART_H, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
                  {/* Percentage label above bar */}
                  {day.percentage > 0 && (
                    <span style={{
                      position: 'absolute',
                      bottom: barH + 4,
                      fontSize: 9,
                      fontWeight: 700,
                      color: day.isToday ? 'var(--accent-primary)' : 'var(--text-dimmed)',
                      fontFamily: "'IBM Plex Mono'",
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                    }}>
                      {day.percentage}
                    </span>
                  )}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: barH }}
                    transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.06 }}
                    style={{
                      width: '80%',
                      minHeight: 3,
                      borderRadius: '4px 4px 2px 2px',
                      background: day.isToday && day.percentage > 0
                        ? `linear-gradient(180deg, var(--accent-light), var(--accent-primary))`
                        : color,
                      boxShadow: day.isToday && day.percentage > 0
                        ? '0 0 12px color-mix(in srgb, var(--accent-primary) 35%, transparent)'
                        : isHov ? '0 0 8px rgba(255, 255, 255,0.08)' : 'none',
                      transition: 'background 0.2s, box-shadow 0.2s',
                      opacity: isHov ? 1 : day.isToday ? 1 : 0.8,
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
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-primary)', marginTop: -2 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
