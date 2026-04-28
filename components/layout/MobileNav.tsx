'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Dumbbell, BarChart2, Trophy, Settings2 } from 'lucide-react';

const NAV = [
  { label: 'Home',     href: '/dashboard',              Icon: LayoutDashboard, exact: true },
  { label: 'Habits',   href: '/dashboard/habits',       Icon: Dumbbell,        exact: false },
  { label: 'Stats',    href: '/dashboard/analytics',    Icon: BarChart2,       exact: false },
  { label: 'Awards',   href: '/dashboard/achievements', Icon: Trophy,          exact: false },
  { label: 'Settings', href: '/dashboard/settings',     Icon: Settings2,       exact: false },
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
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--border-subtle)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div style={{ display: 'flex', width: '100%', alignItems: 'center', padding: '6px 8px' }}>
        {NAV.map(({ label, href, Icon, exact }) => {
          const on = active(href, exact);
          return (
            <Link key={href} href={href} style={{ flex: 1, textDecoration: 'none' }}>
              <motion.div
                whileTap={{ scale: 0.88 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  padding: '6px 4px',
                  borderRadius: 10,
                  background: on ? 'rgba(16,185,129,0.10)' : 'transparent',
                  transition: 'background 0.18s ease',
                  position: 'relative',
                }}
              >
                {on && (
                  <motion.div
                    layoutId="mobile-indicator"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '20%',
                      right: '20%',
                      height: 2,
                      borderRadius: '0 0 3px 3px',
                      background: 'var(--accent-primary)',
                      boxShadow: '0 0 8px rgba(16,185,129,0.5)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={on ? 2.2 : 1.7}
                  color={on ? 'var(--accent-light)' : 'var(--text-muted)'}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: on ? 700 : 400,
                    color: on ? 'var(--accent-light)' : 'var(--text-muted)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
