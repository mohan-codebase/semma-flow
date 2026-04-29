'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Dumbbell, BarChart2, Settings2, Plus } from 'lucide-react';

const NAV_LEFT = [
  { label: 'Home',     href: '/dashboard',           Icon: LayoutDashboard, exact: true },
  { label: 'Habits',   href: '/dashboard/habits',    Icon: Dumbbell,        exact: false },
];

const NAV_RIGHT = [
  { label: 'Stats',    href: '/dashboard/analytics', Icon: BarChart2,       exact: false },
  { label: 'Settings', href: '/dashboard/settings',  Icon: Settings2,       exact: false },
];

export default function MobileNav() {
  const pathname = usePathname();

  const active = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="hf-mobile-nav fixed bottom-0 left-0 right-0 z-50 flex lg:hidden"
      style={{
        background: 'rgba(15,15,20,0.92)',
        borderTop: '1px solid var(--border-subtle)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div style={{ display: 'flex', width: '100%', alignItems: 'center', padding: '4px 6px', height: 60 }}>
        {/* Left Side */}
        {NAV_LEFT.map(({ label, href, Icon, exact }) => {
          const on = active(href, exact);
          return (
            <Link key={href} href={href} style={{ flex: 1, textDecoration: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Icon size={20} color={on ? 'var(--accent-light)' : 'var(--text-muted)'} strokeWidth={on ? 2.5 : 1.8} />
                <span style={{ fontSize: 10, fontWeight: on ? 700 : 500, color: on ? 'var(--accent-light)' : 'var(--text-muted)' }}>{label}</span>
              </div>
            </Link>
          );
        })}

        {/* Quick Add Floating Action */}
        <div style={{ flex: 0.8, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('semma-flow:open-add'))}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--cyan) 100%)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-on-primary)',
              boxShadow: '0 4px 14px rgba(16,229,176,0.4)',
              transform: 'translateY(-14px)',
              cursor: 'pointer',
            }}
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Right Side */}
        {NAV_RIGHT.map(({ label, href, Icon, exact }) => {
          const on = active(href, exact);
          return (
            <Link key={href} href={href} style={{ flex: 1, textDecoration: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Icon size={20} color={on ? 'var(--accent-light)' : 'var(--text-muted)'} strokeWidth={on ? 2.5 : 1.8} />
                <span style={{ fontSize: 10, fontWeight: on ? 700 : 500, color: on ? 'var(--accent-light)' : 'var(--text-muted)' }}>{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
