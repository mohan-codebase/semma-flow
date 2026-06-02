'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { formatINR } from '@/lib/trip/format';
import { expensePayers } from '@/lib/trip/settlement';
import { useTripRealtime } from '@/lib/trip/useTripRealtime';
import { EXPENSE_CATEGORIES, type TripExpense } from '@/lib/trip/types';

const COLORS = ['#999999', '#cecece', '#929292', '#b7b7b7', '#c1c1c1', '#adadad'];
const TABLES = ['trip_expenses'];
// Brand purple — literal hex (CSS vars don't resolve in SVG stroke/fill attrs).
const WEEKLY_ACCENT = '#555555';
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Short money labels for the Y axis / avg pill, e.g. ₹1.2k, ₹12k.
function formatINRCompact(n: number): string {
  if (n >= 1000) return `₹${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `₹${Math.round(n)}`;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
        {title}
      </h3>
      {children}
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const name = label ?? payload[0]?.payload?.name ?? payload[0]?.name;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</p>
      <p style={{ margin: '2px 0 0', color: 'var(--text-muted)' }}>{formatINR(Number(payload[0]?.value ?? 0))}</p>
    </div>
  );
}

function CircularShareProgress({
  name,
  amount,
  percentage,
  color,
}: {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}) {
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage / 100);
  const size = (radius + strokeWidth) * 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minWidth: 120 }}>
      {/* SVG Ring */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress Arc */}
          {percentage > 0 && (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                filter: `drop-shadow(0px 0px 6px ${color}80)`,
              }}
            />
          )}
        </svg>
        {/* Center Labels */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>
            {percentage}%
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            share
          </span>
        </div>
      </div>
      {/* Name and Amount */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120, fontFamily: "'Outfit', sans-serif" }}>
          {name}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
          {formatINR(amount)}
        </p>
      </div>
    </div>
  );
}

export default function AnalyticsCharts({
  expenses,
  userId,
  travelers,
}: {
  expenses: TripExpense[];
  userId: string;
  travelers: string[];
}) {
  useTripRealtime(TABLES, userId);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    return EXPENSE_CATEGORIES.map((c) => ({ name: c, value: map.get(c) ?? 0 })).filter((d) => d.value > 0);
  }, [expenses]);

  const byPerson = useMemo(() => {
    const map = new Map<string, number>();
    travelers.forEach((t) => map.set(t, 0));
    expenses.forEach((e) => {
      for (const [name, paid] of Object.entries(expensePayers(e))) {
        map.set(name, (map.get(name) ?? 0) + paid);
      }
    });
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }));
  }, [expenses, travelers]);

  const totalSpent = useMemo(() => {
    return byPerson.reduce((sum, d) => sum + d.value, 0);
  }, [byPerson]);

  // Current week (Mon–Sun) daily spend, for the weekly-report area chart.
  const weekly = useMemo(() => {
    const now = new Date();
    const offset = (now.getDay() + 6) % 7; // 0 = Monday
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const days = WEEKDAYS.map((label, i) => {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { label, key, value: 0 };
    });
    for (const e of expenses) {
      const hit = days.find((d) => d.key === e.expense_date.slice(0, 10));
      if (hit) hit.value += Number(e.amount);
    }
    return days;
  }, [expenses]);

  const weeklyAvg = useMemo(
    () => weekly.reduce((sum, d) => sum + d.value, 0) / weekly.length,
    [weekly],
  );

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const key = e.expense_date.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + Number(e.amount));
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const d = new Date(`${key}-01T00:00:00`);
        return { name: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), value };
      });
  }, [expenses]);

  if (expenses.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<BarChart2 size={26} color="var(--accent-light)" />}
          title="No data to chart yet"
          description="Add some expenses and analytics will appear here automatically."
          compact
        />
      </Card>
    );
  }

  return (
    <div className="trip-charts-grid">
      <div style={{ gridColumn: '1 / -1' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
              Weekly report
            </h3>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-light)', fontFamily: "'Outfit', sans-serif" }}>
              {formatINRCompact(weeklyAvg)} avg
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weekly} margin={{ top: 10, right: 10, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="tripWeekly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={WEEKLY_ACCENT} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={WEEKLY_ACCENT} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke={WEEKLY_ACCENT} strokeOpacity={0.14} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} dy={6} />
              <YAxis tickFormatter={formatINRCompact} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<TooltipContent />} cursor={{ stroke: WEEKLY_ACCENT, strokeOpacity: 0.35, strokeWidth: 2 }} />
              {weeklyAvg > 0 && (
                <ReferenceLine
                  y={weeklyAvg}
                  stroke={WEEKLY_ACCENT}
                  strokeOpacity={0.45}
                  strokeDasharray="5 4"
                  label={{ value: `avg ${formatINRCompact(weeklyAvg)}`, position: 'insideTopRight', fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}
                />
              )}
              <Area
                type="monotone"
                dataKey="value"
                stroke={WEEKLY_ACCENT}
                strokeWidth={3}
                strokeLinecap="round"
                fill="url(#tripWeekly)"
                dot={{ r: 3, fill: WEEKLY_ACCENT, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: WEEKLY_ACCENT, stroke: 'var(--bg-primary)', strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <ChartCard title="Spending by category">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={byCategory} margin={{ left: -16, right: 8 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} interval={0} angle={-30} textAnchor="end" height={60} stroke="var(--border-default)" />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border-default)" />
            <Tooltip content={<TooltipContent />} cursor={{ fill: 'rgba(255, 255, 255,0.04)' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {byCategory.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Spending by person">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '24px 32px', padding: '24px 12px 12px', minHeight: 280 }}>
          {byPerson.map((d, i) => {
            const pct = totalSpent > 0 ? Math.round((d.value / totalSpent) * 100) : 0;
            return (
              <CircularShareProgress
                key={d.name}
                name={d.name}
                amount={d.value}
                percentage={pct}
                color={COLORS[i % COLORS.length]}
              />
            );
          })}
        </div>
      </ChartCard>

      <div style={{ gridColumn: '1 / -1' }}>
        <ChartCard title="Monthly spending trend">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthly} margin={{ left: -16, right: 8 }}>
              <defs>
                <linearGradient id="tripTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#999999" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#999999" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border-default)" />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border-default)" />
              <Tooltip content={<TooltipContent />} cursor={{ stroke: 'var(--border-default)' }} />
              <Area type="monotone" dataKey="value" stroke="#999999" strokeWidth={2} fill="url(#tripTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
