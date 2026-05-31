import { redirect } from 'next/navigation';
import { ensureTrip, getBookings } from '@/lib/trip/server';
import PageHeader from '@/components/trip/PageHeader';
import BookingsClient from '@/components/trip/BookingsClient';

export default async function BookingsPage() {
  const ctx = await ensureTrip();
  if (!ctx) redirect('/login');
  const bookings = await getBookings(ctx.trip.id);

  return (
    <>
      <PageHeader title="Bookings" description="Flights, trains, hotels and bike rentals — confirmed or pending." />
      <BookingsClient bookings={bookings} userId={ctx.userId} trip={ctx.trip} />
    </>
  );
}
