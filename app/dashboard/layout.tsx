import { Suspense } from 'react';
import Topbar from '@/components/layout/Topbar';
import MobileNav from '@/components/layout/MobileNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Topbar: desktop only — mobile uses the bottom tab bar */}
      <div className="hidden lg:block">
        <Suspense>
          <Topbar />
        </Suspense>
      </div>

      <main className="flex-1 overflow-y-auto lg:pt-0" style={{ paddingBottom: 'calc(83px + env(safe-area-inset-bottom, 0px))' }}>
        {children}
      </main>

      <MobileNav />
    </div>
  );
}
