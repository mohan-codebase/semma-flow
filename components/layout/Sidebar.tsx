'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Dumbbell,
  BarChart2,
  Trophy,
  Settings2,
  LogOut,
  Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import SidebarPulse from './SidebarPulse';

const NAV = [
  { label: 'Dashboard',    href: '/dashboard',              icon: LayoutDashboard, exact: true },
  { label: 'Habits',       href: '/dashboard/habits',       icon: Dumbbell,        exact: false },
  { label: 'Analytics',    href: '/dashboard/analytics',    icon: BarChart2,       exact: false },
  { label: 'Achievements', href: '/dashboard/achievements', icon: Trophy,          exact: false },
  { label: 'Settings',     href: '/dashboard/settings',     icon: Settings2,       exact: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  // Prefetch all dashboard routes on mount so transitions are instant.
  // Next.js 16's router.prefetch() pre-rendes the route's React tree and
  // prefetches any data requirements (RSC payloads, JS chunks).
  useEffect(() => {
    for (const item of NAV) {
      router.prefetch(item.href);
    }
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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

  // Prefetch a single route on hover for faster perceived navigation.
  const handleNavHover = useCallback((href: string) => {
    router.prefetch(href);
  }, [router]);

  return (
    <aside
      data-desktop-sidebar="true"
      className="hf-desktop-sidebar hidden lg:flex flex-col"
      style={{
        width: 240,
        minWidth: 240,
        height: 'calc(100vh - 24px)',
        position: 'fixed',
        top: 12,
        left: 12,
        zIndex: 40,
        background: 'var(--bg-glass-strong)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--r-xl)',
        boxShadow: 'var(--glass-highlight), var(--shadow-lg)',
      }}
    >
      {/* ── Logo ── */}
      <div style={{ padding: '20px 18px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--r-md)',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--cyan) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(16,229,176,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
              flexShrink: 0,
            }}
          >
            <Zap size={17} color="var(--accent-on-primary)" fill="var(--accent-on-primary)" />
          </div>
          <div>
            <span
              className="gradient-text"
              style={{
                display: 'block',
                fontSize: 17,
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '-0.4px',
                lineHeight: 1.1,
              }}
            >
              Semma Flow
            </span>
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
              Level up daily
            </span>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 16px' }} />

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
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
                  gap: 11,
                  padding: '9px 12px',
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                  background: active ? 'var(--accent-glow-md)' : 'transparent',
                  border: `1px solid ${active ? 'var(--border-accent)' : 'transparent'}`,
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  position: 'relative',
                  boxShadow: active ? 'var(--glass-highlight)' : 'none',
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
                {active && (
                  <div
                    style={{
                      position: 'absolute',
                      left: -1,
                      top: '18%',
                      bottom: '18%',
                      width: 3,
                      borderRadius: '0 4px 4px 0',
                      background: 'linear-gradient(180deg, var(--accent-light), var(--cyan))',
                      boxShadow: '0 0 10px var(--accent-primary)',
                    }}
                  />
                )}
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

      {/* ── Live pulse ── */}
      <SidebarPulse />

      {/* ── Divider ── */}
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '14px 16px 0' }} />

      {/* ── User footer ── */}
      <div style={{ padding: '12px 12px 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 10px',
            borderRadius: 12,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div
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
              boxShadow: 'var(--glass-highlight)',
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email ?? ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 7,
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
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
