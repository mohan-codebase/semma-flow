'use client';

import React, { useState, memo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailyTrend } from '@/types/analytics';
import { format, parseISO } from 'date-fns';

interface CompletionChartProps {
  data: DailyTrend[];
  onRangeChange?: (days: number) => void;
  currentRange?: number;
}

const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

interface TooltipPayload {
  value: number;
  payload: DailyTrend;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--text-muted)', fontFamily: "'IBM Plex Sans'" }}>
        {label ? format(parseISO(label), 'MMM d, yyyy') : ''}
      </p>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--accent-primary)', fontFamily: "'IBM Plex Mono'" }}>
        {d.percentage}%
      </p>
      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
        {d.completed} / {d.total} habits
      </p>
    </div>
  );
}

const CompletionChart = memo(function CompletionChart({ data, onRangeChange, currentRange = 30 }: CompletionChartProps) {
  const [range, setRange] = useState(currentRange);

  const handleRange = (days: number) => {
    setRange(days);
    onRangeChange?.(days);
  };

  // Format X-axis labels based on range
  const formatXAxis = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      if (range <= 30) return format(d, 'MMM d');
      if (range <= 90) return format(d, 'MMM d');
      return format(d, 'MMM');
    } catch {
      return dateStr;
    }
  };

  // Explicit tick set — always includes first + last (today) so the final data
  // point is labelled with its date. Recharts' integer `interval` drops the
  // last tick when N-1 isn't divisible by the step, which was why "today"
  // was rendering past the last visible label.
  const step = range <= 7 ? 1 : range <= 30 ? 7 : range <= 90 ? 14 : 30;
  const ticks = (() => {
    if (data.length === 0) return undefined;
    const out: string[] = [];
    for (let i = 0; i < data.length; i += step) out.push(data[i].date);
    const last = data[data.length - 1].date;
    if (out[out.length - 1] !== last) out.push(last);
    return out;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Range selector */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        {RANGES.map(({ label, days }) => {
          const active = range === days;
          return (
            <button
              key={days}
              type="button"
              onClick={() => handleRange(days)}
              style={{
                padding: '4px 12px',
                borderRadius: 8,
                border: active ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border-subtle)',
                background: active ? 'var(--accent-glow)' : 'transparent',
                color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            ticks={ticks}
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: "'IBM Plex Sans'" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: "'IBM Plex Sans'" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(16,185,129,0.2)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="percentage"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#completionGradient)"
            dot={false}
            activeDot={{ r: 5, fill: '#10B981', stroke: 'var(--bg-primary)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export default CompletionChart;
