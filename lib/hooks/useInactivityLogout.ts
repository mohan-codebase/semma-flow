'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  /** Total idle time before logout (ms). Default 30 min. */
  timeoutMs?: number;
  /** How long before logout the warning shows (ms). Default 60 s. */
  warningMs?: number;
  /** Called when the idle deadline is reached. */
  onLogout: () => void;
}

interface Result {
  /** True while the pre-logout warning is showing. */
  warning: boolean;
  /** Whole seconds left before logout (only meaningful while `warning`). */
  secondsLeft: number;
  /** Dismiss the warning and restart the idle clock. */
  stayActive: () => void;
}

const ACTIVITY_KEY = 'productivity_master_last_activity';
// Passive UI signals that count as "the user is here". Kept short on purpose.
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'wheel', 'mousemove'] as const;
// Ignore repeat activity within this window so a moving mouse doesn't re-arm
// the timers (and hit localStorage) on every frame.
const THROTTLE_MS = 1000;

/**
 * Logs the user out after a period of inactivity.
 *
 * RAM/perf notes: one shared throttle guards all listeners, every listener is
 * passive, the per-second countdown ticks *only* during the warning window,
 * and activity is mirrored to localStorage so multiple open tabs stay in sync
 * (activity in any tab keeps them all signed in). On tab re-focus the elapsed
 * time is re-checked, so a slept/suspended machine logs out immediately rather
 * than relying on a setTimeout that never fired.
 */
export function useInactivityLogout({
  timeoutMs = 30 * 60 * 1000,
  warningMs = 60 * 1000,
  onLogout,
}: Options): Result {
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(warningMs / 1000));

  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivity = useRef(Date.now());
  const warningRef = useRef(false);
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;

  const clearTimers = useCallback(() => {
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (tick.current) clearInterval(tick.current);
    warnTimer.current = logoutTimer.current = tick.current = null;
  }, []);

  const beginWarning = useCallback(() => {
    warningRef.current = true;
    setWarning(true);
    const deadline = Date.now() + warningMs;
    setSecondsLeft(Math.ceil(warningMs / 1000));
    tick.current = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 1000);
  }, [warningMs]);

  // (Re)start the idle clock from now.
  const arm = useCallback(() => {
    clearTimers();
    warningRef.current = false;
    setWarning(false);
    warnTimer.current = setTimeout(beginWarning, Math.max(0, timeoutMs - warningMs));
    logoutTimer.current = setTimeout(() => onLogoutRef.current(), timeoutMs);
  }, [clearTimers, beginWarning, timeoutMs, warningMs]);

  const stayActive = useCallback(() => {
    lastActivity.current = Date.now();
    try { localStorage.setItem(ACTIVITY_KEY, String(lastActivity.current)); } catch { /* ignore */ }
    arm();
  }, [arm]);

  useEffect(() => {
    lastActivity.current = Date.now();
    arm();

    const onActivity = () => {
      // During the warning, only an explicit "Stay signed in" resets the clock
      // — otherwise reaching for the button would cancel the very logout it's
      // warning about and the countdown could never complete.
      if (warningRef.current) return;
      const now = Date.now();
      if (now - lastActivity.current < THROTTLE_MS) return;
      lastActivity.current = now;
      try { localStorage.setItem(ACTIVITY_KEY, String(now)); } catch { /* ignore */ }
      arm();
    };

    // Activity in another tab keeps this one alive too.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== ACTIVITY_KEY || !e.newValue) return;
      lastActivity.current = Number(e.newValue);
      arm();
    };

    // Re-focusing after the machine slept: setTimeout may not have fired.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastActivity.current >= timeoutMs) {
        clearTimers();
        onLogoutRef.current();
      }
    };

    for (const ev of ACTIVITY_EVENTS) window.addEventListener(ev, onActivity, { passive: true });
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearTimers();
      for (const ev of ACTIVITY_EVENTS) window.removeEventListener(ev, onActivity);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [arm, clearTimers, timeoutMs]);

  return { warning, secondsLeft, stayActive };
}
