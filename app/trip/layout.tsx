import { redirect } from 'next/navigation';
import { ensureTrip } from '@/lib/trip/server';
import Sidebar from '@/components/layout/Sidebar';

export const metadata = { title: 'Trip Planner — Productivity Master' };

export default async function TripLayout({ children }: { children: React.ReactNode }) {
  const ctx = await ensureTrip();
  if (!ctx) redirect('/login');

  return (
    <div className="trip-layout-root" style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      <Sidebar activeTrip={ctx.trip} />
      <div className="trip-shell">
        <main className="trip-main">
          {children}
        </main>
      </div>
    </div>
  );
}

