import { redirect } from 'next/navigation';
import { ensureTrip, getTrips } from '@/lib/trip/server';
import TripNav from '@/components/trip/TripNav';
import Sidebar from '@/components/layout/Sidebar';

export const metadata = { title: 'Trip Planner — Productivity Master' };

export default async function TripLayout({ children }: { children: React.ReactNode }) {
  const ctx = await ensureTrip();
  if (!ctx) redirect('/login');

  const trips = await getTrips(ctx.userId);

  return (
    <div className="trip-layout-root" style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      <Sidebar activeTrip={ctx.trip} />
      <div className="trip-shell">
        <TripNav trips={trips} activeTrip={ctx.trip} />
        <main className="trip-main">
          {children}
        </main>
      </div>
    </div>
  );
}

