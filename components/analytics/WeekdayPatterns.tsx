'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import type { WeekdayPattern } from '@/types/analytics';

interface Props {
  data: WeekdayPattern[];
}

interface TooltipPayload {
  payload: WeekdayPattern;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
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
      <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--text-secondary)' }}>{d.day}</p>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--accent-primary)', fontFamily: "'IBM Plex Mono'" }}>
        {d.completionRate}%
      </p>
      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
        {d.totalEntries} entries tracked
      </p>
    </div>
  );
}

export default function WeekdayPatterns({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
        No pattern data yet.
      </div>
    );
  }

  const maxRate = Math.max(...data.map((d) => d.completionRate), 1);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Sans'" }}
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="completionRate" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => {
            const intensity = entry.completionRate / maxRate;
            const opacity = 0.35 + intensity * 0.65;
            return (
              <Cell
                key={index}
                fill={`rgba(16,185,129,${opacity})`}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
