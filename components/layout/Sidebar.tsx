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
  Menu,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useTheme } from '@/components/ui/ThemeProvider';
import CommandPalette from '@/components/layout/CommandPalette';
import DevicesModal from '@/components/settings/DevicesModal';
import Modal from '@/components/ui/Modal';
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
  icon, label, active = false, href, onClick,
}: {
  icon: React.ReactNode; label: string; active?: boolean; href: string; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
        background: active ? 'var(--accent-primary)' : 'transparent',
        color: active ? 'var(--accent-on-primary)' : 'var(--text-secondary)',
        fontSize: 14, fontWeight: active ? 700 : 600, fontFamily: 'inherit', textAlign: 'left',
        textDecoration: 'none',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-tint)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
      {label}
    </Link>
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
  icon, label, active = false, href, onClick,
}: {
  icon: React.ReactNode; label: string; active?: boolean; href: string; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
        background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: 'inherit', textAlign: 'left',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
    >
      <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
      {label}
    </Link>
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Switch/Create Trip states
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripStart, setNewTripStart] = useState('');
  const [newTripEnd, setNewTripEnd] = useState('');
  const [newTripBudget, setNewTripBudget] = useState('80000');
  const [newTripTravelers, setNewTripTravelers] = useState('Mohan, Charles');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const isDark = theme === 'dark';

  // Get current user details
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  // Fetch list of trips for trip selection
  useEffect(() => {
    if (user) {
      supabase
        .from('trip_trips')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setTrips(data as Trip[]);
        });
    }
  }, [user, supabase]);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripName.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const travelersList = newTripTravelers
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (travelersList.length === 0) {
        setCreateError('Add at least one traveler');
        setCreating(false);
        return;
      }

      const tripRes = await fetch('/api/trip/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTripName.trim(),
          start_date: newTripStart,
          end_date: newTripEnd,
          total_budget: Number(newTripBudget) || 0,
          travelers: travelersList,
        }),
      });
      const tripJson = await tripRes.json();
      if (!tripRes.ok) throw new Error(tripJson.error || 'Failed to create trip');

      const selectRes = await fetch('/api/trip/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: tripJson.data.id }),
      });
      if (!selectRes.ok) throw new Error('Failed to activate new trip');

      setShowCreateModal(false);
      window.location.reload();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setCreating(false);
    }
  };

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
            <SubNavItem icon={<LayoutDashboard size={15} />} label="Overview" active={isOverviewActive} href="/dashboard" onClick={(e) => { if (isOverviewActive) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} />
            <SubNavItem icon={<BarChart3 size={15} />} label="Analytics" active={isAnalyticsActive} href="/dashboard/analytics" />
            <SubNavItem icon={<Trophy size={15} />} label="Achievements" active={isAchievementsActive} href="/dashboard/achievements" />
            <SubNavItem icon={<Sparkles size={15} />} label="Your Coach" active={isCoachActive} href="/dashboard/coach" />
            <SubNavItem icon={<CalendarCheck size={15} />} label="Year in Review" active={isYearActive} href="/dashboard/year-in-review" />
          </NavGroup>

          {/* Trip Planner group */}
          <NavGroup
            icon={<Compass size={16} strokeWidth={2.2} color="#1a1a1a" />}
            label="Trip Planner"
            expanded={tripNavOpen}
            onToggle={() => setTripNavOpen(o => !o)}
          >
            <div style={{ padding: '4px 14px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Trip</span>
              <select
                value={activeTrip?.id ?? ''}
                onChange={async (e) => {
                  const selectedId = e.target.value;
                  if (selectedId === 'create-new') {
                    setShowCreateModal(true);
                    return;
                  }
                  await fetch('/api/trip/select', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tripId: selectedId }),
                  });
                  window.location.reload();
                }}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 12.5,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {!activeTrip && <option value="" disabled>Select a trip...</option>}
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                <option value="create-new">+ Create new trip...</option>
              </select>
            </div>
            <SubNavItem icon={<Compass size={15} />} label="Dashboard" active={isTripOverviewActive} href="/trip" />
            <SubNavItem icon={<CalendarCheck size={15} />} label="Itinerary" active={isTripItineraryActive} href="/trip/itinerary" />
            <SubNavItem icon={<Receipt size={15} />} label="Expenses" active={isTripExpensesActive} href="/trip/expenses" />
            <SubNavItem icon={<Luggage size={15} />} label="Packing" active={isTripPackingActive} href="/trip/packing" />
            <SubNavItem icon={<MapPin size={15} />} label="Bookings" active={isTripBookingsActive} href="/trip/bookings" />
            <SubNavItem icon={<ExternalLink size={15} />} label="Documents" active={isTripDocumentsActive} href="/trip/documents" />
          </NavGroup>

          <NavItem icon={<Settings size={18} />} label="Settings" active={isSettingsActive} href="/dashboard/settings" />
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
            <Link
              href="/dashboard/settings"
              style={{
                display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                padding: '10px 12px', borderRadius: 14, marginTop: 6,
                border: '1px solid var(--border-default)', background: 'var(--bg-card)',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                textDecoration: 'none',
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
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Topbar (Sticky header visible < 1024px) */}
      <header
        className="hf-mobile-nav no-print"
        style={{
          height: 60,
          padding: '0 16px',
          background: 'var(--bg-glass-strong)',
          borderBottom: '1px solid var(--border-default)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        {/* Brand */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--accent-primary)', color: 'var(--accent-on-primary)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
          }}>
            <CheckCircle2 size={18} strokeWidth={2.4} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>Productivity Master</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Habit Tracker</span>
          </div>
        </Link>

        {/* Hamburger Menu Toggle */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-primary)',
          }}
        >
          <Menu size={18} />
        </button>
      </header>

      {/* Mobile Drawer (visible only < 1024px) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99,
                background: 'rgba(0, 0, 0, 0.5)',
              }}
              className="hf-mobile-nav"
            />
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: 280,
                zIndex: 100,
                background: 'var(--bg-tertiary)',
                borderRight: '1px solid var(--border-default)',
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
              }}
              className="hf-mobile-nav"
            >
              {/* Drawer Brand Header with Close button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: 'var(--accent-primary)', color: 'var(--accent-on-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckCircle2 size={18} strokeWidth={2.4} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>Productivity Master</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Habit Tracker</span>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-primary)',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search */}
              <button
                onClick={() => { setPaletteOpen(true); setMobileOpen(false); }}
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

              <p style={{ margin: '0 0 8px', padding: '0 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>Menu</p>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Habit Tracker group */}
                <NavGroup
                  icon={<CheckCircle2 size={16} strokeWidth={2.2} color="#1a1a1a" />}
                  label="Habit Tracker"
                  expanded={habitNavOpen}
                  onToggle={() => setHabitNavOpen(o => !o)}
                >
                  <SubNavItem icon={<LayoutDashboard size={15} />} label="Overview" active={isOverviewActive} href="/dashboard" onClick={() => setMobileOpen(false)} />
                  <SubNavItem icon={<BarChart3 size={15} />} label="Analytics" active={isAnalyticsActive} href="/dashboard/analytics" onClick={() => setMobileOpen(false)} />
                  <SubNavItem icon={<Trophy size={15} />} label="Achievements" active={isAchievementsActive} href="/dashboard/achievements" onClick={() => setMobileOpen(false)} />
                  <SubNavItem icon={<Sparkles size={15} />} label="Your Coach" active={isCoachActive} href="/dashboard/coach" onClick={() => setMobileOpen(false)} />
                  <SubNavItem icon={<CalendarCheck size={15} />} label="Year in Review" active={isYearActive} href="/dashboard/year-in-review" onClick={() => setMobileOpen(false)} />
                </NavGroup>

                {/* Trip Planner group */}
                <NavGroup
                  icon={<Compass size={16} strokeWidth={2.2} color="#1a1a1a" />}
                  label="Trip Planner"
                  expanded={tripNavOpen}
                  onToggle={() => setTripNavOpen(o => !o)}
                >
                  <div style={{ padding: '4px 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Trip</span>
                    <select
                      value={activeTrip?.id ?? ''}
                      onChange={async (e) => {
                        const selectedId = e.target.value;
                        if (selectedId === 'create-new') {
                          setMobileOpen(false);
                          setShowCreateModal(true);
                          return;
                        }
                        await fetch('/api/trip/select', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ tripId: selectedId }),
                        });
                        window.location.reload();
                      }}
                      style={{
                        width: '100%',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 8,
                        padding: '6px 10px',
                        fontSize: 12.5,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {!activeTrip && <option value="" disabled>Select a trip...</option>}
                      {trips.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                      <option value="create-new">+ Create new trip...</option>
                    </select>
                  </div>
                  <SubNavItem icon={<Compass size={15} />} label="Dashboard" active={isTripOverviewActive} href="/trip" onClick={() => setMobileOpen(false)} />
                  <SubNavItem icon={<CalendarCheck size={15} />} label="Itinerary" active={isTripItineraryActive} href="/trip/itinerary" onClick={() => setMobileOpen(false)} />
                  <SubNavItem icon={<Receipt size={15} />} label="Expenses" active={isTripExpensesActive} href="/trip/expenses" onClick={() => setMobileOpen(false)} />
                  <SubNavItem icon={<Luggage size={15} />} label="Packing" active={isTripPackingActive} href="/trip/packing" onClick={() => setMobileOpen(false)} />
                  <SubNavItem icon={<MapPin size={15} />} label="Bookings" active={isTripBookingsActive} href="/trip/bookings" onClick={() => setMobileOpen(false)} />
                  <SubNavItem icon={<ExternalLink size={15} />} label="Documents" active={isTripDocumentsActive} href="/trip/documents" onClick={() => setMobileOpen(false)} />
                </NavGroup>

                <NavItem icon={<Settings size={18} />} label="Settings" active={isSettingsActive} href="/dashboard/settings" onClick={() => setMobileOpen(false)} />
              </nav>

              {/* Footer */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 18 }}>
                <button
                  onClick={() => { toggle(); setMobileOpen(false); }}
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
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                      padding: '10px 12px', borderRadius: 14, marginTop: 6,
                      border: '1px solid var(--border-default)', background: 'var(--bg-card)',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      textDecoration: 'none',
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
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create New Trip Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Trip">
        <form onSubmit={handleCreateTrip} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Trip Name / Destination
            </label>
            <input
              type="text"
              required
              value={newTripName}
              onChange={(e) => { setNewTripName(e.target.value); setCreateError(''); }}
              placeholder="e.g. Summer in Tokyo, Paris Weekend"
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 14,
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Start Date
              </label>
              <input
                type="date"
                required
                value={newTripStart}
                onChange={(e) => setNewTripStart(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                End Date
              </label>
              <input
                type="date"
                required
                value={newTripEnd}
                onChange={(e) => setNewTripEnd(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Total Budget (INR)
            </label>
            <input
              type="number"
              required
              value={newTripBudget}
              onChange={(e) => setNewTripBudget(e.target.value)}
              placeholder="e.g. 50000"
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 14,
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Travelers (comma separated)
            </label>
            <input
              type="text"
              required
              value={newTripTravelers}
              onChange={(e) => { setNewTripTravelers(e.target.value); setCreateError(''); }}
              placeholder="Mohan, Charles, Alice"
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 14,
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          {createError && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>{createError}</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid var(--border-default)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                border: 'none',
                background: 'var(--accent-primary)',
                color: 'var(--accent-on-primary)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {creating ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </Modal>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      
      <DevicesModal isOpen={devicesOpen} onClose={() => setDevicesOpen(false)} />

    </>
  );
}
