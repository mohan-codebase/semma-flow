'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Compass, User, LogOut, Sun, Moon, ArrowRight, Lock, Unlock, Eye, EyeOff, ScanFace, Shield, Globe } from 'lucide-react';
import DevicesModal from '@/components/settings/DevicesModal';
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
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Passcode Lock States
  const [showLockScreen, setShowLockScreen] = useState(false);
  const [lockScreenMode, setLockScreenMode] = useState<'create' | 'unlock'>('unlock');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [showPasscodeText, setShowPasscodeText] = useState(false);
  // True while the server passcode lookup is in flight (used to gate the
  // habits button so we never show "create" before the server answers).
  const [passcodeChecking, setPasscodeChecking] = useState(false);
  // Lock status from the server (never the code itself).
  const [hasPasscode, setHasPasscode] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  // Whether this device exposes a platform authenticator (Face ID / Touch ID).
  const [biometricSupported, setBiometricSupported] = useState(false);
  // True while a WebAuthn ceremony (enroll / unlock) is running.
  const [biometricBusy, setBiometricBusy] = useState(false);
  const habitsUnlockedRef = useRef(false);

  // Ask the server for lock status — { hasPasscode, hasBiometric } — and mirror
  // it into state. The code itself never leaves the server; verification is
  // done via POST /api/passcode/verify. `ok` is false when the server is
  // unreachable so callers can avoid bypassing the lock while offline.
  type LockStatus = { ok: boolean; hasPasscode: boolean; hasBiometric: boolean };
  const fetchLockStatus = async (): Promise<LockStatus> => {
    try {
      const res = await fetch('/api/passcode');
      const json = await res.json();
      if (res.ok && json?.data) {
        const next = {
          hasPasscode: Boolean(json.data.hasPasscode),
          hasBiometric: Boolean(json.data.hasBiometric),
        };
        setHasPasscode(next.hasPasscode);
        setHasBiometric(next.hasBiometric);
        return { ok: true, ...next };
      }
    } catch {
      // unreachable — treat as unknown
    }
    return { ok: false, hasPasscode: false, hasBiometric: false };
  };

  const formattedName = displayName
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
    .join(' ');

  useEffect(() => {
    setIsMounted(true);
    const theme = localStorage.getItem('semma_flow_theme') || 'dark';
    setIsDark(theme === 'dark');

    // One-time cleanup: older builds cached the raw passcode here. It is no
    // longer read or written — the passcode lives (hashed) on the server.
    localStorage.removeItem('semma_flow_habits_passcode');

    // Does this device have a platform authenticator (Face ID / Touch ID)?
    if (typeof window !== 'undefined' && window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setBiometricSupported)
        .catch(() => setBiometricSupported(false));
    }

    // Clear active app on initial mount to ensure they always land on the Hub
    habitsUnlockedRef.current = false;
    localStorage.removeItem('semma_flow_active_app');
    window.dispatchEvent(new Event('semma-flow:active-app-changed'));

    const handleEvent = () => {
      const current = localStorage.getItem('semma_flow_active_app');
      if (current === 'habits') {
        if (habitsUnlockedRef.current) {
          setActiveApp('habits');
          setShowLockScreen(false);
          return;
        }
        fetchLockStatus().then((status) => {
          if (status.hasPasscode) {
            setActiveApp(null);
            setShowLockScreen(true);
            setLockScreenMode('unlock');
          } else {
            setActiveApp('habits');
          }
        });
      } else {
        setActiveApp(null);
        setShowLockScreen(false);
      }
    };

    window.addEventListener('semma-flow:active-app-changed', handleEvent);

    // Resolve lock status from the server
    fetchLockStatus();

    return () => {
      window.removeEventListener('semma-flow:active-app-changed', handleEvent);
    };
  }, []);

  const handleSelectApp = async (app: 'habits' | 'trip') => {
    if (app === 'habits') {
      // Always check the server so a fresh login/device asks to UNLOCK with
      // the existing passcode rather than creating a new one.
      setPasscodeChecking(true);
      const status = await fetchLockStatus();
      setPasscodeChecking(false);
      if (!status.ok) {
        alert('Could not reach the server. Check your connection and try again.');
        return;
      }
      setPasscode('');
      setPasscodeError(null);
      if (status.hasPasscode) {
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

  const handleVerifyPasscode = async () => {
    if (lockScreenMode === 'create') {
      if (!passcode.trim()) {
        setPasscodeError('Passcode cannot be empty.');
        return;
      }
      if (passcode !== confirmPasscode) {
        setPasscodeError('Passcodes do not match.');
        return;
      }
      // Persist to the server (stored as a salted hash) so the lock works
      // across devices.
      try {
        const res = await fetch('/api/passcode', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode }),
        });
        if (!res.ok) {
          setPasscodeError('Could not save passcode. Please try again.');
          return;
        }
      } catch {
        setPasscodeError('Could not save passcode. Check your connection.');
        return;
      }
      setHasPasscode(true);
      habitsUnlockedRef.current = true;
      localStorage.setItem('semma_flow_active_app', 'habits');
      setActiveApp('habits');
      setShowLockScreen(false);
      setPasscode('');
      setConfirmPasscode('');
      setPasscodeError(null);
      window.dispatchEvent(new Event('semma-flow:active-app-changed'));
    } else {
      // Verify against the server-side hash — the code is never stored locally.
      try {
        const res = await fetch('/api/passcode/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode }),
        });
        const json = await res.json();
        if (res.ok && json?.data?.verified) {
          habitsUnlockedRef.current = true;
          localStorage.setItem('semma_flow_active_app', 'habits');
          setActiveApp('habits');
          setShowLockScreen(false);
          setPasscode('');
          setPasscodeError(null);
          window.dispatchEvent(new Event('semma-flow:active-app-changed'));
        } else if (res.ok) {
          setPasscodeError('Incorrect passcode. Please try again.');
        } else {
          setPasscodeError('Could not verify passcode. Please try again.');
        }
      } catch {
        setPasscodeError('Could not verify passcode. Check your connection.');
      }
    }
  };

  const handleBackToHub = () => {
    habitsUnlockedRef.current = false;
    localStorage.removeItem('semma_flow_active_app');
    setActiveApp(null);
    setShowLockScreen(false);
    window.dispatchEvent(new Event('semma-flow:active-app-changed'));
  };

  const handleResetPasscode = async () => {
    if (!hasPasscode) {
      alert('No passcode is currently set.');
      return;
    }

    const input = prompt('Enter your current passcode to confirm reset:');
    if (input === null) return; // cancelled

    try {
      // Confirm the current passcode server-side before removing anything.
      const verifyRes = await fetch('/api/passcode/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: input }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok || !verifyJson?.data?.verified) {
        alert('Incorrect passcode. Reset failed.');
        return;
      }

      // Removes the passcode and any biometric credentials server-side.
      const res = await fetch('/api/passcode', { method: 'DELETE' });
      if (!res.ok) {
        alert('Could not remove the lock. Please try again.');
        return;
      }
    } catch {
      alert('Could not remove the lock. Check your connection.');
      return;
    }

    habitsUnlockedRef.current = false;
    localStorage.removeItem('semma_flow_active_app');
    setHasPasscode(false);
    setHasBiometric(false);
    setActiveApp(null);
    setShowLockScreen(false);
    setMenuOpen(false);
    window.dispatchEvent(new Event('semma-flow:active-app-changed'));
    alert('Habit lock has been successfully removed.');
  };

  // Enroll this device's Face ID / Touch ID as a habit-lock unlock method.
  const handleEnrollBiometric = async () => {
    setBiometricBusy(true);
    try {
      const optRes = await fetch('/api/passcode/webauthn/register');
      const optJson = await optRes.json();
      if (!optRes.ok || !optJson?.data) {
        alert(optJson?.error || 'Could not start biometric setup.');
        return;
      }
      const { startRegistration } = await import('@simplewebauthn/browser');
      const response = await startRegistration({ optionsJSON: optJson.data });
      const verRes = await fetch('/api/passcode/webauthn/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      const verJson = await verRes.json();
      if (verRes.ok && verJson?.data?.verified) {
        setHasBiometric(true);
        setMenuOpen(false);
        alert('Face ID / Touch ID unlock is now enabled.');
      } else {
        alert(verJson?.error || 'Could not enable biometric unlock.');
      }
    } catch (e) {
      // NotAllowedError = user dismissed the OS prompt; stay quiet.
      if ((e as Error)?.name !== 'NotAllowedError') {
        alert('Biometric setup was cancelled or is unavailable on this device.');
      }
    } finally {
      setBiometricBusy(false);
    }
  };

  // Unlock the habits app with Face ID / Touch ID.
  const handleBiometricUnlock = async () => {
    setBiometricBusy(true);
    setPasscodeError(null);
    try {
      const optRes = await fetch('/api/passcode/webauthn/authenticate');
      const optJson = await optRes.json();
      if (!optRes.ok || !optJson?.data) {
        setPasscodeError('Biometric unavailable. Enter your passcode.');
        return;
      }
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const response = await startAuthentication({ optionsJSON: optJson.data });
      const verRes = await fetch('/api/passcode/webauthn/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      const verJson = await verRes.json();
      if (verRes.ok && verJson?.data?.verified) {
        habitsUnlockedRef.current = true;
        localStorage.setItem('semma_flow_active_app', 'habits');
        setActiveApp('habits');
        setShowLockScreen(false);
        setPasscode('');
        setPasscodeError(null);
        window.dispatchEvent(new Event('semma-flow:active-app-changed'));
      } else {
        setPasscodeError('Face ID failed. Try your passcode.');
      }
    } catch (e) {
      if ((e as Error)?.name !== 'NotAllowedError') {
        setPasscodeError('Face ID failed. Try your passcode.');
      }
    } finally {
      setBiometricBusy(false);
    }
  };

  // Remove this account's biometric credentials (passcode stays).
  const handleDisableBiometric = async () => {
    if (!confirm('Disable Face ID / Touch ID unlock? Your passcode will still work.')) return;
    setBiometricBusy(true);
    try {
      const res = await fetch('/api/passcode/webauthn/register', { method: 'DELETE' });
      if (!res.ok) {
        alert('Could not disable biometric unlock. Please try again.');
        return;
      }
      setHasBiometric(false);
      setMenuOpen(false);
      alert('Biometric unlock disabled.');
    } catch {
      alert('Could not disable biometric unlock. Check your connection.');
    } finally {
      setBiometricBusy(false);
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
            boxShadow: 'var(--glass-shadow), 0 10px 40px rgba(0, 0, 0,0.15)',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(85, 85, 85, 0.15)',
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
            {lockScreenMode === 'unlock' && hasBiometric && biometricSupported && (
              <>
                <button
                  type="button"
                  disabled={biometricBusy}
                  onClick={handleBiometricUnlock}
                  style={{
                    width: '100%',
                    padding: '13px 0',
                    borderRadius: 14,
                    border: '1px solid color-mix(in srgb, var(--accent-primary) 40%, var(--border-default))',
                    background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                    color: 'var(--accent-primary)',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: biometricBusy ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ScanFace size={18} />
                  {biometricBusy ? 'Waiting…' : 'Unlock with Face ID'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>or enter passcode</span>
                  <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                </div>
              </>
            )}
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
              <p style={{ margin: 0, fontSize: 13, color: '#6a6a6a', fontWeight: 600 }}>
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
                  boxShadow: '0 4px 14px rgba(85, 85, 85, 0.2)',
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
                  boxShadow: '0 10px 25px rgba(0, 0, 0,0.3)',
                }}
              >
                <div style={{ paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT_DARK }}>{formattedName}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: TEXT_MUTED, overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</p>
                </div>
                {hasBiometric ? (
                  <button
                    onClick={handleDisableBiometric}
                    disabled={biometricBusy}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: biometricBusy ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginBottom: 10,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <ScanFace size={14} />
                    Disable Face ID
                  </button>
                ) : hasPasscode && biometricSupported ? (
                  <button
                    onClick={handleEnrollBiometric}
                    disabled={biometricBusy}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid color-mix(in srgb, var(--accent-primary) 40%, var(--border-default))',
                      background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                      color: 'var(--accent-primary)',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: biometricBusy ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginBottom: 10,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <ScanFace size={14} />
                    {biometricBusy ? 'Setting up…' : 'Enable Face ID'}
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setDevicesOpen(true);
                  }}
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
                  <Shield size={14} />
                  Devices & Sessions
                </button>
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
                    background: 'rgba(104, 104, 104, 0.08)',
                    color: '#6a6a6a',
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
            whileHover={{ y: -6, scale: 1.015 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            onClick={() => { if (!passcodeChecking) handleSelectApp('habits'); }}
            style={{
              background: 'var(--bg-card)',
              border: '6px solid var(--bg-card)',
              borderRadius: 28,
              cursor: passcodeChecking ? 'wait' : 'pointer',
              opacity: passcodeChecking ? 0.7 : 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 380,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              padding: 24,
            }}
          >
            {/* Full-bleed Cover Image */}
            <img
              src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80"
              alt="Habit Tracker Cover"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 0,
              }}
            />

            {/* Dark Gradient Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0, 0, 0,0.1) 0%, rgba(0, 0, 0,0.3) 40%, rgba(0, 0, 0,0.6) 70%, rgba(0, 0, 0,0.92) 100%)',
                zIndex: 1,
              }}
            />

            {/* Top Icon Badge (Glassmorphic) */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0, 0, 0,0.1)',
                zIndex: 2,
              }}
            >
              <CheckSquare size={20} color="#ffffff" />
            </div>

            {/* Bottom Content Area */}
            <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#ffffff', fontFamily: "'Outfit', sans-serif", textShadow: '0 2px 4px rgba(0, 0, 0,0.5)' }}>
                  Habit Tracker
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.45, textShadow: '0 1px 2px rgba(0, 0, 0,0.4)' }}>
                  Build healthy routines, track streaks, and view charts to stay consistent with your habits.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'rgba(255, 255, 255, 0.95)', textShadow: '0 1px 2px rgba(0, 0, 0,0.4)' }}>
                <CheckSquare size={14} color="rgba(255, 255, 255, 0.7)" style={{ filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0,0.2))' }} />
                {stats && stats.todayTotal > 0 ? (
                  <span>
                    {stats.todayCompleted}/{stats.todayTotal}
                  </span>
                ) : (
                  <span>Active</span>
                )}
              </div>

              <div
                style={{
                  width: '100%',
                  height: 42,
                  borderRadius: 21,
                  background: '#ffffff',
                  color: '#000000',
                  fontSize: 13.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                }}
              >
                Open Habits +
              </div>
            </div>
          </motion.div>

          {/* Card 2: Trip Planner */}
          <motion.div
            whileHover={{ y: -6, scale: 1.015 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            onClick={() => handleSelectApp('trip')}
            style={{
              background: 'var(--bg-card)',
              border: '6px solid var(--bg-card)',
              borderRadius: 28,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 380,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              padding: 24,
            }}
          >
            {/* Full-bleed Cover Image */}
            <img
              src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop&q=80"
              alt="Trip Planner Cover"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 0,
              }}
            />

            {/* Dark Gradient Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0, 0, 0,0.1) 0%, rgba(0, 0, 0,0.3) 40%, rgba(0, 0, 0,0.6) 70%, rgba(0, 0, 0,0.92) 100%)',
                zIndex: 1,
              }}
            />

            {/* Top Icon Badge (Glassmorphic) */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0, 0, 0,0.1)',
                zIndex: 2,
              }}
            >
              <Compass size={20} color="#ffffff" />
            </div>

            {/* Bottom Content Area */}
            <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#ffffff', fontFamily: "'Outfit', sans-serif", textShadow: '0 2px 4px rgba(0, 0, 0,0.5)' }}>
                  Trip Planner
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.45, textShadow: '0 1px 2px rgba(0, 0, 0,0.4)' }}>
                  Plan itineraries, track travel expenses, log bookings, and settle payments with friends.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'rgba(255, 255, 255, 0.95)', textShadow: '0 1px 2px rgba(0, 0, 0,0.4)' }}>
                <Globe size={14} color="rgba(255, 255, 255, 0.7)" style={{ filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0,0.2))' }} />
                {activeTripName ? (
                  <span>{activeTripName}</span>
                ) : (
                  <span>Explore</span>
                )}
              </div>

              <div
                style={{
                  width: '100%',
                  height: 42,
                  borderRadius: 21,
                  background: '#ffffff',
                  color: '#000000',
                  fontSize: 13.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                }}
              >
                Open Trips +
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <DevicesModal isOpen={devicesOpen} onClose={() => setDevicesOpen(false)} />
    </div>
  );
}
