'use client';

import React, { useMemo, useState } from 'react';
import type { Expense } from '@/types/expense';

interface SpendingHeatmapProps {
  expenses: Expense[];
  monthKey: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function getIntensityColor(amount: number, max: number): string {
  if (amount === 0) return 'rgba(255,255,255,0.04)';
  const ratio = amount / max;
  if (ratio < 0.2) return 'rgba(239,68,68,0.15)';
  if (ratio < 0.4) return 'rgba(239,68,68,0.3)';
  if (ratio < 0.6) return 'rgba(239,68,68,0.5)';
  if (ratio < 0.8) return 'rgba(239,68,68,0.72)';
  return 'rgba(239,68,68,0.95)';
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function SpendingHeatmap({ expenses, monthKey }: SpendingHeatmapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const { cells, weeks, maxAmount } = useMemo(() => {
    const [year, mon] = monthKey.split('-').map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();

    const dailyMap = new Map<string, number>();
    for (const e of expenses) {
      dailyMap.set(e.date, (dailyMap.get(e.date) ?? 0) + e.amount);
    }

    const max = Math.max(...[...dailyMap.values()], 1);

    // Build cells for all days of this month
    const allCells: { date: string; amount: number; dow: number; day: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = new Date(dateStr + 'T00:00:00').getDay();
      allCells.push({ date: dateStr, amount: dailyMap.get(dateStr) ?? 0, dow, day: d });
    }

    // Group into weeks (each week starts on Sunday)
    const weeksGrid: ({ date: string; amount: number; dow: number; day: number } | null)[][] = [];
    let currentWeek: ({ date: string; amount: number; dow: number; day: number } | null)[] = [];

    // Pad the first week
    const firstDow = allCells[0].dow;
    for (let i = 0; i < firstDow; i++) currentWeek.push(null);

    for (const cell of allCells) {
      if (currentWeek.length === 7) {
        weeksGrid.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(cell);
    }
    // Pad last week
    while (currentWeek.length < 7) currentWeek.push(null);
    weeksGrid.push(currentWeek);

    return { cells: allCells, weeks: weeksGrid, maxAmount: max };
  }, [expenses, monthKey]);

  const hoveredCell = hovered ? cells.find((c) => c.date === hovered) : null;

  const CELL = 28;
  const GAP = 4;

  return (
    <div>
      {/* Tooltip bar */}
      <div style={{ height: 28, marginBottom: 10, display: 'flex', alignItems: 'center' }}>
        {hoveredCell ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 3,
              background: getIntensityColor(hoveredCell.amount, maxAmount),
              border: '1px solid rgba(239,68,68,0.3)',
            }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {new Date(hoveredCell.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: hoveredCell.amount > 0 ? '#f87171' : 'var(--text-muted)', fontFamily: "'IBM Plex Mono'" }}>
              {hoveredCell.amount > 0 ? fmt(hoveredCell.amount) : 'No spending'}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hover a day to see details</span>
        )}
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: GAP }}>
          {/* Day labels */}
          <div style={{ display: 'flex', gap: GAP, marginBottom: 2 }}>
            {DAY_LABELS.map((d, i) => (
              <div key={i} style={{
                width: CELL, textAlign: 'center',
                fontSize: 9, fontWeight: 700, color: 'var(--text-muted)',
                letterSpacing: '0.06em',
              }}>{d}</div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', gap: GAP }}>
              {week.map((cell, di) => (
                <div
                  key={di}
                  onMouseEnter={() => cell && setHovered(cell.date)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    width: CELL, height: CELL, borderRadius: 6,
                    background: cell
                      ? getIntensityColor(cell.amount, maxAmount)
                      : 'transparent',
                    border: cell
                      ? hovered === cell.date
                        ? '2px solid rgba(239,68,68,0.7)'
                        : '1px solid rgba(255,255,255,0.06)'
                      : 'none',
                    cursor: cell ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                    transform: hovered === cell?.date ? 'scale(1.15)' : 'scale(1)',
                    position: 'relative',
                    zIndex: hovered === cell?.date ? 2 : 1,
                    boxShadow: hovered === cell?.date && cell?.amount > 0
                      ? '0 0 12px rgba(239,68,68,0.4)'
                      : 'none',
                  }}
                >
                  {cell && (
                    <span style={{
                      fontSize: 9, fontWeight: 600,
                      color: cell.amount > maxAmount * 0.5 ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)',
                    }}>
                      {cell.day}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Less</span>
        {[0.05, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <div key={ratio} style={{
            width: 14, height: 14, borderRadius: 4,
            background: getIntensityColor(ratio * maxAmount, maxAmount),
            border: '1px solid rgba(255,255,255,0.06)',
          }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>More</span>
      </div>
    </div>
  );
}
