'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { ExpenseCategory } from '@/types/expense';

interface BudgetRingProps {
  spent: number;
  categories: ExpenseCategory[];
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function fmtCompact(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    notation: 'compact', maximumFractionDigits: 1,
  }).format(n);
}

export default function BudgetRing({ spent, categories }: BudgetRingProps) {
  const totalBudget = categories.reduce((s, c) => s + (c.budget ?? 0), 0);
  const [animated, setAnimated] = useState(false);
  const ref = useRef<SVGCircleElement>(null);

  const pct = totalBudget > 0 ? Math.min(100, (spent / totalBudget) * 100) : 0;
  const remaining = totalBudget > 0 ? totalBudget - spent : null;
  const isOver = spent > totalBudget && totalBudget > 0;

  // SVG ring params
  const SIZE = 200;
  const STROKE = 16;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC - (animated ? (pct / 100) * CIRC : CIRC);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Color based on usage
  const ringColor = isOver
    ? 'url(#dangerGrad)'
    : pct > 80
      ? 'url(#warnGrad)'
      : 'url(#safeGrad)';

  const statusColor = isOver ? '#f87171' : pct > 80 ? '#fb923c' : '#10B981';

  if (totalBudget === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '24px 0' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          border: '3px dashed var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 28 }}>💰</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
          Set category budgets<br />to track progress
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {/* Ring */}
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="safeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
            <linearGradient id="warnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
            <linearGradient id="dangerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
          </defs>

          {/* Track */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth={STROKE}
          />

          {/* Progress arc */}
          <circle
            ref={ref}
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }}
          />

          {/* Tick marks at 25%, 50%, 75% */}
          {[25, 50, 75].map((t) => {
            const angle = (t / 100) * 2 * Math.PI - Math.PI / 2;
            const x1 = SIZE / 2 + (R - STROKE / 2 - 2) * Math.cos(angle);
            const y1 = SIZE / 2 + (R - STROKE / 2 - 2) * Math.sin(angle);
            const x2 = SIZE / 2 + (R + STROKE / 2 + 2) * Math.cos(angle);
            const y2 = SIZE / 2 + (R + STROKE / 2 + 2) * Math.sin(angle);
            return (
              <line
                key={t}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="var(--bg-card)" strokeWidth={2}
              />
            );
          })}
        </svg>

        {/* Center content */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 4,
        }}>
          <div style={{
            fontSize: 28, fontWeight: 900, color: statusColor,
            fontFamily: "'IBM Plex Mono'", letterSpacing: '-0.04em', lineHeight: 1,
          }}>
            {pct.toFixed(0)}%
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {isOver ? 'over budget' : 'used'}
          </div>
          <div style={{
            marginTop: 4, fontSize: 12, fontWeight: 700,
            color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono'",
          }}>
            {fmtCompact(spent)}
          </div>
        </div>
      </div>

      {/* Stats below ring */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
        <RingStat
          label="Spent"
          value={fmt(spent)}
          color={statusColor}
        />
        <RingStat
          label={isOver ? 'Over by' : 'Remaining'}
          value={fmt(Math.abs(remaining ?? 0))}
          color={isOver ? '#f87171' : 'var(--accent-primary)'}
        />
      </div>

      {/* Budget total */}
      <div style={{ width: '100%', textAlign: 'center', paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Monthly budget: </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono'" }}>
          {fmt(totalBudget)}
        </span>
      </div>

      {/* Per-category mini bars */}
      {categories.filter((c) => c.budget).length > 0 && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            By Category
          </div>
          {categories.filter((c) => c.budget).map((cat) => {
            const catSpent = 0; // filled from parent — placeholder, parent passes correct value
            const catPct = cat.budget ? Math.min(100, (catSpent / cat.budget) * 100) : 0;
            return (
              <div key={cat.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color }} />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{cat.name}</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono'" }}>
                    {fmt(cat.budget!)}
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${catPct}%`, borderRadius: 99,
                    background: cat.color, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Updated component with per-category spending passed in
export function BudgetRingDetailed({ spent, categories, spentByCategory }: {
  spent: number;
  categories: ExpenseCategory[];
  spentByCategory: Map<string, number>;
}) {
  const totalBudget = categories.reduce((s, c) => s + (c.budget ?? 0), 0);
  const [animated, setAnimated] = useState(false);

  const pct = totalBudget > 0 ? Math.min(100, (spent / totalBudget) * 100) : 0;
  const remaining = totalBudget > 0 ? totalBudget - spent : null;
  const isOver = spent > totalBudget && totalBudget > 0;

  const SIZE = 196;
  const STROKE = 18;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC - (animated ? (pct / 100) * CIRC : CIRC);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, []);

  const statusColor = isOver ? '#f87171' : pct > 80 ? '#fb923c' : '#10B981';
  const ringGrad = isOver ? 'url(#dRingDanger)' : pct > 80 ? 'url(#dRingWarn)' : 'url(#dRingSafe)';

  if (totalBudget === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '20px 0' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          border: '2px dashed var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
        }}>💰</div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          Set category budgets<br />to see your ring
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Ring */}
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="dRingSafe" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
            <linearGradient id="dRingWarn" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
            <linearGradient id="dRingDanger" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#FCA5A5" />
            </linearGradient>
          </defs>

          {/* Glow effect */}
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
            stroke={statusColor} strokeWidth={STROKE + 8} opacity={0.08}
          />
          {/* Track */}
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
            stroke="var(--bg-elevated)" strokeWidth={STROKE}
          />
          {/* Progress */}
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
            stroke={ringGrad} strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 6px ${statusColor}55)` }}
          />
          {/* Quarter ticks */}
          {[25, 50, 75].map((t) => {
            const a = (t / 100) * 2 * Math.PI;
            const cos = Math.cos(a); const sin = Math.sin(a);
            return (
              <line key={t}
                x1={SIZE/2 + (R - STROKE/2 - 3) * cos} y1={SIZE/2 + (R - STROKE/2 - 3) * sin}
                x2={SIZE/2 + (R + STROKE/2 + 3) * cos} y2={SIZE/2 + (R + STROKE/2 + 3) * sin}
                stroke="var(--bg-card)" strokeWidth={2.5}
              />
            );
          })}
        </svg>

        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: statusColor, fontFamily: "'IBM Plex Mono'", letterSpacing: '-0.04em', lineHeight: 1 }}>
            {pct.toFixed(0)}%
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
            {isOver ? 'OVER BUDGET' : 'of budget'}
          </div>
        </div>
      </div>

      {/* Spent / Remaining */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
        <div style={{ textAlign: 'center', padding: '10px 0', background: 'var(--bg-elevated)', borderRadius: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: statusColor, fontFamily: "'IBM Plex Mono'" }}>
            {fmt(spent)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>spent</div>
        </div>
        <div style={{ textAlign: 'center', padding: '10px 0', background: 'var(--bg-elevated)', borderRadius: 10 }}>
          <div style={{
            fontSize: 14, fontWeight: 800,
            color: isOver ? '#f87171' : 'var(--accent-primary)',
            fontFamily: "'IBM Plex Mono'",
          }}>
            {fmt(Math.abs(remaining ?? 0))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {isOver ? 'over' : 'left'}
          </div>
        </div>
      </div>

      {/* Per-category budget bars */}
      {categories.filter((c) => c.budget).length > 0 && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            Category Budgets
          </div>
          {categories.filter((c) => c.budget).map((cat) => {
            const catSpent = spentByCategory.get(cat.id) ?? 0;
            const catPct = Math.min(100, (catSpent / cat.budget!) * 100);
            const catOver = catSpent > cat.budget!;
            const barColor = catOver ? '#f87171' : catPct > 80 ? '#fb923c' : cat.color;
            return (
              <div key={cat.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color }} />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{cat.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: catOver ? '#f87171' : 'var(--text-primary)', fontFamily: "'IBM Plex Mono'" }}>
                      {fmt(catSpent)}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono'" }}>
                      / {fmt(cat.budget!)}
                    </span>
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${catPct}%`, borderRadius: 99,
                    background: barColor, transition: 'width 0.6s ease',
                    boxShadow: catOver ? `0 0 6px ${barColor}` : 'none',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RingStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0', background: 'var(--bg-elevated)', borderRadius: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color, fontFamily: "'IBM Plex Mono'" }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}
