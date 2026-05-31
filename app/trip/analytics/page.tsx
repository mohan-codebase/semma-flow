import { redirect } from 'next/navigation';
import { ensureTrip, getExpenses, getSettlements } from '@/lib/trip/server';
import PageHeader from '@/components/trip/PageHeader';
import StatCard from '@/components/trip/StatCard';
import AnalyticsCharts from '@/components/trip/AnalyticsCharts';
import { computeSettlement } from '@/lib/trip/settlement';
import { formatINR } from '@/lib/trip/format';

export default async function AnalyticsPage() {
  const ctx = await ensureTrip();
  if (!ctx) redirect('/login');
  const [expenses, settlements] = await Promise.all([
    getExpenses(ctx.trip.id),
    getSettlements(ctx.trip.id),
  ]);
  const settlement = computeSettlement(expenses, ctx.trip.travelers, settlements);
  const avg = expenses.length > 0 ? settlement.totalExpenses / expenses.length : 0;
  const biggest = expenses.reduce(
    (max, e) => (Number(e.amount) > Number(max?.amount ?? 0) ? e : max),
    expenses[0] as typeof expenses[number] | undefined,
  );

  return (
    <>
      <PageHeader title="Analytics" description="Where the money is going across the trip." />
      <div className="trip-three-grid" style={{ marginBottom: 16 }}>
        <StatCard label="Total spent" value={formatINR(settlement.totalExpenses)} />
        <StatCard label="Avg / expense" value={formatINR(avg)} />
        <StatCard label="Biggest expense" value={biggest ? formatINR(Number(biggest.amount)) : '—'} sub={biggest?.item} />
      </div>
      <AnalyticsCharts expenses={expenses} userId={ctx.userId} travelers={ctx.trip.travelers} />
    </>
  );
}
