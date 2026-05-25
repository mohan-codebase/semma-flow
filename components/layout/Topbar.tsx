'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, LayoutDashboard, Dumbbell, BarChart2, Trophy, Settings2, Zap, LogOut, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import CommandPalette from '@/components/layout/CommandPalette';
import NotificationBell from '@/components/layout/NotificationBell';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

const NAV = [
  { label: 'Dashboard',    tab: 'home',         icon: LayoutDashboard, color: 'var(--accent-primary)', glow: 'rgba(124,58,237,0.15)' },
  { label: 'Habits',       tab: 'habits',       icon: Dumbbell,        color: 'var(--accent-primary)', glow: 'rgba(124,58,237,0.15)' },
  { label: 'Analytics',    tab: 'analytics',    icon: BarChart2,       color: 'var(--accent-primary)', glow: 'rgba(124,58,237,0.15)' },
  { label: 'Achievements', tab: 'achievements', icon: Trophy,          color: '#F59E0B',               glow: 'rgba(245,158,11,0.15)' },
  { label: 'Settings',     tab: 'settings',     icon: Settings2,       color: 'var(--accent-primary)', glow: 'rgba(124,58,237,0.15)' },
];

interface TopbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function Topbar({ activeTab = 'home', onTabChange }: TopbarProps) {
  const supabase = useMemo(() => createClient(), []);
  const router      = useRouter();
  const [user, setUser]           = useState<User | null>(null);
  const [paletteOpen, setPalette] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  const handleAddHabit = () => {
    window.dispatchEvent(new Event('semma-flow:open-add'));
    onTabChange?.('habits');
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
                {NAV.map(({ label, tab, icon: Icon, color, glow }) => {
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => { onTabChange?.(tab); setSidebarOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                        background: active ? glow : 'transparent',
                        border: active ? `1px solid ${color}44` : '1px solid transparent',
                        color: active ? color : 'var(--text-secondary)',
                        fontWeight: active ? 600 : 400,
                        width: '100%', textAlign: 'left',
                      }}
                    >
                      <Icon size={17} strokeWidth={active ? 2.2 : 1.6} />
                      <span style={{ fontSize: 13 }}>{label}</span>
                    </button>
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
          background: 'var(--bg-card)',
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
              Habit Tracker
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
          {NAV.map(({ label, tab, icon: Icon, color, glow }) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onTabChange?.(tab)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 13px', borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: active ? glow : 'transparent',
                  border: `1px solid ${active ? color + '55' : 'transparent'}`,
                  color: active ? color : 'var(--text-muted)',
                  fontWeight: active ? 700 : 500,
                  boxShadow: active ? `0 0 12px ${glow}` : 'none',
                  flexShrink: 0,
                }}
              >
                <Icon size={14} strokeWidth={active ? 2.4 : 1.8} />
                <span style={{ fontSize: 12.5 }}>{label}</span>
              </button>
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

