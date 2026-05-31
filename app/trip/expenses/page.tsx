import { redirect } from 'next/navigation';
import { ensureTrip, getExpenses } from '@/lib/trip/server';
import PageHeader from '@/components/trip/PageHeader';
import SettlementCard from '@/components/trip/SettlementCard';
import ExpensesClient from '@/components/trip/ExpensesClient';
import { computeSettlement } from '@/lib/trip/settlement';

export default async function ExpensesPage() {
  const ctx = await ensureTrip();
  if (!ctx) redirect('/login');
  const expenses = await getExpenses(ctx.trip.id);
  const settlement = computeSettlement(expenses, ctx.trip.travelers);

  return (
    <>
      <PageHeader title="Expenses" description="Every rupee, who paid, and the running settlement." />
      <div className="trip-expenses-grid">
        <ExpensesClient expenses={expenses} userId={ctx.userId} trip={ctx.trip} />
        <SettlementCard settlement={settlement} />
      </div>
    </>
  );
}
