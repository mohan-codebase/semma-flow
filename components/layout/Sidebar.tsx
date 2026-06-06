'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  LayoutDashboard,
  BarChart3,
  Trophy,
  Sparkles,
  CalendarCheck,
  Compass,
  Receipt,
  Luggage,
  MapPin,
  ExternalLink,
  Settings,
  Sun,
  Moon,
  ArrowLeft,
  ChevronDown,
  User,
  Search,
  Mountain,
  Receipt as ReceiptIcon,
  X,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useTheme } from '@/components/ui/ThemeProvider';
import CommandPalette from '@/components/layout/CommandPalette';
import DevicesModal from '@/components/settings/DevicesModal';
import { DynamicIcon } from '@/lib/icons';

interface Trip {
  id: string;
  name: string;
  travelers: string[];
  start_date: string;
  end_date: string;
}

interface SidebarProps {
  activeTrip?: Trip | null;
}

// Sidebar nav row — filled when active, hover tint otherwise.
function NavItem({
  icon, label, active = false, onClick,
}: {
  icon: React.ReactNode; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
        background: active ? 'var(--accent-primary)' : 'transparent',
        color: active ? 'var(--accent-on-primary)' : 'var(--text-secondary)',
        fontSize: 14, fontWeight: active ? 700 : 600, fontFamily: 'inherit', textAlign: 'left',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-tint)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );
}

// Expandable white-button group with sub-items
function NavGroup({
  icon, label, expanded, onToggle, children,
}: {
  icon: React.ReactNode;
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* White pill header button */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: '#ffffff',
          color: '#1a1a1a',
          fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', textAlign: 'left',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        <span style={{ display: 'flex', flexShrink: 0, color: '#1a1a1a' }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <ChevronDown size={15} color="#555" />
        </motion.span>
      </button>

      {/* Sub-items with animated expand */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="sub"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 0,
              paddingLeft: 14,
              borderLeft: '2px solid rgba(255,255,255,0.12)',
              marginLeft: 10,
              marginTop: 2,
              marginBottom: 4,
            }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-item inside a NavGroup
function SubNavItem({
  icon, label, active = false, onClick,
}: {
  icon: React.ReactNode; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
        background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: 'inherit', textAlign: 'left',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
    >
      <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );
}

export default function Sidebar({ activeTrip: initialActiveTrip = null }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { theme, toggle } = useTheme();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(initialActiveTrip);
  const [habitNavOpen, setHabitNavOpen] = useState(pathname.startsWith('/dashboard') || pathname === '/dashboard');
  const [tripNavOpen, setTripNavOpen] = useState(pathname.startsWith('/trip') || pathname === '/trip');
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const isDark = theme === 'dark';

  // Get current user details
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  // Command palette listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch active trip context dynamically if not passed via layout props
  useEffect(() => {
    if (!activeTrip && user) {
      (async () => {
        try {
          const res = await fetch('/api/trip/select');
          if (res.ok) {
            // Wait, does /api/trip/select support GET to fetch current trip?
            // Actually, server layouts already fetch this and pass as prop.
            // But if needed, we can query trip list from supabase client directly:
            const { data: trips } = await supabase
              .from('trip_trips')
              .select('*')
              .order('created_at', { ascending: false });
            if (trips && trips.length > 0) {
              setActiveTrip(trips[0] as Trip);
            }
          }
        } catch (e) {
          // ignore
        }
      })();
    }
  }, [activeTrip, user, supabase]);

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

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const isOverviewActive = pathname === '/dashboard';
  const isAnalyticsActive = pathname === '/dashboard/analytics';
  const isAchievementsActive = pathname === '/dashboard/achievements';
  const isCoachActive = pathname === '/dashboard/coach';
  const isYearActive = pathname === '/dashboard/year-in-review';
  const isSettingsActive = pathname === '/dashboard/settings';

  const isTripOverviewActive = pathname === '/trip';
  const isTripItineraryActive = pathname === '/trip/itinerary';
  const isTripExpensesActive = pathname === '/trip/expenses';
  const isTripPackingActive = pathname === '/trip/packing';
  const isTripBookingsActive = pathname === '/trip/bookings';
  const isTripDocumentsActive = pathname === '/trip/documents';

  return (
    <>
      <aside
        className="hf-desktop-sidebar no-print"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 264, zIndex: 50,
          flexDirection: 'column',
          background: 'var(--bg-tertiary)',
          borderRight: '1px solid var(--border-default)',
          padding: '22px 16px 20px',
          overflowY: 'auto',
        }}
      >
        {/* Brand */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '2px 8px 22px', textDecoration: 'none' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: 'var(--accent-primary)', color: 'var(--accent-on-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle2 size={21} strokeWidth={2.4} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>Productivity Master</p>
            <p style={{ margin: '1px 0 0', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Habit Tracker</p>
          </div>
        </Link>


        {/* Search */}
        <button
          onClick={() => setPaletteOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '9px 12px', borderRadius: 11, marginBottom: 14,
            border: '1px solid var(--border-default)', background: 'var(--bg-card)',
            color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
          }}
        >
          <Search size={16} />
          <span style={{ flex: 1, textAlign: 'left' }}>Search</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dimmed)' }}>⌘K</span>
        </button>

        {/* Nav */}
        <p style={{ margin: '0 0 8px', padding: '0 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>Menu</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

          {/* Habit Tracker group */}
          <NavGroup
            icon={<CheckCircle2 size={16} strokeWidth={2.2} color="#1a1a1a" />}
            label="Habit Tracker"
            expanded={habitNavOpen}
            onToggle={() => setHabitNavOpen(o => !o)}
          >
            <SubNavItem icon={<LayoutDashboard size={15} />} label="Overview" active={isOverviewActive} onClick={() => { if (isOverviewActive) { window.scrollTo({ top: 0, behavior: 'smooth' }); } else { navigateTo('/dashboard'); } }} />
            <SubNavItem icon={<BarChart3 size={15} />} label="Analytics" active={isAnalyticsActive} onClick={() => navigateTo('/dashboard/analytics')} />
            <SubNavItem icon={<Trophy size={15} />} label="Achievements" active={isAchievementsActive} onClick={() => navigateTo('/dashboard/achievements')} />
            <SubNavItem icon={<Sparkles size={15} />} label="Your Coach" active={isCoachActive} onClick={() => navigateTo('/dashboard/coach')} />
            <SubNavItem icon={<CalendarCheck size={15} />} label="Year in Review" active={isYearActive} onClick={() => navigateTo('/dashboard/year-in-review')} />
          </NavGroup>

          {/* Trip Planner group */}
          <NavGroup
            icon={<Compass size={16} strokeWidth={2.2} color="#1a1a1a" />}
            label="Trip Planner"
            expanded={tripNavOpen}
            onToggle={() => setTripNavOpen(o => !o)}
          >
            <SubNavItem icon={<Compass size={15} />} label="Dashboard" active={isTripOverviewActive} onClick={() => navigateTo('/trip')} />
            <SubNavItem icon={<CalendarCheck size={15} />} label="Itinerary" active={isTripItineraryActive} onClick={() => navigateTo('/trip/itinerary')} />
            <SubNavItem icon={<Receipt size={15} />} label="Expenses" active={isTripExpensesActive} onClick={() => navigateTo('/trip/expenses')} />
            <SubNavItem icon={<Luggage size={15} />} label="Packing" active={isTripPackingActive} onClick={() => navigateTo('/trip/packing')} />
            <SubNavItem icon={<MapPin size={15} />} label="Bookings" active={isTripBookingsActive} onClick={() => navigateTo('/trip/bookings')} />
            <SubNavItem icon={<ExternalLink size={15} />} label="Documents" active={isTripDocumentsActive} onClick={() => navigateTo('/trip/documents')} />
          </NavGroup>

          <NavItem icon={<Settings size={18} />} label="Settings" active={isSettingsActive} onClick={() => navigateTo('/dashboard/settings')} />
        </nav>

        {/* Footer */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 18 }}>
          <button
            onClick={toggle}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-secondary)',
              fontSize: 14, fontWeight: 600, fontFamily: 'inherit', textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-tint)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ display: 'flex', flexShrink: 0 }}>{isDark ? <Sun size={18} /> : <Moon size={18} />}</span>
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>

          {user && (
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                padding: '10px 12px', borderRadius: 14, marginTop: 6,
                border: '1px solid var(--border-default)', background: 'var(--bg-card)',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'var(--accent-primary)', color: 'var(--accent-on-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800,
              }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
              </div>
            </button>
          )}
        </div>
      </aside>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      
      <DevicesModal isOpen={devicesOpen} onClose={() => setDevicesOpen(false)} />

      <AnimatePresence>
        {menuOpen && (
          <ProfileMenu
            key="profile-menu"
            displayName={displayName}
            initials={initials}
            email={user?.email ?? ''}
            onClose={() => setMenuOpen(false)}
            onShowDevices={() => {
              setMenuOpen(false);
              setDevicesOpen(true);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ProfileMenu({
  displayName, initials, email, onClose, onShowDevices,
}: {
  displayName: string; initials: string; email: string;
  onClose: () => void; onShowDevices: () => void;
}) {
  const [signingOut, setSigningOut] = useState(false);
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      await createClient().auth.signOut();
      window.location.href = '/';
    } catch { setSigningOut(false); }
  };

  const menuItems: { icon: string; label: string; sub: string; href?: string; onClick?: () => void }[] = [
    { icon: 'mountain', label: 'Trip Planner', sub: 'Expenses & settlement', href: '/trip' },
    { icon: 'zap', label: 'Your Coach', sub: 'Weekly AI insights', href: '/dashboard/coach' },
    { icon: 'calendar-check', label: 'Year in Review', sub: 'Highlights & PDF export', href: '/dashboard/year-in-review' },
    { icon: 'shield', label: 'Security & Devices', sub: 'Manage login sessions', onClick: onShowDevices },
    { icon: 'bell', label: 'Notifications', sub: 'Reminders & alerts' },
    { icon: 'help-circle', label: 'Help & Feedback', sub: 'Support & suggestions' },
  ];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 399, background: 'rgba(0, 0, 0,0.45)' }}
      />

      {/* Sheet — slides up from bottom */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 400,
          maxHeight: '93dvh',
          background: 'var(--bg-primary)',
          borderRadius: '24px 24px 0 0',
          fontFamily: "system-ui, -apple-system, sans-serif",
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Inner centred column */}
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 48px', display: 'flex', flexDirection: 'column' }}>

          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 4 }}>
            <div style={{ width: 40, height: 4, borderRadius: 'var(--r-pill)', background: isDark ? 'rgba(255, 255, 255,0.18)' : 'rgba(85, 85, 85,0.18)' }} />
          </div>

          {/* Drag handle */}
          {/* Top bar */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 8 }}
          >
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isDark ? 'rgba(255, 255, 255,0.60)' : 'rgba(50, 50, 50,0.70)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Profile
            </p>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: isDark ? 'rgba(255, 255, 255,0.10)' : 'rgba(85, 85, 85,0.08)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <X size={18} color={isDark ? '#fff' : '#1f1f1f'} />
            </button>
          </motion.div>

          {/* User Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              marginTop: 16,
              background: isDark
                ? 'linear-gradient(155deg, rgba(255, 255, 255,0.10) 0%, rgba(255, 255, 255,0.04) 100%)'
                : 'linear-gradient(155deg, rgba(255, 255, 255,0.82) 0%, rgba(255, 255, 255,0.55) 100%)',
              borderRadius: 28,
              padding: '28px 24px 24px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 68, height: 68, borderRadius: '50%',
                background: `linear-gradient(135deg, var(--accent-primary) 0%, #727272 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayName}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {email}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Menu Items List */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              marginTop: 20,
              background: isDark
                ? 'linear-gradient(155deg, rgba(255, 255, 255,0.08) 0%, rgba(255, 255, 255,0.02) 100%)'
                : 'linear-gradient(155deg, rgba(255, 255, 255,0.80) 0%, rgba(255, 255, 255,0.40) 100%)',
              borderRadius: 24, overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {menuItems.map((item, idx) => {
              const Icon = (() => {
                switch (item.icon) {
                  case 'mountain': return Mountain;
                  case 'zap': return Sparkles;
                  case 'calendar-check': return CalendarCheck;
                  case 'shield': return Shield;
                  case 'bell': return CalendarCheck; // dummy or check
                  default: return HelpCircle;
                }
              })();

              const content = (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer', width: '100%' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'var(--surface-tint)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={18} color="var(--accent-primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{item.sub}</p>
                  </div>
                </div>
              );

              return (
                <div key={item.label}>
                  {idx > 0 && <div style={{ height: 1, background: 'var(--border-subtle)', marginLeft: 74 }} />}
                  {item.href ? (
                    <Link href={item.href} onClick={onClose} style={{ textDecoration: 'none', display: 'block' }}>
                      {content}
                    </Link>
                  ) : (
                    <div onClick={() => { item.onClick?.(); if (item.onClick) onClose(); }} style={{ display: 'block' }}>
                      {content}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>

          {/* Theme switcher row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              marginTop: 16,
              background: isDark
                ? 'linear-gradient(155deg, rgba(255, 255, 255,0.08) 0%, rgba(255, 255, 255,0.02) 100%)'
                : 'linear-gradient(155deg, rgba(255, 255, 255,0.80) 0%, rgba(255, 255, 255,0.40) 100%)',
              borderRadius: 24, padding: '16px 20px',
              border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isDark ? <Moon size={18} color="var(--text-muted)" /> : <Sun size={18} color="var(--text-muted)" />}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                <p style={{ margin: '1px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Premium theme</p>
              </div>
            </div>
            <button
              onClick={toggle}
              style={{
                width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                background: isDark ? 'var(--accent-primary)' : 'var(--border-medium)',
                position: 'relative', transition: 'background 0.2s', padding: 0,
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3, left: isDark ? 21 : 3,
                transition: 'left 0.2s',
              }} />
            </button>
          </motion.div>

          {/* Sign Out Button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, type: 'spring', damping: 28, stiffness: 280 }}
            style={{ marginTop: 24 }}
          >
            <button
              disabled={signingOut}
              onClick={handleSignOut}
              style={{
                width: '100%', padding: '15px 0', borderRadius: 20, border: 'none',
                background: 'var(--text-primary)', color: 'var(--bg-primary)',
                fontSize: 15, fontWeight: 700, cursor: signingOut ? 'wait' : 'pointer',
                transition: 'opacity 0.15s',
              }}
            >
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
