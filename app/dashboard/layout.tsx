import InactivityGuard from '@/components/auth/InactivityGuard';
import Sidebar from '@/components/layout/Sidebar';
import { ensureTrip } from '@/lib/trip/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await ensureTrip();
  const activeTrip = ctx?.trip ?? null;

  return (
    <div className="dashboard-layout-container" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <InactivityGuard />
      <Sidebar activeTrip={activeTrip} />
      <div className="hf-dash-main">
        {children}
      </div>
    </div>
  );
}

