import { Suspense } from 'react';
import Topbar from '@/components/layout/Topbar';
import MobileNav from '@/components/layout/MobileNav';

// Auth guard is handled by middleware (middleware.ts checks supabase.auth.getUser()
// before every /dashboard/* request and redirects unauthenticated users to /login).
// Repeating getUser() here adds a redundant Supabase network round-trip on every
// tab switch — removed for performance.

function LoadingFallback() {
  return (
    <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: 14 }}>
      Loading...
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<LoadingFallback />}>
        <Topbar />
      </Suspense>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 72 }}>
        {children}
      </main>

      {/* Mobile bottom nav — hidden lg+ */}
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  );
}
