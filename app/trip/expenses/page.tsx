import { redirect } from 'next/navigation';
import { ensureTrip, getExpenses, getSettlements } from '@/lib/trip/server';
import PageHeader from '@/components/trip/PageHeader';
import SettlementCard from '@/components/trip/SettlementCard';
import ExpensesClient from '@/components/trip/ExpensesClient';
import { computeSettlement } from '@/lib/trip/settlement';

export default async function ExpensesPage() {
  const ctx = await ensureTrip();
  if (!ctx) redirect('/login');
  const [expenses, settlements] = await Promise.all([
    getExpenses(ctx.trip.id),
    getSettlements(ctx.trip.id),
  ]);
  const settlement = computeSettlement(expenses, ctx.trip.travelers, settlements);

  return (
    <>
      <PageHeader title="Expenses" description="Every rupee, who paid, and the running settlement." />
      <div className="trip-expenses-grid">
        <ExpensesClient expenses={expenses} settlements={settlements} userId={ctx.userId} trip={ctx.trip} />
        <SettlementCard settlement={settlement} tripId={ctx.trip.id} settledPayments={settlements} />
      </div>
    </>
  );
}
