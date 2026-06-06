'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Compass, User, LogOut, Sun, Moon, Lock, Unlock, Eye, EyeOff, Shield, Globe } from 'lucide-react';
import DevicesModal from '@/components/settings/DevicesModal';
import { useRouter } from 'next/navigation';
import FitnessSummary from '@/components/dashboard/FitnessSummary';
import type { OverviewStats as OverviewStatsType } from '@/types/analytics';
import type { HabitWithEntry } from '@/types/habit';
import type { Trip, TripExpense, TripSettlement } from '@/lib/trip/types';

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
  activeTrip?: Trip | null;
  tripExpenses?: TripExpense[];
  tripSettlements?: TripSettlement[];
}

function FaceIdGlyph({ size = 68 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path d="M20 8h-4a8 8 0 0 0-8 8v4" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M52 8h4a8 8 0 0 1 8 8v4" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M20 64h-4a8 8 0 0 1-8-8v-4" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M52 64h4a8 8 0 0 0 8-8v-4" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M26 28v-3" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M46 28v-3" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M36 25v16h-4" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 47c5.7 5 16.3 5 22 0" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
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
  activeTrip,
  tripExpenses,
  tripSettlements,
}: DashboardAppProps) {
  const router = useRouter();
  const [activeApp, setActiveApp] = useState<'habits' | null>('habits');
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
    const theme = localStorage.getItem('productivity_master_theme') || 'dark';
    setIsDark(theme === 'dark');

    // One-time cleanup: older builds cached the raw passcode here.
    localStorage.removeItem('semma_flow_habits_passcode');
    localStorage.removeItem('productivity_master_active_app');

    // Does this device have a platform authenticator (Face ID / Touch ID)?
    if (typeof window !== 'undefined' && window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setBiometricSupported)
        .catch(() => setBiometricSupported(false));
    }

    // Fetch lock status quietly to populate states without showing the lock screen on mount.
    habitsUnlockedRef.current = true;
    fetchLockStatus();
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
      localStorage.setItem('productivity_master_active_app', 'habits');
      setActiveApp('habits');
      setShowLockScreen(false);
      setPasscode('');
      setConfirmPasscode('');
      setPasscodeError(null);
      window.dispatchEvent(new Event('productivity-master:active-app-changed'));
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
          localStorage.setItem('productivity_master_active_app', 'habits');
          setActiveApp('habits');
          setShowLockScreen(false);
          setPasscode('');
          setPasscodeError(null);
          window.dispatchEvent(new Event('productivity-master:active-app-changed'));
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
    localStorage.removeItem('productivity_master_active_app');
    setActiveApp(null);
    setShowLockScreen(false);
    window.dispatchEvent(new Event('productivity-master:active-app-changed'));
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
    localStorage.removeItem('productivity_master_active_app');
    setHasPasscode(false);
    setHasBiometric(false);
    setActiveApp(null);
    setShowLockScreen(false);
    setMenuOpen(false);
    window.dispatchEvent(new Event('productivity-master:active-app-changed'));
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
        localStorage.setItem('productivity_master_active_app', 'habits');
        setActiveApp('habits');
        setShowLockScreen(false);
        setPasscode('');
        setPasscodeError(null);
        window.dispatchEvent(new Event('productivity-master:active-app-changed'));
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
    localStorage.setItem('productivity_master_theme', next);
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
        activeTrip={activeTrip ?? null}
        tripExpenses={tripExpenses ?? []}
        tripSettlements={tripSettlements ?? []}
      />
    );
  }

  if (showLockScreen) {
    const canUseFaceId = lockScreenMode === 'unlock' && hasBiometric && biometricSupported;

    return (
      <div
        style={{
          background: 'radial-gradient(circle at top, color-mix(in srgb, var(--text-primary) 8%, transparent), transparent 42%), var(--bg-primary)',
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
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{
            maxWidth: 390,
            width: '100%',
            background: 'color-mix(in srgb, var(--bg-secondary) 94%, var(--text-primary) 6%)',
            border: '1px solid color-mix(in srgb, var(--text-primary) 10%, transparent)',
            borderRadius: 28,
            padding: '34px 26px 24px',
            boxShadow: '0 22px 70px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: canUseFaceId ? 104 : 70,
              height: canUseFaceId ? 104 : 70,
              borderRadius: canUseFaceId ? 30 : '50%',
              background: canUseFaceId
                ? 'linear-gradient(180deg, color-mix(in srgb, var(--text-primary) 12%, transparent), color-mix(in srgb, var(--text-primary) 4%, transparent))'
                : 'color-mix(in srgb, var(--text-primary) 9%, transparent)',
              border: '1px solid color-mix(in srgb, var(--text-primary) 10%, transparent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 22,
              color: 'var(--text-primary)',
              boxShadow: canUseFaceId ? '0 14px 34px rgba(0, 0, 0, 0.18)' : 'none',
            }}
          >
            {canUseFaceId ? <FaceIdGlyph size={70} /> : lockScreenMode === 'create' ? <Lock size={28} /> : <Unlock size={28} />}
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 760,
              color: 'var(--text-primary)',
              letterSpacing: 0,
            }}
          >
            {lockScreenMode === 'create' ? 'Set Habit Passcode' : canUseFaceId ? 'Face ID' : 'Habits Locked'}
          </h2>
          <p style={{ margin: '8px 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {lockScreenMode === 'create'
              ? 'Create a passcode to protect your habit tracking entries.'
              : canUseFaceId
                ? 'Use Face ID to unlock Habit Tracker.'
                : 'Enter your passcode to unlock Habit Tracker.'}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyPasscode();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {canUseFaceId && (
              <>
                <button
                  type="button"
                  disabled={biometricBusy}
                  onClick={handleBiometricUnlock}
                  style={{
                    width: '100%',
                    padding: '14px 0',
                    borderRadius: 16,
                    border: 'none',
                    background: 'var(--text-primary)',
                    color: 'var(--bg-primary)',
                    fontSize: 15,
                    fontWeight: 760,
                    cursor: biometricBusy ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 9,
                    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)',
                    transition: 'transform 0.15s ease, filter 0.15s ease, opacity 0.15s ease',
                    opacity: biometricBusy ? 0.72 : 1,
                  }}
                >
                  <FaceIdGlyph size={22} />
                  {biometricBusy ? 'Looking for Face ID...' : 'Use Face ID'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Passcode</span>
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
                  background: 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--text-primary) 11%, transparent)',
                  borderRadius: 16,
                  padding: '13px 42px 13px 14px',
                  fontSize: 16,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'color-mix(in srgb, var(--text-primary) 26%, transparent)')}
                onBlur={(e) => (e.target.style.borderColor = 'color-mix(in srgb, var(--text-primary) 11%, transparent)')}
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
                  background: 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--text-primary) 11%, transparent)',
                  borderRadius: 16,
                  padding: '13px 14px',
                  fontSize: 16,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'color-mix(in srgb, var(--text-primary) 26%, transparent)')}
                onBlur={(e) => (e.target.style.borderColor = 'color-mix(in srgb, var(--text-primary) 11%, transparent)')}
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
                  borderRadius: 16,
                  border: 'none',
                  background: canUseFaceId
                    ? 'color-mix(in srgb, var(--text-primary) 8%, transparent)'
                    : 'var(--text-primary)',
                  color: canUseFaceId ? 'var(--text-primary)' : 'var(--bg-primary)',
                  fontSize: 15,
                  fontWeight: 760,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {lockScreenMode === 'create' ? 'Save and Unlock' : canUseFaceId ? 'Unlock with Passcode' : 'Unlock'}
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
                  borderRadius: 16,
                  border: '1px solid color-mix(in srgb, var(--text-primary) 9%, transparent)',
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


  return (
    <>
      <FitnessSummary
        stats={stats}
        habits={habits}
        weekData={weekData}
        displayName={formattedName}
        initials={initials}
        email={email}
        activeTrip={activeTrip ?? null}
        tripExpenses={tripExpenses ?? []}
        tripSettlements={tripSettlements ?? []}
      />
      <DevicesModal isOpen={devicesOpen} onClose={() => setDevicesOpen(false)} />
    </>
  );
}
