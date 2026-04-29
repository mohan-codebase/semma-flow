'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import CommandPalette from '@/components/layout/CommandPalette';
import NotificationBell from '@/components/layout/NotificationBell';
import ThemeToggle from '@/components/layout/ThemeToggle';
import PushNotificationToggle from '@/components/settings/PushNotificationToggle';

interface TopbarProps {
  title?: string;
}

function titleFromPath(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname.startsWith('/dashboard/habits')) {
    return pathname === '/dashboard/habits' ? 'Habits' : 'Habit Detail';
  }
  if (pathname.startsWith('/dashboard/analytics')) return 'Analytics';
  if (pathname.startsWith('/dashboard/achievements')) return 'Achievements';
  if (pathname.startsWith('/dashboard/settings')) return 'Settings';
  return 'Dashboard';
}

function greeting(name: string) {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name}`;
  if (h < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export default function Topbar({ title }: TopbarProps) {
  const supabase    = createClient();
  const router      = useRouter();
  const pathname    = usePathname();
  const [user, setUser]           = useState<User | null>(null);
  const [paletteOpen, setPalette] = useState(false);
  const displayTitle = title ?? titleFromPath(pathname);

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPalette((o) => !o); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const name = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0]
    ?? user?.email?.split('@')[0]
    ?? 'there';

  return (
    <>
      <motion.header
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between shrink-0 topbar-responsive"
        style={{
          height: 64,
          padding: '10px 26px',
          margin:'0px 13px 0px 0px',
          background: 'var(--bg-glass-strong)',
          borderBottom: '1px solid var(--border-subtle)',
          borderRadius:'15px',
          position: 'sticky',
          top: 10,
          zIndex: 20,
          // boxShadow: 'var(--glass-highlight)',
        }}
      >
        {/* Left */}
        <div style={{ minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit'", letterSpacing: '-0.3px', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayTitle}
          </h1>
          <p className="hidden sm:block" style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span className="hidden lg:block" style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 0 }}>
            {greeting(name)}
          </span>

          <ThemeToggle />
          {/* <PushNotificationToggle compact /> */}
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
            <span className="hidden sm:inline">Add Habit</span>
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
            <kbd
              className="hidden sm:inline"
              style={{
                fontSize: 11,
                padding: '1px 5px',
                borderRadius: 5,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                fontFamily: "'IBM Plex Mono'",
                color: 'var(--text-dimmed)',
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>
      </motion.header>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPalette(false)} />
    </>
  );
}
