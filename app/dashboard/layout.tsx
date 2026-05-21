import { Suspense } from 'react';
import Topbar from '@/components/layout/Topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense>
        <Topbar />
      </Suspense>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
