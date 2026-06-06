'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import {
  BarChart2,
  CalendarRange,
  FileText,
  LayoutDashboard,
  Luggage,
  Menu,
  Mountain,
  Receipt,
  Repeat,
  Settings2,
  Ticket,
  X,
  Search,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import DevicesModal from '@/components/settings/DevicesModal';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import CommandPalette from '@/components/layout/CommandPalette';
import NotificationBell from '@/components/layout/NotificationBell';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useTheme } from '@/components/ui/ThemeProvider';
import Modal from '@/components/ui/Modal';
import type { Trip } from '@/lib/trip/types';

const NAV = [
  { href: '/trip', label: 'Overview', icon: LayoutDashboard },
  { href: '/trip/expenses', label: 'Expenses', icon: Receipt },
  { href: '/trip/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/trip/bookings', label: 'Bookings', icon: Ticket },
  { href: '/trip/itinerary', label: 'Itinerary', icon: CalendarRange },
  { href: '/trip/packing', label: 'Packing', icon: Luggage },
  { href: '/trip/documents', label: 'Documents', icon: FileText },
  { href: '/trip/settings', label: 'Settings', icon: Settings2 },
];

function isActive(pathname: string, href: string) {
  if (href === '/trip') return pathname === '/trip';
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface TripNavProps {
  trips: Trip[];
  activeTrip: Trip;
}

export default function TripNav({ trips = [], activeTrip }: TripNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { theme, toggle } = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPalette] = useState(false);
  const [devicesOpen, setDevicesOpen] = useState(false);

  // New Trip form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripStart, setNewTripStart] = useState('');
  const [newTripEnd, setNewTripEnd] = useState('');
  const [newTripBudget, setNewTripBudget] = useState('80000');
  const [newTripTravelers, setNewTripTravelers] = useState('Mohan, Charles');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const isDark = theme === 'dark';
  const PURPLE = '#555555';
  const PURPLE_LIGHT = 'rgba(85, 85, 85,0.08)';
  const TEXT_DARK = isDark ? '#ffffff' : '#1f1f1f';
  const TEXT_MUTED = isDark ? 'rgba(255, 255, 255,0.60)' : 'rgba(19, 19, 19,0.55)';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPalette((o) => !o);
      }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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

      // 1. Create trip
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

      // 2. Select trip
      const selectRes = await fetch('/api/trip/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: tripJson.data.id }),
      });
      if (!selectRes.ok) throw new Error('Failed to activate new trip');

      // 3. Reload page
      setShowCreateModal(false);
      window.location.reload();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setCreating(false);
    }
  };

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

  const linkStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    color: active ? 'var(--accent-light)' : 'var(--text-muted)',
    background: active ? 'var(--accent-glow)' : 'transparent',
    border: `1px solid ${active ? 'var(--border-accent)' : 'transparent'}`,
    transition: 'color 0.15s, background 0.15s',
  });

  return (
    <>
      {/* Desktop Sidebar is rendered by layout.tsx */}

      <header
        className="trip-topbar"
        style={{
          height: 64,
          padding: '0 12px',
          background: 'var(--bg-glass)',
          borderBottom: '1px solid color-mix(in srgb, var(--border-default) 70%, transparent)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Brand logo & titles */}
        <Link
          href="/dashboard"
          style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, textDecoration: 'none' }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={20} strokeWidth={2.4} color="var(--accent-on-primary)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                color: 'var(--text-primary)',
              }}
            >
              Productivity Master
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontWeight: 600,
                marginTop: 1,
              }}
            >
              Habit Tracker
            </span>
          </div>
        </Link>


        {/* Right: Hamburger button to open mobile-like menu */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)',
          }}
        >
          <Menu size={18} />
        </button>
      </header>

      {/* Mobile Bottom Sheet (matching Productivity Master profile bottom-sheet layout) */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 399, background: 'rgba(0, 0, 0,0.45)' }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 400,
                maxHeight: '93dvh',
                background: 'var(--bg-primary)',
                borderRadius: '24px 24px 0 0',
                fontFamily: "system-ui, -apple-system, sans-serif",
                overflowY: 'auto',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              {/* Inner centered column */}
              <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 48px', display: 'flex', flexDirection: 'column' }}>

                {/* Drag handle */}
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 4 }}>
                  <div style={{ width: 40, height: 4, borderRadius: 'var(--r-pill)', background: isDark ? 'rgba(255, 255, 255,0.18)' : 'rgba(85, 85, 85,0.18)' }} />
                </div>

                {/* Top bar */}
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 8 }}
                >
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isDark ? 'rgba(255, 255, 255,0.60)' : 'rgba(50, 50, 50,0.70)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Trip Planner
                  </p>
                  <button onClick={() => setOpen(false)} style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: isDark ? 'rgba(255, 255, 255,0.10)' : 'rgba(85, 85, 85,0.08)',
                    border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}>
                    <X size={18} color={PURPLE} />
                  </button>
                </motion.div>

                {/* User Profile Card */}
                {user && (
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
                      boxShadow: isDark
                        ? '0 8px 32px rgba(0, 0, 0,0.45), inset 0 1px 0 rgba(255, 255, 255,0.16), 0 0 0 1px rgba(255, 255, 255,0.08)'
                        : '0 4px 24px rgba(99, 99, 99,0.12), inset 0 1px 0 rgba(255, 255, 255,1), 0 0 0 1px rgba(255, 255, 255,0.90)',
                      border: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                      <div style={{
                        width: 68, height: 68, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${PURPLE} 0%, #727272 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {displayName}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: TEXT_MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: isDark ? 'rgba(255, 255, 255,0.08)' : 'rgba(85, 85, 85,0.10)', margin: '20px 0' }} />

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[
                        { label: 'Destination', value: activeTrip?.name ?? 'Trip' },
                        { label: 'Travelers', value: String(activeTrip?.travelers?.length ?? 0) },
                        { label: 'Active Plan', value: 'Trip' },
                      ].map(({ label, value }) => (
                        <div key={label} style={{
                          flex: 1,
                          background: isDark
                            ? 'linear-gradient(155deg, rgba(85, 85, 85,0.22) 0%, rgba(85, 85, 85,0.10) 100%)'
                            : 'linear-gradient(155deg, rgba(85, 85, 85,0.12) 0%, rgba(85, 85, 85,0.06) 100%)',
                          borderRadius: 14,
                          padding: '12px 10px', textAlign: 'center',
                          boxShadow: isDark
                            ? 'inset 0 1px 0 rgba(255, 255, 255,0.14), 0 0 0 1px rgba(85, 85, 85,0.28)'
                            : 'inset 0 1px 0 rgba(255, 255, 255,0.90), 0 0 0 1px rgba(85, 85, 85,0.14)',
                        }}>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: TEXT_DARK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: TEXT_MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Switch Trips Section */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, type: 'spring', damping: 28, stiffness: 280 }}
                  style={{
                    marginTop: 16,
                    background: isDark
                      ? 'linear-gradient(155deg, rgba(255, 255, 255,0.10) 0%, rgba(255, 255, 255,0.04) 100%)'
                      : 'linear-gradient(155deg, rgba(255, 255, 255,0.82) 0%, rgba(255, 255, 255,0.55) 100%)',
                    borderRadius: 24, padding: '16px 20px',
                    boxShadow: isDark
                      ? '0 8px 32px rgba(0, 0, 0,0.40), inset 0 1px 0 rgba(255, 255, 255,0.16), 0 0 0 1px rgba(255, 255, 255,0.08)'
                      : '0 4px 24px rgba(99, 99, 99,0.10), inset 0 1px 0 rgba(255, 255, 255,1), 0 0 0 1px rgba(255, 255, 255,0.90)',
                    border: 'none',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Your Trips
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                    {trips.map((t) => {
                      const isCurrent = t.id === activeTrip?.id;
                      return (
                        <button
                          key={t.id}
                          onClick={async () => {
                            if (isCurrent) return;
                            setOpen(false);
                            await fetch('/api/trip/select', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ tripId: t.id }),
                            });
                            window.location.reload();
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            borderRadius: 14,
                            border: 'none',
                            background: isCurrent ? 'var(--accent-glow-md)' : 'var(--bg-tertiary)',
                            color: isCurrent ? 'var(--accent-light)' : TEXT_DARK,
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div>
                            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>{t.name}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: TEXT_MUTED }}>
                              {t.start_date.slice(0, 10)} to {t.end_date.slice(0, 10)}
                            </p>
                          </div>
                          {isCurrent && <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--accent-primary)', color: 'var(--accent-on-primary)', padding: '2px 8px', borderRadius: 8 }}>Active</span>}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => { setShowCreateModal(true); setOpen(false); }}
                    style={{
                      marginTop: 12,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 0',
                      borderRadius: 14,
                      border: '1px dashed var(--border-medium)',
                      background: 'transparent',
                      color: 'var(--accent-light)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    + Create New Trip
                  </button>
                </motion.div>

                {/* Theme Mode Toggle Row */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, type: 'spring', damping: 28, stiffness: 280 }}
                  style={{
                    marginTop: 16,
                    background: isDark
                      ? 'linear-gradient(155deg, rgba(255, 255, 255,0.10) 0%, rgba(255, 255, 255,0.04) 100%)'
                      : 'linear-gradient(155deg, rgba(255, 255, 255,0.82) 0%, rgba(255, 255, 255,0.55) 100%)',
                    borderRadius: 24, padding: '16px 20px',
                    boxShadow: isDark
                      ? '0 8px 32px rgba(0, 0, 0,0.40), inset 0 1px 0 rgba(255, 255, 255,0.16), 0 0 0 1px rgba(255, 255, 255,0.08)'
                      : '0 4px 24px rgba(99, 99, 99,0.10), inset 0 1px 0 rgba(255, 255, 255,1), 0 0 0 1px rgba(255, 255, 255,0.90)',
                    border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isDark ? <Moon size={18} color="#999999" /> : <Sun size={18} color="#a6a6a6" />}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: TEXT_DARK }}>{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                      <p style={{ margin: '1px 0 0', fontSize: 12, color: TEXT_MUTED }}>Premium theme</p>
                    </div>
                  </div>
                  <ThemeToggle />
                </motion.div>

                {/* Security & Devices Toggle Row */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, type: 'spring', damping: 28, stiffness: 280 }}
                  onClick={() => {
                    setOpen(false);
                    setDevicesOpen(true);
                  }}
                  style={{
                    marginTop: 16,
                    background: isDark
                      ? 'linear-gradient(155deg, rgba(255, 255, 255,0.10) 0%, rgba(255, 255, 255,0.04) 100%)'
                      : 'linear-gradient(155deg, rgba(255, 255, 255,0.82) 0%, rgba(255, 255, 255,0.55) 100%)',
                    borderRadius: 24, padding: '16px 20px',
                    boxShadow: isDark
                      ? '0 8px 32px rgba(0, 0, 0,0.40), inset 0 1px 0 rgba(255, 255, 255,0.16), 0 0 0 1px rgba(255, 255, 255,0.08)'
                      : '0 4px 24px rgba(99, 99, 99,0.10), inset 0 1px 0 rgba(255, 255, 255,1), 0 0 0 1px rgba(255, 255, 255,0.90)',
                    border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={18} color="#999999" />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: TEXT_DARK }}>Devices & Sessions</p>
                      <p style={{ margin: '1px 0 0', fontSize: 12, color: TEXT_MUTED }}>Manage active logins</p>
                    </div>
                  </div>
                  <ChevronRight size={16} color={TEXT_MUTED} />
                </motion.div>

                {/* Navigation Pages List */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, type: 'spring', damping: 28, stiffness: 280 }}
                  style={{
                    marginTop: 16,
                    background: isDark
                      ? 'linear-gradient(155deg, rgba(255, 255, 255,0.10) 0%, rgba(255, 255, 255,0.04) 100%)'
                      : 'linear-gradient(155deg, rgba(255, 255, 255,0.82) 0%, rgba(255, 255, 255,0.55) 100%)',
                    borderRadius: 24, overflow: 'hidden',
                    boxShadow: isDark
                      ? '0 8px 32px rgba(0, 0, 0,0.40), inset 0 1px 0 rgba(255, 255, 255,0.16), 0 0 0 1px rgba(255, 255, 255,0.08)'
                      : '0 4px 24px rgba(99, 99, 99,0.10), inset 0 1px 0 rgba(255, 255, 255,1), 0 0 0 1px rgba(255, 255, 255,0.90)',
                    border: 'none',
                  }}
                >
                  {NAV.map(({ href, label, icon: Icon }, idx) => {
                    const active = isActive(pathname, href);
                    return (
                      <div key={href}>
                        {idx > 0 && <div style={{ height: 1, background: isDark ? 'rgba(255, 255, 255,0.06)' : 'rgba(85, 85, 85,0.06)', marginLeft: 62 }} />}
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '14px 20px',
                            background: active ? 'var(--accent-glow)' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            textDecoration: 'none',
                          }}
                        >
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: active ? 'var(--accent-glow-md)' : PURPLE_LIGHT,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Icon size={18} color={active ? 'var(--accent-primary)' : PURPLE} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: active ? 700 : 600, color: active ? 'var(--accent-primary)' : TEXT_DARK }}>
                              {label}
                            </p>
                          </div>
                          <ChevronRight size={16} color={TEXT_MUTED} />
                        </Link>
                      </div>
                    );
                  })}
                </motion.div>

                {/* Bottom Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.26, type: 'spring', damping: 28, stiffness: 280 }}
                  >
                    <button
                      onClick={() => { setOpen(false); router.push('/dashboard'); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        padding: '16px 0',
                        borderRadius: 20,
                        border: 'none',
                        background: 'var(--accent-primary)',
                        color: 'var(--accent-on-primary)',
                        cursor: 'pointer',
                        fontSize: 15,
                        fontWeight: 700,
                        boxShadow: '0 4px 14px rgba(85, 85, 85,0.25)',
                      }}
                    >
                      <Repeat size={16} />
                      Switch to Habit Tracker
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28, type: 'spring', damping: 28, stiffness: 280 }}
                  >
                    <button
                      onClick={() => { setPalette(true); setOpen(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        padding: '16px 0',
                        borderRadius: 20,
                        border: isDark ? '1px solid rgba(255, 255, 255,0.08)' : '1px solid rgba(85, 85, 85,0.12)',
                        background: isDark
                          ? 'linear-gradient(155deg, rgba(255, 255, 255,0.08) 0%, rgba(255, 255, 255,0.03) 100%)'
                          : 'linear-gradient(155deg, rgba(255, 255, 255,0.7) 0%, rgba(255, 255, 255,0.4) 100%)',
                        color: TEXT_DARK,
                        cursor: 'pointer',
                        fontSize: 15,
                        fontWeight: 600,
                      }}
                    >
                      <Search size={16} />
                      Search (⌘K)
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.30, type: 'spring', damping: 28, stiffness: 280 }}
                  >
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '16px 0',
                        borderRadius: 20,
                        border: 'none',
                        background: isDark
                          ? 'linear-gradient(155deg, rgba(104, 104, 104,0.18) 0%, rgba(104, 104, 104,0.10) 100%)'
                          : 'linear-gradient(155deg, rgba(255, 255, 255,0.80) 0%, rgba(235, 235, 235,0.60) 100%)',
                        color: isDark ? '#8e8e8e' : '#4d4d4d',
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        boxShadow: isDark
                          ? 'inset 0 1px 0 rgba(255, 255, 255,0.14), 0 0 0 1px rgba(104, 104, 104,0.22)'
                          : 'inset 0 1px 0 rgba(255, 255, 255,1), 0 0 0 1px rgba(104, 104, 104,0.18)',
                      }}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </motion.div>
                </div>

                <p style={{ paddingTop: 32, textAlign: 'center', fontSize: 11, color: TEXT_MUTED, margin: 0 }}>
                  Productivity Master · Trip Planner · v1.0
                </p>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Trip" closeOnOutsideClick={false}>
        <form onSubmit={handleCreateTrip} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Trip Name
            </label>
            <input
              type="text"
              required
              value={newTripName}
              onChange={(e) => { setNewTripName(e.target.value); setCreateError(''); }}
              placeholder="e.g. Europe Backpacking"
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
                onChange={(e) => { setNewTripStart(e.target.value); setCreateError(''); }}
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
                onChange={(e) => { setNewTripEnd(e.target.value); setCreateError(''); }}
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
              Total Budget (₹)
            </label>
            <input
              type="number"
              min={0}
              required
              value={newTripBudget}
              onChange={(e) => { setNewTripBudget(e.target.value); setCreateError(''); }}
              placeholder="80000"
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

      <CommandPalette isOpen={paletteOpen} onClose={() => setPalette(false)} />
      <DevicesModal isOpen={devicesOpen} onClose={() => setDevicesOpen(false)} />
    </>
  );
}
