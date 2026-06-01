'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Compass, User, LogOut, Sun, Moon, ArrowRight, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FitnessSummary from '@/components/dashboard/FitnessSummary';
import type { OverviewStats as OverviewStatsType } from '@/types/analytics';
import type { HabitWithEntry } from '@/types/habit';

interface DashboardAppProps {
  stats: OverviewStatsType | null;
  habits: HabitWithEntry[];
  weekData: { date: string; percentage: number; isToday: boolean }[];
  displayName: string;
  initials: string;
  email: string;
  greeting: string;
  heroLine: string;
  heroPct: number;
  dayName: string;
  dateStr: string;
  activeTripName?: string;
}

export default function DashboardApp({
  stats,
  habits,
  weekData,
  displayName,
  initials,
  email,
  greeting,
  heroLine,
  heroPct,
  dayName,
  dateStr,
  activeTripName,
}: DashboardAppProps) {
  const router = useRouter();
  const [activeApp, setActiveApp] = useState<'habits' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Passcode Lock States
  const [showLockScreen, setShowLockScreen] = useState(false);
  const [lockScreenMode, setLockScreenMode] = useState<'create' | 'unlock'>('unlock');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [showPasscodeText, setShowPasscodeText] = useState(false);

  const formattedName = displayName
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
    .join(' ');

  useEffect(() => {
    setIsMounted(true);
    const theme = localStorage.getItem('semma_flow_theme') || 'dark';
    setIsDark(theme === 'dark');

    const savedActive = localStorage.getItem('semma_flow_active_app');
    const passcodeSaved = localStorage.getItem('semma_flow_habits_passcode');

    if (savedActive === 'habits') {
      if (passcodeSaved) {
        setActiveApp(null);
        setShowLockScreen(true);
        setLockScreenMode('unlock');
      } else {
        setActiveApp('habits');
      }
    }
  }, []);

  const handleSelectApp = (app: 'habits' | 'trip') => {
    if (app === 'habits') {
      const passcodeSaved = localStorage.getItem('semma_flow_habits_passcode');
      if (passcodeSaved) {
        setLockScreenMode('unlock');
        setShowLockScreen(true);
      } else {
        setLockScreenMode('create');
        setShowLockScreen(true);
      }
    } else {
      router.push('/trip');
    }
  };

  const handleVerifyPasscode = () => {
    if (lockScreenMode === 'create') {
      if (!passcode.trim()) {
        setPasscodeError('Passcode cannot be empty.');
        return;
      }
      if (passcode !== confirmPasscode) {
        setPasscodeError('Passcodes do not match.');
        return;
      }
      localStorage.setItem('semma_flow_habits_passcode', passcode);
      localStorage.setItem('semma_flow_active_app', 'habits');
      setActiveApp('habits');
      setShowLockScreen(false);
      setPasscode('');
      setConfirmPasscode('');
      setPasscodeError(null);
    } else {
      const savedPasscode = localStorage.getItem('semma_flow_habits_passcode');
      if (passcode === savedPasscode) {
        localStorage.setItem('semma_flow_active_app', 'habits');
        setActiveApp('habits');
        setShowLockScreen(false);
        setPasscode('');
        setPasscodeError(null);
      } else {
        setPasscodeError('Incorrect passcode. Please try again.');
      }
    }
  };

  const handleBackToHub = () => {
    localStorage.removeItem('semma_flow_active_app');
    setActiveApp(null);
    setShowLockScreen(false);
  };

  const handleResetPasscode = () => {
    const savedPasscode = localStorage.getItem('semma_flow_habits_passcode');
    if (!savedPasscode) {
      alert('No passcode is currently set.');
      return;
    }

    const input = prompt('Enter your current passcode to confirm reset:');
    if (input === null) return; // cancelled

    if (input === savedPasscode) {
      localStorage.removeItem('semma_flow_habits_passcode');
      localStorage.removeItem('semma_flow_active_app');
      setActiveApp(null);
      setShowLockScreen(false);
      setMenuOpen(false);
      alert('Habit lock has been successfully removed.');
    } else {
      alert('Incorrect passcode. Reset failed.');
    }
  };

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('semma_flow_theme', next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
  };

  const handleSignOut = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      await createClient().auth.signOut();
      window.location.href = '/';
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  if (!isMounted) return null;

  if (activeApp === 'habits') {
    return (
      <FitnessSummary
        stats={stats}
        habits={habits}
        weekData={weekData}
        displayName={formattedName}
        initials={initials}
        email={email}
        onBackToHub={handleBackToHub}
      />
    );
  }

  if (showLockScreen) {
    return (
      <div
        style={{
          background: 'var(--bg-primary)',
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{
            maxWidth: 400,
            width: '100%',
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 8%, transparent) 0%, var(--bg-card) 100%)',
            border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, var(--border-default))',
            borderRadius: 24,
            padding: '36px 28px',
            boxShadow: 'var(--glass-shadow), 0 10px 40px rgba(0,0,0,0.15)',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(124, 58, 237, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              color: 'var(--accent-primary)',
            }}
          >
            {lockScreenMode === 'create' ? <Lock size={28} /> : <Unlock size={28} />}
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {lockScreenMode === 'create' ? 'Set Habit Passcode' : 'Habits Locked'}
          </h2>
          <p style={{ margin: '8px 0 24px', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {lockScreenMode === 'create'
              ? 'Secure your habit tracking entries. Create a password to restrict access.'
              : 'Habit Tracker is password protected. Enter your passcode to continue.'}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyPasscode();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                autoFocus
                type={showPasscodeText ? 'text' : 'password'}
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPasscodeError(null);
                }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'var(--input-bg)',
                  border: '1.5px solid var(--input-border)',
                  borderRadius: 12,
                  padding: '12px 42px 12px 14px',
                  fontSize: 15,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
              />
              <button
                type="button"
                onClick={() => setShowPasscodeText(!showPasscodeText)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPasscodeText ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {lockScreenMode === 'create' && (
              <input
                type={showPasscodeText ? 'text' : 'password'}
                placeholder="Confirm passcode"
                value={confirmPasscode}
                onChange={(e) => {
                  setConfirmPasscode(e.target.value);
                  setPasscodeError(null);
                }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'var(--input-bg)',
                  border: '1.5px solid var(--input-border)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontSize: 15,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
              />
            )}

            {passcodeError && (
              <p style={{ margin: 0, fontSize: 13, color: '#EF4444', fontWeight: 600 }}>
                {passcodeError}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '13px 0',
                  borderRadius: 14,
                  border: 'none',
                  background: 'var(--accent-primary)',
                  color: 'var(--accent-on-primary)',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.2)',
                  transition: 'all 0.15s ease',
                }}
              >
                {lockScreenMode === 'create' ? 'Save & Unlock' : 'Unlock App'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLockScreen(false);
                  setPasscode('');
                  setConfirmPasscode('');
                  setPasscodeError(null);
                }}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderRadius: 14,
                  border: '1px solid var(--border-default)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  const TEXT_DARK = 'var(--text-primary)';
  const TEXT_MUTED = 'var(--text-muted)';

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        minHeight: '100dvh',
        paddingBottom: 48,
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 36,
            paddingBottom: 24,
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: 40,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              App Hub
            </p>
            <h1
              style={{
                margin: '4px 0 0',
                fontSize: 28,
                fontWeight: 800,
                color: TEXT_DARK,
                letterSpacing: '-0.02em',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {greeting}, {formattedName.split(' ')[0]} 👋
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: TEXT_MUTED,
                transition: 'all 0.15s ease',
              }}
            >
              {isDark ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Open profile menu"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <User size={19} color={TEXT_MUTED} />
            </button>
          </div>
        </header>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 100 }}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: 90,
                  right: 24,
                  zIndex: 101,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 16,
                  padding: 16,
                  width: 240,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT_DARK }}>{formattedName}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: TEXT_MUTED, overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</p>
                </div>
                <button
                  onClick={handleResetPasscode}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 10,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Lock size={14} />
                  Reset Habit Lock
                </button>
                <button
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#EF4444',
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Apps Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
            marginTop: 20,
          }}
        >
          {/* Card 1: Habit Tracker */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => handleSelectApp('habits')}
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 12%, transparent) 0%, var(--bg-card) 100%)',
              border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, var(--border-default))',
              borderRadius: 24,
              padding: 28,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 260,
              boxShadow: 'var(--glass-shadow), 0 8px 30px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ambient Background glow */}
            <div
              style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
              }}
            />

            <div>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <CheckSquare size={24} color="var(--accent-primary)" />
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
                Habit Tracker
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Build healthy routines, track streaks, and view charts to stay consistent with your habits.
              </p>
            </div>

            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)' }}>
                {stats && stats.todayTotal > 0 ? (
                  <span>
                    {stats.todayCompleted}/{stats.todayTotal} done ({stats.todayPercentage}%)
                  </span>
                ) : (
                  <span>Log your daily habits</span>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                }}
              >
                Open Habits <ArrowRight size={15} />
              </div>
            </div>
          </motion.div>

          {/* Card 2: Trip Planner */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => handleSelectApp('trip')}
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--cyan) 12%, transparent) 0%, var(--bg-card) 100%)',
              border: '1px solid color-mix(in srgb, var(--cyan) 25%, var(--border-default))',
              borderRadius: 24,
              padding: 28,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 260,
              boxShadow: 'var(--glass-shadow), 0 8px 30px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ambient Background glow */}
            <div
              style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'color-mix(in srgb, var(--cyan) 15%, transparent)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
              }}
            />

            <div>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: 'color-mix(in srgb, var(--cyan) 15%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Compass size={24} color="var(--cyan)" />
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
                Trip Planner
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Plan itineraries, track travel expenses, log bookings, and settle payments with friends.
              </p>
            </div>

            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                {activeTripName ? (
                  <span>Active Trip: {activeTripName}</span>
                ) : (
                  <span>Plan your next adventure</span>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--cyan)',
                }}
              >
                Open Trips <ArrowRight size={15} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
