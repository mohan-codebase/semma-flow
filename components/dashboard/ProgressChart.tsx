'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Check } from 'lucide-react';
interface HeatmapDay { date: string; count: number; }

interface ProgressChartProps {
  data: HeatmapDay[];       // 365 days of {date, count}
  habitCount: number;       // active habits, for "on track" logic
}

type Range = '7d' | '30d' | '90d';

const rangeDays: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 };

/** Cardinal spline → smooth cubic bezier SVG path. */
function smoothPath(points: { x: number; y: number }[], tension = 0.35): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  const d: string[] = [`M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d.push(
      `C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
    );
  }
  return d.join(' ');
}

function DeltaPill({ value, positive }: { value: number; positive: boolean }) {
  const zero = value === 0;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 7px',
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 600,
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: '-0.01em',
        color: zero ? 'var(--text-muted)' : positive ? 'var(--accent-light)' : 'var(--danger)',
        background: zero ? 'var(--bg-tertiary)' : positive ? 'var(--accent-glow-md)' : 'var(--danger-glow)',
        border: `1px solid ${zero ? 'var(--border-default)' : positive ? 'rgba(16,229,176,0.24)' : 'rgba(240,114,114,0.24)'}`,
      }}
    >
      {zero ? <Minus size={9} /> : positive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {positive && !zero ? '+' : ''}{value}%
    </span>
  );
}
function ChartSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="shimmer" style={{ height: 12, width: 120, borderRadius: 4, marginBottom: 12 }} />
          <div className="shimmer" style={{ height: 32, width: 200, borderRadius: 8, marginBottom: 8 }} />
          <div className="shimmer" style={{ height: 14, width: 150, borderRadius: 4 }} />
        </div>
        <div className="shimmer" style={{ height: 32, width: 100, borderRadius: 8 }} />
      </div>
      <div
        className="shimmer"
        style={{
          height: 200,
          width: '100%',
          borderRadius: 12,
          opacity: 0.4,
          background: 'linear-gradient(90deg, transparent 0%, var(--bg-tertiary) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  );
}

export default function ProgressChart({ data, habitCount }: ProgressChartProps) {
  const [range, setRange] = useState<Range>('30d');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  // Start at 0×0 — ResizeObserver sets the real size before first paint
  const [size, setSize] = useState({ w: 0, h: 160 });
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Responsive sizing
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.max(280, Math.floor(e.contentRect.width));
        setSize({ w, h: Math.min(240, Math.max(180, Math.round(w * 0.32))) });
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Window + stats
  const { window, prevWindow } = useMemo(() => {
    const n = rangeDays[range];
    const all = data.slice(-n * 2);
    const current = data.slice(-n);
    const previous = all.slice(0, all.length - current.length);
    return { window: current, prevWindow: previous };
  }, [data, range]);

  const total     = useMemo(() => window.reduce((s, d) => s + d.count, 0), [window]);
  const prevTotal = useMemo(() => prevWindow.reduce((s, d) => s + d.count, 0), [prevWindow]);
  const avg       = window.length > 0 ? total / window.length : 0;
  const prevAvg   = prevWindow.length > 0 ? prevTotal / prevWindow.length : 0;
  const delta     = avg - prevAvg;
  const deltaPct  = prevAvg === 0 ? (avg > 0 ? 100 : 0) : Math.round(((avg - prevAvg) / prevAvg) * 100);

  // "Completion rate" — cap at habitCount per day
  const completionPct = useMemo(() => {
    if (window.length === 0 || habitCount === 0) return 0;
    const maxPossible = habitCount * window.length;
    return Math.round((total / maxPossible) * 100);
  }, [window, habitCount, total]);
  const prevCompletionPct = useMemo(() => {
    if (prevWindow.length === 0 || habitCount === 0) return 0;
    const maxPossible = habitCount * prevWindow.length;
    return Math.round((prevTotal / maxPossible) * 100);
  }, [prevWindow, habitCount, prevTotal]);
  const completionDelta = completionPct - prevCompletionPct;

  // Chart geometry
  const padding = { top: 18, right: 20, bottom: 24, left: 32 };
  const W = size.w;
  const H = size.h;
  const innerW = W - padding.left - padding.right;
  const innerH = H - padding.top - padding.bottom;

  const maxVal = useMemo(() => {
    const m = window.reduce((acc, d) => (d.count > acc ? d.count : acc), 0);
    return Math.max(m, habitCount || 1, 1);
  }, [window, habitCount]);

  const points = useMemo(() => {
    if (window.length === 0) return [];
    const step = window.length > 1 ? innerW / (window.length - 1) : 0;
    return window.map((d, i) => ({
      x: padding.left + i * step,
      y: padding.top + innerH - (d.count / maxVal) * innerH,
      data: d,
    }));
  }, [window, innerW, innerH, padding.left, padding.top, maxVal]);

  const linePath = useMemo(() => smoothPath(points), [points]);
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const baseY = padding.top + innerH;
    return `${linePath} L ${points[points.length - 1].x.toFixed(2)},${baseY} L ${points[0].x.toFixed(2)},${baseY} Z`;
  }, [points, linePath, padding.top, innerH]);

  // Tick marks
  const yTicks = [0, 0.5, 1].map((f) => ({
    v: Math.round(maxVal * f),
    y: padding.top + innerH - f * innerH,
  }));
  const xTicks = useMemo(() => {
    if (points.length === 0) return [];
    const n = points.length;
    const count = Math.min(5, n);
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.round((i / (count - 1 || 1)) * (n - 1));
      return { idx, label: format(parseISO(points[idx].data.date), range === '7d' ? 'EEE' : 'MMM d'), x: points[idx].x };
    });
  }, [points, range]);

  // Mouse → nearest index
  const handleMouseMove = (e: React.MouseEvent) => {
    if (points.length === 0 || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = size.w / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    let bestIdx = 0;
    let bestD = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(points[i].x - mx);
      if (d < bestD) { bestD = d; bestIdx = i; }
    }
    setHoverIdx(bestIdx);
  };

  const onTrack = completionDelta >= 0 && completionPct >= 50;

  return (
    <section
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-xl)',
        padding: 'var(--space-5)',
        boxShadow: 'var(--glass-highlight), var(--shadow-xs)',
      }}
    >
      {/* Header: title + status + range tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: "'Outfit'",
              letterSpacing: '-0.02em',
            }}
          >
            Progress
          </h3>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 9px',
              borderRadius: 999,
              background: onTrack ? 'var(--accent-glow-md)' : 'var(--warm-glow)',
              border: `1px solid ${onTrack ? 'rgba(16,229,176,0.28)' : 'rgba(244,183,64,0.28)'}`,
              color: onTrack ? 'var(--accent-light)' : 'var(--warm)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '-0.005em',
            }}
          >
            <Check size={11} strokeWidth={3} />
            {onTrack ? 'On track' : 'Needs work'}
          </span>
        </div>

        {/* Range tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '3px',
            gap: '2px',
          }}
        >
          {(['7d', '30d', '90d'] as Range[]).map((r) => {
            const active = range === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: active ? 'var(--bg-secondary)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: 12.5,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  minWidth: 48,
                }}
              >
                {r.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <KpiTile
          label="Completion rate"
          value={`${completionPct}%`}
          delta={completionDelta}
          positive={completionDelta >= 0}
        />
        <KpiTile
          label="Total check-ins"
          value={total.toLocaleString()}
          delta={deltaPct}
          positive={deltaPct >= 0}
          sub={`${avg.toFixed(1)} / day avg`}
        />
      </div>

      {/* Chart */}
      <div ref={wrapRef} style={{ width: '100%', minWidth: 0, position: 'relative', overflow: 'hidden' }}>
      {/* Don't render SVG until measured to avoid width:0 artifacts */}
      {size.w === 0 ? (
        <ChartSkeleton />
      ) : (
        <>
          <svg
            ref={svgRef}
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ display: 'block', cursor: 'crosshair', maxWidth: '100%' }}
          >
            <defs>
              <linearGradient id="pc-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="var(--accent-primary)" stopOpacity="0.35" />
                <stop offset="60%"  stopColor="var(--accent-primary)" stopOpacity="0.10" />
                <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="pc-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="var(--accent-primary)" />
                <stop offset="100%" stopColor="var(--cyan)" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {yTicks.map((t, i) => (
              <g key={i}>
                <line
                  x1={padding.left}
                  x2={W - padding.right}
                  y1={t.y}
                  y2={t.y}
                  stroke="var(--border-subtle)"
                  strokeDasharray="3 4"
                  strokeWidth={1}
                />
                <text
                  x={padding.left - 6}
                  y={t.y + 3}
                  textAnchor="end"
                  fill="var(--text-dimmed)"
                  fontSize={9.5}
                  fontFamily="'IBM Plex Mono', monospace"
                  letterSpacing="0.04em"
                >
                  {t.v}
                </text>
              </g>
            ))}

            {/* X labels */}
            {xTicks.map((t, i) => (
              <text
                key={i}
                x={t.x}
                y={H - padding.bottom + 14}
                textAnchor="middle"
                fill="var(--text-dimmed)"
                fontSize={9.5}
                fontFamily="'IBM Plex Mono', monospace"
                letterSpacing="0.04em"
              >
                {t.label}
              </text>
            ))}

            {/* Area fill */}
            {areaPath && (
              <motion.path
                d={areaPath}
                fill="url(#pc-fill)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
            )}

            {/* Line */}
            {linePath && (
              <motion.path
                d={linePath}
                fill="none"
                stroke="url(#pc-line)"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
            )}

            {/* Hover crosshair + dot */}
            {hoverIdx !== null && points[hoverIdx] && (
              <g>
                <line
                  x1={points[hoverIdx].x}
                  x2={points[hoverIdx].x}
                  y1={padding.top}
                  y2={H - padding.bottom}
                  stroke="var(--border-medium)"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                />
                <circle
                  cx={points[hoverIdx].x}
                  cy={points[hoverIdx].y}
                  r={5}
                  fill="var(--bg-primary)"
                  stroke="var(--accent-primary)"
                  strokeWidth={2}
                />
              </g>
            )}
          </svg>

          {/* Tooltip */}
          {hoverIdx !== null && points[hoverIdx] && (
            <div
              style={{
                position: 'absolute',
                left: Math.max(0, Math.min(points[hoverIdx].x - 60, size.w - 120)),
                top: Math.max(0, points[hoverIdx].y - 54),
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--r-sm)',
                padding: '7px 10px',
                pointerEvents: 'none',
                boxShadow: 'var(--shadow-md)',
                minWidth: 120,
                zIndex: 2,
              }}
            >
              <p style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.02em', marginBottom: 2 }}>
                {format(parseISO(points[hoverIdx].data.date), 'MMM d, yyyy')}
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
                {points[hoverIdx].data.count} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>check-in{points[hoverIdx].data.count === 1 ? '' : 's'}</span>
              </p>
            </div>
          )}
        </>
      )}
      </div>{/* /wrapRef */}
    </section>
  );
}

function KpiTile({
  label,
  value,
  delta,
  positive,
  sub,
}: {
  label: string;
  value: string;
  delta: number;
  positive: boolean;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-md)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        boxShadow: 'var(--glass-highlight)',
      }}
    >
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 500,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontFamily: "'Outfit'",
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        <DeltaPill value={delta} positive={positive} />
      </div>
      {sub && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '-0.005em', marginTop: 2 }}>
          {sub}
        </span>
      )}
    </div>
  );
}
