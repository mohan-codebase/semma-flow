'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { formatINR } from '@/lib/trip/format';
import { useTripRealtime } from '@/lib/trip/useTripRealtime';
import { EXPENSE_CATEGORIES, type TripExpense } from '@/lib/trip/types';

const COLORS = ['#A78BFA', '#67E8F9', '#F472B6', '#FCA5A5', '#FBBF24', '#34D399'];
const TABLES = ['trip_expenses'];

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
      map.set(e.paid_by, (map.get(e.paid_by) ?? 0) + Number(e.amount));
    });
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
  }, [expenses, travelers]);

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
      <ChartCard title="Spending by category">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={byCategory} margin={{ left: -16, right: 8 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} interval={0} angle={-30} textAnchor="end" height={60} stroke="var(--border-default)" />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border-default)" />
            <Tooltip content={<TooltipContent />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {byCategory.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Spending by person">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={byPerson} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={2} isAnimationActive={false}>
              {byPerson.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<TooltipContent />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8 }}>
          {byPerson.map((d, i) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>{formatINR(d.value)}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <div style={{ gridColumn: '1 / -1' }}>
        <ChartCard title="Monthly spending trend">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthly} margin={{ left: -16, right: 8 }}>
              <defs>
                <linearGradient id="tripTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border-default)" />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border-default)" />
              <Tooltip content={<TooltipContent />} cursor={{ stroke: 'var(--border-default)' }} />
              <Area type="monotone" dataKey="value" stroke="#A78BFA" strokeWidth={2} fill="url(#tripTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
