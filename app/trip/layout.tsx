import { redirect } from 'next/navigation';
import { ensureTrip, getTrips } from '@/lib/trip/server';
import TripNav from '@/components/trip/TripNav';

export const metadata = { title: 'Trip Planner — Semma Flow' };

export default async function TripLayout({ children }: { children: React.ReactNode }) {
  const ctx = await ensureTrip();
  if (!ctx) redirect('/login');

  const trips = await getTrips(ctx.userId);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      <div className="trip-shell">
        <TripNav trips={trips} activeTrip={ctx.trip} />
        <main className="trip-main">
          {children}
        </main>
      </div>
    </div>
  );
}
