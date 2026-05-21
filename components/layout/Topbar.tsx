'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Plus, LayoutDashboard, Dumbbell, BarChart2, Trophy, Settings2, Zap, LogOut, Menu, X, Wallet, Target, BookOpen, Timer, ClipboardList, Compass, TrendingUp } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import CommandPalette from '@/components/layout/CommandPalette';
import NotificationBell from '@/components/layout/NotificationBell';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_HABIT = [
  { label: 'Dashboard',     href: '/dashboard',               icon: LayoutDashboard, exact: true,  color: 'var(--accent-primary)',  glow: 'rgba(16,185,129,0.15)' },
  { label: 'Habits',        href: '/dashboard/habits',        icon: Dumbbell,        exact: false, color: 'var(--accent-primary)',  glow: 'rgba(16,185,129,0.15)' },
  { label: 'Goals',         href: '/dashboard/goals',         icon: Target,          exact: false, color: 'var(--accent-primary)',  glow: 'rgba(16,185,129,0.15)' },
  { label: 'Journal',       href: '/dashboard/journal',       icon: BookOpen,        exact: false, color: '#8B5CF6',                glow: 'rgba(139,92,246,0.15)' },
  { label: 'Focus',         href: '/dashboard/focus',         icon: Timer,           exact: false, color: '#EF4444',                glow: 'rgba(239,68,68,0.12)' },
  { label: 'Weekly Review', href: '/dashboard/weekly-review', icon: ClipboardList,   exact: false, color: '#F59E0B',                glow: 'rgba(245,158,11,0.15)' },
  { label: 'Life Wheel',    href: '/dashboard/life-wheel',    icon: Compass,         exact: false, color: '#06B6D4',                glow: 'rgba(6,182,212,0.15)' },
  { label: 'Analytics',     href: '/dashboard/analytics',     icon: BarChart2,       exact: false, color: 'var(--accent-primary)',  glow: 'rgba(16,185,129,0.15)' },
  { label: 'Achievements',  href: '/dashboard/achievements',  icon: Trophy,          exact: false, color: '#F59E0B',                glow: 'rgba(245,158,11,0.15)' },
  { label: 'Settings',      href: '/dashboard/settings',      icon: Settings2,       exact: false, color: 'var(--accent-primary)',  glow: 'rgba(16,185,129,0.15)' },
];

const NAV_EXPENSE = [
  { label: 'Expenses',  href: '/dashboard/expenses',  icon: Wallet,     exact: true,  color: 'var(--indigo)', glow: 'rgba(99,102,241,0.15)' },
  { label: 'Net Worth', href: '/dashboard/net-worth', icon: TrendingUp, exact: false, color: '#10B981',       glow: 'rgba(16,185,129,0.15)' },
];

const NAV = [...NAV_HABIT, ...NAV_EXPENSE];

export default function Topbar() {
  const supabase = useMemo(() => createClient(), []);
  const router      = useRouter();
  const pathname    = usePathname();
  const [user, setUser]           = useState<User | null>(null);
  const [paletteOpen, setPalette] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  useEffect(() => {
    for (const item of NAV) {
      router.prefetch(item.href);
    }
  }, [router]);

  const handleNavHover = useCallback((href: string) => {
    router.prefetch(href);
  }, [router]);

  const handleAddHabit = () => {
    if (pathname === '/dashboard') {
      window.dispatchEvent(new Event('semma-flow:open-add'));
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('semma_flow_open_form', '1');
      }
      router.push('/dashboard');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPalette((o) => !o); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'User';

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 100,
              }}
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: 300,
                background: 'var(--bg-primary)',
                borderRight: '1px solid var(--border-default)',
                zIndex: 101,
                display: 'flex',
                flexDirection: 'column',
                padding: 20,
                paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {/* Sidebar Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Zap size={18} color="var(--accent-on-primary)" fill="var(--accent-on-primary)" />
                  </div>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Semma Flow
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Profile */}
              {user && (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 700,
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{displayName}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <ThemeToggle />
                <NotificationBell />
                <button
                  onClick={handleAddHabit}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'var(--accent-primary)',
                    color: 'var(--accent-on-primary)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <Plus size={18} />
                  Add Habit
                </button>
              </div>

              {/* All nav pages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 14px 6px' }}>
                  Habit Tracker
                </div>
                {NAV_HABIT.map(({ label, href, icon: Icon, exact, color, glow }) => {
                  const active = isActive(href, exact);
                  return (
                    <Link key={href} href={href} onClick={() => setSidebarOpen(false)} style={{ textDecoration: 'none' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                        background: active ? glow : 'transparent',
                        border: active ? `1px solid ${color}44` : '1px solid transparent',
                        color: active ? color : 'var(--text-secondary)',
                        fontWeight: active ? 600 : 400,
                      }}>
                        <Icon size={17} strokeWidth={active ? 2.2 : 1.6} />
                        <span style={{ fontSize: 13 }}>{label}</span>
                      </div>
                    </Link>
                  );
                })}
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--indigo)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 14px 6px' }}>
                  Expense Tracker
                </div>
                {NAV_EXPENSE.map(({ label, href, icon: Icon, exact, color, glow }) => {
                  const active = isActive(href, exact);
                  return (
                    <Link key={href} href={href} onClick={() => setSidebarOpen(false)} style={{ textDecoration: 'none' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                        background: active ? glow : 'transparent',
                        border: active ? `1px solid ${color}44` : '1px solid transparent',
                        color: active ? color : 'var(--text-secondary)',
                        fontWeight: active ? 600 : 400,
                      }}>
                        <Icon size={17} strokeWidth={active ? 2.2 : 1.6} />
                        <span style={{ fontSize: 13 }}>{label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Search & Logout at Bottom */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => { setPalette(true); setSidebarOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  <Search size={18} />
                  Search (⌘K)
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'var(--danger-glow)',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <header
        className="flex items-center justify-between shrink-0"
        style={{
          height: 64,
          padding: '0 24px',
          background: 'color-mix(in srgb, var(--bg-card) 82%, transparent)',
          backdropFilter: 'blur(20px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
          borderBottom: '1px solid color-mix(in srgb, var(--border-default) 70%, transparent)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={20} color="var(--accent-on-primary)" fill="var(--accent-on-primary)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '-0.4px',
              }}
            >
              Semma Flow
            </span>
            <span
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                fontWeight: 500,
                marginTop: 1,
              }}
            >
              Habits & Finance
            </span>
          </div>
        </div>

        {/* Center: All feature tabs (desktop only) */}
        <nav
          className="hidden lg:flex"
          style={{
            alignItems: 'center', gap: 2, flex: 1,
            margin: '0 16px', overflowX: 'auto', scrollbarWidth: 'none',
            maskImage: 'linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)',
          }}
        >
          {NAV_HABIT.map(({ label, href, icon: Icon, exact, color, glow }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none', flexShrink: 0 }} onMouseEnter={() => handleNavHover(href)}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 13px', borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: active ? glow : 'transparent',
                  border: `1px solid ${active ? color + '55' : 'transparent'}`,
                  color: active ? color : 'var(--text-muted)',
                  fontWeight: active ? 700 : 500,
                  boxShadow: active ? `0 0 12px ${glow}` : 'none',
                }}>
                  <Icon size={14} strokeWidth={active ? 2.4 : 1.8} />
                  <span style={{ fontSize: 12.5 }}>{label}</span>
                </div>
              </Link>
            );
          })}

          {/* Section divider */}
          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', flexShrink: 0, margin: '0 6px' }} />

          {NAV_EXPENSE.map(({ label, href, icon: Icon, exact, color, glow }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none', flexShrink: 0 }} onMouseEnter={() => handleNavHover(href)}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 13px', borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: active ? glow : 'transparent',
                  border: `1px solid ${active ? color + '55' : 'transparent'}`,
                  color: active ? color : 'var(--text-muted)',
                  fontWeight: active ? 700 : 500,
                  boxShadow: active ? `0 0 12px ${glow}` : 'none',
                }}>
                  <Icon size={14} strokeWidth={active ? 2.4 : 1.8} />
                  <span style={{ fontSize: 12.5 }}>{label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Right: Desktop actions (lg+ only) + Mobile hamburger menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Desktop actions (ONLY visible on lg screens and larger!) */}
          <div style={{ display: 'none', alignItems: 'center', gap: 8 }} className="lg:flex">
            <ThemeToggle />
            <NotificationBell />
            <button
              onClick={handleAddHabit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 12,
                border: 'none',
                background: 'var(--accent-primary)',
                color: 'var(--accent-on-primary)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                transition: 'all 0.2s ease',
              }}
            >
              <Plus size={18} />
              Add Habit
            </button>
            <button
              onClick={() => setPalette(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: '1px solid var(--border-default)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Search size={18} />
            </button>
            {user && (
              <div
                title={displayName}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                {initials}
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'var(--danger-glow)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <LogOut size={18} />
            </button>
          </div>

          {/* Mobile hamburger menu (ONLY visible on mobile!) */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              width: 48,
              height: 44,
              borderRadius: 12,
              border: 'none',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              gap: 6,
              padding: 0,
            }}
            className="flex lg:hidden"
          >
            <div style={{
              width: 32,
              height: 3,
              background: 'var(--text-primary)',
              borderRadius: 2,
            }} />
            <div style={{
              width: 32,
              height: 3,
              background: 'var(--accent-primary)',
              borderRadius: 2,
            }} />
          </button>
        </div>
      </header>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPalette(false)} />
    </>
  );
}

