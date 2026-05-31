import { redirect } from 'next/navigation';
import { ensureTrip, getItinerary } from '@/lib/trip/server';
import PageHeader from '@/components/trip/PageHeader';
import ItineraryClient from '@/components/trip/ItineraryClient';

export default async function ItineraryPage() {
  const ctx = await ensureTrip();
  if (!ctx) redirect('/login');
  const days = await getItinerary(ctx.trip.id);

  return (
    <>
      <PageHeader title="Itinerary" description="The day-by-day plan from Chennai to Pangong and back." />
      <ItineraryClient days={days} userId={ctx.userId} trip={ctx.trip} />
    </>
  );
}
