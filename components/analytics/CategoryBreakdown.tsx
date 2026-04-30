'use client';

import React, { memo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { CategoryStat } from '@/types/analytics';

interface Props {
  data: CategoryStat[];
}

interface TooltipPayload {
  payload: CategoryStat;
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
      <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: d.color }}>{d.category}</p>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'IBM Plex Mono'" }}>
        {d.percentage}%
      </p>
      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
        {d.completed} / {d.total} completed
      </p>
    </div>
  );
}

// Fallback palette when category.color is missing or near-grey.
const PALETTE = ['#10E5B0', '#5BC7DA', '#8B7FE8', '#F4B740', '#F07272', '#4FD1C5', '#F687B3', '#B794F4'];

function resolveColor(raw: string | undefined | null, index: number): string {
  if (!raw || !/^#[0-9A-Fa-f]{6}$/.test(raw)) return PALETTE[index % PALETTE.length];
  // Treat dark slate defaults as "uncolored"
  const greyList = ['#475569', '#64748b', '#94a3b8', '#334155'];
  if (greyList.includes(raw.toLowerCase())) return PALETTE[index % PALETTE.length];
  return raw;
}

const CategoryBreakdown = memo(function CategoryBreakdown({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
        No category data yet.
      </div>
    );
  }

  const colored = data.map((entry, i) => ({ ...entry, color: resolveColor(entry.color, i) }));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      {/* Pie chart */}
      <div style={{ flexShrink: 0 }}>
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={colored}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={3}
              dataKey="percentage"
              strokeWidth={0}
            >
              {colored.map((entry, index) => (
                <Cell key={index} fill={entry.color} opacity={0.9} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 140 }}>
        {colored.map((cat) => (
          <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: cat.color,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 3,
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.category}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: cat.color, fontFamily: "'IBM Plex Mono'", flexShrink: 0, marginLeft: 8 }}>
                  {cat.percentage}%
                </span>
              </div>
              <div
                style={{
                  height: 3,
                  background: 'var(--border-subtle)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${cat.percentage}%`,
                    background: cat.color,
                    borderRadius: 2,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default CategoryBreakdown;
