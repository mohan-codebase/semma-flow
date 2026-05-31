import { redirect } from 'next/navigation';
import { ensureTrip, getExpenses, getSettlements } from '@/lib/trip/server';
import TripDashboard from '@/components/trip/TripDashboard';

export default async function TripPage() {
  const ctx = await ensureTrip();
  if (!ctx) redirect('/login');

  const [expenses, settlements] = await Promise.all([
    getExpenses(ctx.trip.id),
    getSettlements(ctx.trip.id),
  ]);

  return <TripDashboard trip={ctx.trip} expenses={expenses} settlements={settlements} userId={ctx.userId} />;
}
