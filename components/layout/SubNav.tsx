'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Dumbbell, BarChart2, Trophy, Settings2 } from 'lucide-react';

const PAGES = [
  { label: 'Dashboard',    href: '/dashboard',              icon: LayoutDashboard, exact: true },
  { label: 'Habits',       href: '/dashboard/habits',       icon: Dumbbell,        exact: false },
  { label: 'Analytics',    href: '/dashboard/analytics',    icon: BarChart2,       exact: false },
  { label: 'Achievements', href: '/dashboard/achievements', icon: Trophy,          exact: false },
  { label: 'Settings',     href: '/dashboard/settings',     icon: Settings2,       exact: false },
];

export default function SubNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div style={{
      height: 44,
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      {PAGES.map(({ label, href, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link key={href} href={href} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 8, cursor: 'pointer',
              transition: 'all 0.15s',
              background: active ? 'var(--accent-glow-md)' : 'transparent',
              color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: active ? 700 : 500,
              borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}>
              <Icon size={13} strokeWidth={active ? 2.4 : 1.8} />
              <span style={{ fontSize: 12 }}>{label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
