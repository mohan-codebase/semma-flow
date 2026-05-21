'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Dumbbell, BarChart2, Trophy, Settings2, Target, BookOpen, Timer, ClipboardList, Compass, TrendingUp, Wallet } from 'lucide-react';

const HABIT_PAGES = [
  { label: 'Dashboard',     href: '/dashboard',               icon: LayoutDashboard, exact: true },
  { label: 'Habits',        href: '/dashboard/habits',        icon: Dumbbell,        exact: false },
  { label: 'Goals',         href: '/dashboard/goals',         icon: Target,          exact: false },
  { label: 'Journal',       href: '/dashboard/journal',       icon: BookOpen,        exact: false },
  { label: 'Focus',         href: '/dashboard/focus',         icon: Timer,           exact: false },
  { label: 'Weekly Review', href: '/dashboard/weekly-review', icon: ClipboardList,   exact: false },
  { label: 'Life Wheel',    href: '/dashboard/life-wheel',    icon: Compass,         exact: false },
  { label: 'Analytics',     href: '/dashboard/analytics',     icon: BarChart2,       exact: false },
  { label: 'Achievements',  href: '/dashboard/achievements',  icon: Trophy,          exact: false },
  { label: 'Settings',      href: '/dashboard/settings',      icon: Settings2,       exact: false },
];

const EXPENSE_PAGES = [
  { label: 'Expenses',   href: '/dashboard/expenses',   icon: Wallet,      exact: true },
  { label: 'Net Worth',  href: '/dashboard/net-worth',  icon: TrendingUp,  exact: false },
];

const EXPENSE_PATHS = ['/dashboard/expenses', '/dashboard/net-worth'];

export default function SubNav() {
  const pathname = usePathname();

  const isExpenseSection = EXPENSE_PATHS.some((p) => pathname.startsWith(p));
  const pages = isExpenseSection ? EXPENSE_PAGES : HABIT_PAGES;
  const accentColor = isExpenseSection ? 'var(--indigo)' : 'var(--accent-primary)';
  const accentGlow = isExpenseSection ? 'rgba(99,102,241,0.12)' : 'var(--accent-glow-md)';

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div style={{
      height: 44,
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      background: 'color-mix(in srgb, var(--bg-secondary) 90%, transparent)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      {pages.map(({ label, href, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link key={href} href={href} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 8, cursor: 'pointer',
              transition: 'all 0.15s',
              background: active ? accentGlow : 'transparent',
              color: active ? accentColor : 'var(--text-muted)',
              fontWeight: active ? 700 : 500,
              borderBottom: active ? `2px solid ${accentColor}` : '2px solid transparent',
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
