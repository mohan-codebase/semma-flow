import { redirect } from 'next/navigation';
import { ensureTrip, getExpenses } from '@/lib/trip/server';
import TripDashboard from '@/components/trip/TripDashboard';

export default async function TripPage() {
  const ctx = await ensureTrip();
  if (!ctx) redirect('/login');

  const expenses = await getExpenses(ctx.trip.id);

  return <TripDashboard trip={ctx.trip} expenses={expenses} userId={ctx.userId} />;
}
