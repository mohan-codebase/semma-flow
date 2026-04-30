'use client';

import React, { useMemo, memo } from 'react';
import type { HeatmapCell } from '@/types/analytics';
import { toLocalDateString } from '@/lib/utils/dates';

interface CalendarHeatmapProps {
  data: HeatmapCell[];
  months?: number;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getColor(pct: number): string {
  if (pct === 0) return 'rgba(255,255,255,0.04)';
  if (pct < 25) return 'rgba(16,185,129,0.2)';
  if (pct < 50) return 'rgba(16,185,129,0.4)';
  if (pct < 75) return 'rgba(16,185,129,0.65)';
  return 'rgba(16,185,129,0.9)';
}

const CalendarHeatmap = memo(function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => {
    if (!data || data.length === 0) return { weeks: [], monthLabels: [] };

    // Build a date → cell map
    const cellMap = new Map<string, HeatmapCell>();
    for (const cell of data) cellMap.set(cell.date, cell);

    // Find date range
    const sortedDates = [...data].map((c) => c.date).sort();
    if (sortedDates.length === 0) return { weeks: [], monthLabels: [] };

    const start = new Date(sortedDates[0] + 'T00:00:00');
    const end = new Date(sortedDates[sortedDates.length - 1] + 'T00:00:00');

    // Align start to Sunday
    const startDow = start.getDay();
    const alignedStart = new Date(start);
    alignedStart.setDate(alignedStart.getDate() - startDow);

    const weeks: (HeatmapCell | null)[][] = [];
    const monthLabelsList: { label: string; weekIndex: number }[] = [];
    let week: (HeatmapCell | null)[] = [];
    let weekIndex = 0;
    let lastMonth = -1;

    const cur = new Date(alignedStart);
    while (cur <= end) {
      const dow = cur.getDay();
      if (dow === 0 && week.length > 0) {
        weeks.push(week);
        week = [];
        weekIndex++;
      }

      const dateStr = toLocalDateString(cur);
      const curMonth = cur.getMonth();
      if (curMonth !== lastMonth && cur >= start) {
        monthLabelsList.push({ label: MONTH_LABELS[curMonth], weekIndex });
        lastMonth = curMonth;
      }

      if (cur >= start) {
        week.push(cellMap.get(dateStr) ?? { date: dateStr, count: 0, percentage: 0 });
      } else {
        week.push(null); // padding
      }

      cur.setDate(cur.getDate() + 1);
    }
    if (week.length > 0) weeks.push(week);

    return { weeks, monthLabels: monthLabelsList };
  }, [data]);

  if (weeks.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
        No data yet — start tracking habits to see your heatmap.
      </div>
    );
  }

  const CELL_SIZE = 13;
  const CELL_GAP = 3;
  const DAY_LABEL_WIDTH = 28;

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <style>{`.hf-cal-cell { transition: transform 0.1s ease; } .hf-cal-cell:hover { transform: scale(1.4); position: relative; z-index: 10; }`}</style>
      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, minWidth: 'max-content' }}>
        {/* Month labels */}
        <div style={{ display: 'flex', paddingLeft: DAY_LABEL_WIDTH, gap: CELL_GAP }}>
          {weeks.map((_, wi) => {
            const label = monthLabels.find((m) => m.weekIndex === wi);
            return (
              <div
                key={wi}
                style={{
                  width: CELL_SIZE,
                  fontSize: 10,
                  color: label ? 'var(--text-secondary)' : 'transparent',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  whiteSpace: 'nowrap',
                }}
              >
                {label?.label ?? ''}
              </div>
            );
          })}
        </div>

        {/* Grid rows (Sun–Sat) */}
        {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
          <div key={dow} style={{ display: 'flex', alignItems: 'center', gap: CELL_GAP }}>
            {/* Day label */}
            <div
              style={{
                width: DAY_LABEL_WIDTH,
                fontSize: 10,
                color: dow % 2 === 1 ? 'var(--text-muted)' : 'transparent',
                fontFamily: "'IBM Plex Sans', sans-serif",
                textAlign: 'right',
                paddingRight: 4,
                flexShrink: 0,
              }}
            >
              {DAY_LABELS[dow]}
            </div>
            {/* Cells */}
            {weeks.map((week, wi) => {
              const cell = week[dow];
              if (!cell) {
                return (
                  <div
                    key={wi}
                    style={{ width: CELL_SIZE, height: CELL_SIZE, borderRadius: 3, flexShrink: 0 }}
                  />
                );
              }
              return (
                <div
                  key={wi}
                  className="hf-cal-cell"
                  title={`${cell.date}: ${cell.percentage}% complete`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderRadius: 3,
                    background: getColor(cell.percentage),
                    flexShrink: 0,
                    cursor: 'default',
                  }}
                />
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: DAY_LABEL_WIDTH, marginTop: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>Less</span>
          {[0, 25, 50, 75, 100].map((pct) => (
            <div
              key={pct}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderRadius: 3,
                background: getColor(pct),
              }}
            />
          ))}
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>More</span>
        </div>
      </div>
    </div>
  );
});

export default CalendarHeatmap;
