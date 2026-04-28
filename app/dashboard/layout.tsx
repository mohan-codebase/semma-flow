import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNav from '@/components/layout/MobileNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Floating glass sidebar — md+ */}
      <Sidebar />

      {/* Main content area — offset by floating sidebar width */}
      <div
        className="flex flex-col flex-1 min-w-0"
        style={{ marginLeft: 'clamp(0px, 0px, 0px)' }}
      >
        <div
          className="flex flex-col flex-1 min-w-0"
          style={{
            paddingLeft: 'var(--sidebar-offset, 0px)',
          }}
        >
          <Topbar />
          <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 72 }}>
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav — hidden md+ */}
      <MobileNav />

      {/* Responsive offset for floating sidebar — only at lg+ when sidebar visible */}
      <style>{`
        @media (min-width: 1024px) {
          :root { --sidebar-offset: 264px; }
        }
      `}</style>
    </div>
  );
}
