'use client';

import React, { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DynamicIcon } from '@/lib/icons';
import { useInactivityLogout } from '@/lib/hooks/useInactivityLogout';

interface Props {
  /** Total idle time before logout (ms). Default 30 min. */
  timeoutMs?: number;
  /** How long before logout the warning shows (ms). Default 60 s. */
  warningMs?: number;
}

const PURPLE = '#555555';

/**
 * Signs the user out after a period of inactivity, showing a countdown
 * warning first. Mount once inside the authenticated layout.
 */
export default function InactivityGuard({ timeoutMs, warningMs }: Props) {
  const [signingOut, setSigningOut] = useState(false);

  const logout = useCallback(async () => {
    setSigningOut(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      await createClient().auth.signOut();
    } catch { /* ignore — redirect regardless so a stale session can't linger */ }
    window.location.href = '/login?reason=timeout';
  }, []);

  const { warning, secondsLeft, stayActive } = useInactivityLogout({
    timeoutMs,
    warningMs,
    onLogout: logout,
  });

  return (
    <AnimatePresence>
      {warning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="alertdialog"
          aria-modal="true"
          aria-label="Inactivity warning"
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, background: 'rgba(0, 0, 0,0.55)', backdropFilter: 'blur(4px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.94, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            style={{
              width: '100%', maxWidth: 360,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 20, padding: 24, textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0,0.35)',
            }}
          >
            <div style={{
              width: 48, height: 48, margin: '0 auto 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 14, background: `${PURPLE}1a`,
            }}>
              <DynamicIcon name="clock" size={24} color={PURPLE} />
            </div>

            <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              Still there?
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: 13.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              You&apos;ll be signed out in{' '}
              <strong style={{ color: PURPLE, fontVariantNumeric: 'tabular-nums' }}>{secondsLeft}s</strong>{' '}
              due to inactivity.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={stayActive}
                disabled={signingOut}
                style={{
                  width: '100%', padding: '11px 16px', borderRadius: 12, border: 'none',
                  background: PURPLE, color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: signingOut ? 'default' : 'pointer',
                }}
              >
                Stay signed in
              </button>
              <button
                type="button"
                onClick={logout}
                disabled={signingOut}
                style={{
                  width: '100%', padding: '11px 16px', borderRadius: 12,
                  border: '1px solid var(--border-subtle)', background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
                  cursor: signingOut ? 'default' : 'pointer',
                }}
              >
                {signingOut ? 'Signing out…' : 'Log out now'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
