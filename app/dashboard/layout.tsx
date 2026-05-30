import InactivityGuard from '@/components/auth/InactivityGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InactivityGuard />
      {children}
    </>
  );
}
