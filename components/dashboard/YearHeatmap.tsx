'use client';

import React, { useMemo, useRef, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { toLocalDateString } from '@/lib/utils/dates';

export interface HeatmapDay {
  date: string;   // YYYY-MM-DD
  count: number;  // completed entries that day
}

interface HeatmapDayRich extends HeatmapDay {
  titleStr: string;
  hoverStr: string;
}

interface YearHeatmapProps {
  data: HeatmapDay[];
  totalDays?: number;  // default 365
}

const CELL = 11;
const GAP  = 3;
const RADIUS = 2;

function levelFor(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (max <= 1)    return 4;
  const pct = count / max;
  if (pct < 0.25) return 1;
  if (pct < 0.5)  return 2;
  if (pct < 0.75) return 3;
  return 4;
}

const levelColor: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'var(--bg-tertiary)',
  1: 'rgba(16,229,176,0.22)',
  2: 'rgba(16,229,176,0.40)',
  3: 'rgba(16,229,176,0.65)',
  4: 'var(--accent-primary)',
};

const HOVER_DEFAULT = 'Hover a day to see details';

function HeatmapSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="shimmer" style={{ height: 16, width: 140, borderRadius: 4 }} />
        <div className="shimmer" style={{ height: 12, width: 180, borderRadius: 4 }} />
      </div>
      <div style={{ overflow: 'hidden' }}>
        <div
          className="shimmer"
          style={{
            height: 110,
            width: '100%',
            borderRadius: 8,
            opacity: 0.25,
            background: 'linear-gradient(90deg, transparent 0%, var(--bg-tertiary) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      </div>
    </div>
  );
}

export default function YearHeatmap({ data, totalDays = 365 }: YearHeatmapProps) {
  const readoutRef = useRef<HTMLDivElement>(null);

  const grid = useMemo(() => {
    const byDate = new Map(data.map((d) => [d.date, d.count]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: HeatmapDayRich[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = toLocalDateString(d);
      const count = byDate.get(iso) ?? 0;
      days.push({
        date: iso,
        count,
        titleStr: `${format(d, 'MMM d, yyyy')} · ${count} check-in${count === 1 ? '' : 's'}`,
        hoverStr: `${format(d, 'EEE, MMM d yyyy')} · ${count} check-in${count === 1 ? '' : 's'}`,
      });
    }

    const firstDow = parseISO(days[0].date).getDay();
    const padStart = Array.from({ length: firstDow }, () => null as HeatmapDayRich | null);
    const cells: (HeatmapDayRich | null)[] = [...padStart, ...days];
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (HeatmapDayRich | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, [data, totalDays]);

  const handleEnter = useCallback((hoverStr: string) => {
    if (readoutRef.current) readoutRef.current.textContent = hoverStr;
  }, []);
  const handleLeave = useCallback(() => {
    if (readoutRef.current) readoutRef.current.textContent = HOVER_DEFAULT;
  }, []);

  const max = useMemo(() => data.reduce((m, d) => (d.count > m ? d.count : m), 0), [data]);
  const total = useMemo(() => data.reduce((s, d) => s + d.count, 0), [data]);
  const activeDays = useMemo(() => data.filter((d) => d.count > 0).length, [data]);

  const monthLabels = useMemo(() => {
    const labels: { index: number; label: string }[] = [];
    let lastMonth = -1;
    grid.forEach((week, i) => {
      const first = week.find(Boolean);
      if (!first) return;
      const parsed = parseISO(first.date);
      const m = parsed.getMonth();
      if (m !== lastMonth) {
        labels.push({ index: i, label: format(parsed, 'MMM') });
        lastMonth = m;
      }
    });
    return labels;
  }, [grid]);

  const dayLabels = ['Mon', 'Wed', 'Fri'];

  return (
    <section
      className="hf-heatmap-container"
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-xl)',
        padding: 'var(--space-5)',
        boxShadow: 'var(--glass-highlight), var(--shadow-xs)',
      }}
    >
      {data.length === 0 ? (
        <HeatmapSkeleton />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span className="eyebrow" style={{ letterSpacing: '0.12em', display: 'block', marginBottom: 4 }}>Consistency</span>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontFamily: "'Outfit'",
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Year in Review
              </h3>
            </div>
            <div
              ref={readoutRef}
              className="hf-heatmap-readout"
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: '-0.01em',
                background: 'var(--bg-tertiary)',
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid var(--border-subtle)',
              }}
            >
              {HOVER_DEFAULT}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-primary)',
                fontFamily: "'Outfit'",
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              {total.toLocaleString()} check-ins · {activeDays} active days
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((l) => (
                <span
                  key={l}
                  style={{
                    width: CELL,
                    height: CELL,
                    borderRadius: RADIUS,
                    background: levelColor[l as 0 | 1 | 2 | 3 | 4],
                    border: '1px solid var(--border-subtle)',
                  }}
                />
              ))}
              <span>More</span>
            </div>
          </div>

          <div
            className="hf-heatmap-scroll"
            style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: 6, WebkitOverflowScrolling: 'touch' }}
          >
            <div style={{ display: 'inline-flex', gap: GAP, alignItems: 'flex-start', paddingLeft: 28 }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: GAP,
                  marginRight: 4,
                  marginTop: 14,
                  marginLeft: -28,
                  width: 24,
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <span
                    key={d}
                    style={{
                      height: CELL,
                      fontSize: 9.5,
                      color: 'var(--text-dimmed)',
                      fontFamily: "'IBM Plex Mono', monospace",
                      letterSpacing: '0.04em',
                      lineHeight: `${CELL}px`,
                      visibility: dayLabels.includes(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]) ? 'visible' : 'hidden',
                    }}
                  >
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: GAP }}>
                {grid.map((week, wi) => {
                  const label = monthLabels.find((l) => l.index === wi);
                  return (
                    <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                      <div
                        style={{
                          height: 14,
                          fontSize: 10,
                          color: 'var(--text-dimmed)',
                          fontFamily: "'IBM Plex Mono', monospace",
                          position: 'relative',
                        }}
                      >
                        {label && (
                          <span style={{ position: 'absolute', top: 0, left: 0, whiteSpace: 'nowrap' }}>
                            {label.label}
                          </span>
                        )}
                      </div>

                      {week.map((day, di) =>
                        day ? (
                          <div
                            key={di}
                            className="hf-hm-cell"
                            onMouseEnter={() => handleEnter(day.hoverStr)}
                            onMouseLeave={handleLeave}
                            style={{
                              width: CELL,
                              height: CELL,
                              borderRadius: RADIUS,
                              background: levelColor[levelFor(day.count, max)],
                              border: '1px solid var(--border-subtle)',
                              cursor: 'pointer',
                              transition: 'transform 0.1s ease',
                            }}
                            title={day.titleStr}
                          />
                        ) : (
                          <div key={di} style={{ width: CELL, height: CELL }} />
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className="hf-heatmap-hint"
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 10,
              textAlign: 'center',
              display: 'none',
              fontStyle: 'italic',
            }}
          >
            ← Scroll to see full year
          </div>

          <style>{`.hf-hm-cell:hover { outline: 1px solid var(--accent-light); outline-offset: 1px; }
 @media (max-width: 1023px) { .hf-heatmap-hint { display: block !important; } }`}</style>
        </>
      )}
    </section>
  );
}
