'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

const CHART_HEIGHT = 200;

export interface WeeklyPoint {
  date: string;
  label: string;   // day name, e.g. "Mon"
  dayNum: number;  // day-of-month
  pct: number;     // completion percentage 0–100
  isToday: boolean;
}

// Default accent (brand purple). A literal hex is required — CSS custom
// properties don't resolve inside SVG presentation attributes (stroke /
// stopColor). Per-habit charts pass their own hex via the `color` prop.
const DEFAULT_ACCENT = '#7C3AED';

interface TooltipPayload {
  payload: WeeklyPoint;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '10px 14px',
      }}
    >
      <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
        {d.label} {d.dayNum}{d.isToday ? ' · Today' : ''}
      </p>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--accent-primary)', fontFamily: "'IBM Plex Mono', monospace" }}>
        {d.pct}%
      </p>
    </div>
  );
}

/* Weekly report — 7-day completion trend as a smooth area chart, with the
   week's average drawn as a reference line. */
const WeeklyReportChart = memo(function WeeklyReportChart({ data, avg, color = DEFAULT_ACCENT }: { data: WeeklyPoint[]; avg: number; color?: string }) {
  // Unique gradient id per color so multiple charts (dashboard + open habit
  // sheet) don't share/override one another's fill definition.
  const gradientId = `weeklyReportGradient-${color.replace('#', '')}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // Measure the actual pixel width dynamically to avoid Recharts ResponsiveContainer
  // measurement bugs inside animating or flex container layouts.
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: CHART_HEIGHT }}>
      {width > 0 ? (
        <AreaChart width={width} height={CHART_HEIGHT} data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke={color} strokeOpacity={0.14} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeOpacity: 0.35, strokeWidth: 2 }} />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke={color}
              strokeOpacity={0.45}
              strokeDasharray="5 4"
              label={{ value: `avg ${avg}%`, position: 'insideTopRight', fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="pct"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: color, stroke: 'var(--bg-primary)', strokeWidth: 3 }}
          />
        </AreaChart>
      ) : null}
    </div>
  );
});

export default WeeklyReportChart;
