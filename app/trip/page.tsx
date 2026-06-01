import { redirect } from 'next/navigation';
import { ensureTrip, getExpenses, getSettlements } from '@/lib/trip/server';
import TripDashboard from '@/components/trip/TripDashboard';
import { createServerClient } from '@/lib/supabase/server';

export default async function TripPage() {
  const ctx = await ensureTrip();
  if (!ctx) redirect('/login');

  const [expenses, settlements] = await Promise.all([
    getExpenses(ctx.trip.id),
    getSettlements(ctx.trip.id),
  ]);

  // Clean up any existing custom/personal splits in the database for this trip
  // to ensure everything is split 50/50 as requested.
  const hasCustomSplits = expenses.some((e) => e.split_between && e.split_between.length > 0);
  if (hasCustomSplits) {
    const supabase = await createServerClient();
    await supabase
      .from('trip_expenses')
      .update({ split_between: null })
      .eq('trip_id', ctx.trip.id);
    
    // Force a reload to pick up the updated equal splits
    redirect('/trip');
  }

  return <TripDashboard trip={ctx.trip} expenses={expenses} settlements={settlements} userId={ctx.userId} />;
}
