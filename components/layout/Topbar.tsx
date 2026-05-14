'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Plus, LayoutDashboard, Dumbbell, BarChart2, Trophy, Settings2, Zap, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import CommandPalette from '@/components/layout/CommandPalette';
import NotificationBell from '@/components/layout/NotificationBell';
import ThemeToggle from '@/components/layout/ThemeToggle';

const NAV = [
  { label: 'Dashboard',    href: '/dashboard',              icon: LayoutDashboard, exact: true },
  { label: 'Habits',       href: '/dashboard/habits',       icon: Dumbbell,        exact: false },
  { label: 'Analytics',    href: '/dashboard/analytics',    icon: BarChart2,       exact: false },
  { label: 'Achievements', href: '/dashboard/achievements', icon: Trophy,          exact: false },
  { label: 'Settings',     href: '/dashboard/settings',     icon: Settings2,       exact: false },
];

export default function Topbar() {
  const supabase = useMemo(() => createClient(), []);
  const router      = useRouter();
  const pathname    = usePathname();
  const [user, setUser]           = useState<User | null>(null);
  const [paletteOpen, setPalette] = useState(false);
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
      <header
        className="flex items-center justify-between shrink-0 topbar-responsive"
        style={{
          height: 64,
          padding: '0 20px',
          margin: '12px 16px',
          background: 'var(--bg-glass-strong)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--r-xl)',
          position: 'sticky',
          top: 12,
          zIndex: 40,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--r-md)',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--cyan) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'none',
              flexShrink: 0,
            }}
          >
            <Zap size={16} color="var(--accent-on-primary)" fill="var(--accent-on-primary)" />
          </div>
          <span
            className="gradient-text hidden lg:block"
            style={{
              fontSize: 17,
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '-0.4px',
              lineHeight: 1.1,
            }}
          >
            Semma Flow
          </span>
        </div>

        {/* Center: Navigation Links (hidden on mobile, managed by MobileNav) */}
        <nav className="hidden lg:flex" style={{ alignItems: 'center', gap: 4 }}>
          {NAV.map(({ label, href, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                style={{ textDecoration: 'none' }}
                onMouseEnter={() => handleNavHover(href)}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 'var(--r-md)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                    background: active ? 'var(--accent-glow-md)' : 'transparent',
                    border: `1px solid ${active ? 'var(--border-accent)' : 'transparent'}`,
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <Icon size={16} strokeWidth={active ? 2.4 : 1.8} color={active ? 'var(--accent-light)' : undefined} />
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: active ? 700 : 500,
                      letterSpacing: '-0.1px',
                    }}
                  >
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <ThemeToggle />
          <NotificationBell />

          <button
            onClick={handleAddHabit}
            title="Add Habit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border-accent)',
              background: 'var(--accent-glow-md)',
              color: 'var(--accent-light)',
              cursor: 'pointer',
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--accent-glow-lg)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-active)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--accent-glow-md)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)';
            }}
          >
            <Plus size={13} />
            <span className="hidden sm:inline">Add</span>
          </button>

          <button
            onClick={() => setPalette(true)}
            title="Search (⌘K)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 12px',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
            }}
          >
            <Search size={13} />
            <span className="hidden sm:inline" style={{ fontSize: 12 }}>Search</span>
          </button>

          {/* User Profile / Logout */}
          <div style={{ width: 1, height: 24, background: 'var(--border-subtle)', margin: '0 4px' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              title={displayName}
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--r-sm)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-primary)',
                flexShrink: 0,
                letterSpacing: '0.02em',
              }}
            >
              {initials}
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border-default)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--danger-glow)';
                (e.currentTarget as HTMLElement).style.color = 'var(--danger)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPalette(false)} />
    </>
  );
}

