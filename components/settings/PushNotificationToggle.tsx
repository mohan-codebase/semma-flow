'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, BellRing, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type State = 'idle' | 'requesting' | 'subscribed' | 'denied' | 'unsupported' | 'error';

/** Convert a base64url VAPID key to a plain ArrayBuffer for the browser Push API */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
  return arr.buffer as ArrayBuffer;
}

interface Props {
  /** Compact variant for embedding in the Topbar */
  compact?: boolean;
}

export default function PushNotificationToggle({ compact = false }: Props) {
  const [state, setState] = useState<State>('idle');
  const [endpoint, setEndpoint] = useState<string | null>(null);

  // ── Check current permission + existing subscription on mount ──────────
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }

    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setState('subscribed');
        setEndpoint(existing.endpoint);
      }
    });
  }, []);

  // ── Subscribe ──────────────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    setState('requesting');

    try {
      // 1. Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        return;
      }

      // 2. Fetch VAPID public key from our API
      const keyRes = await fetch('/api/push/subscribe');
      if (!keyRes.ok) {
        // Server not configured — show graceful UI
        setState('error');
        return;
      }
      const { data } = await keyRes.json();
      const vapidPublicKey: string = data.vapidPublicKey;

      // 3. Register / get the service worker and subscribe
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // 4. Send the subscription to our API
      const subJson = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      });

      if (!saveRes.ok) throw new Error('Failed to save subscription');

      setEndpoint(subJson.endpoint);
      setState('subscribed');
    } catch (e) {
      console.error('[PushToggle] subscribe error:', e);
      setState('error');
    }
  }, []);

  // ── Unsubscribe ────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (!endpoint) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      await sub?.unsubscribe();

      await fetch('/api/push/unsubscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });

      setEndpoint(null);
      setState('idle');
    } catch (e) {
      console.error('[PushToggle] unsubscribe error:', e);
    }
  }, [endpoint]);

  // ── Compact pill variant (Topbar) ─────────────────────────────────────
  if (compact) {
    if (state === 'unsupported') return null;

    const isOn = state === 'subscribed';
    return (
      <button
        onClick={isOn ? unsubscribe : subscribe}
        disabled={state === 'requesting'}
        aria-label={isOn ? 'Disable push notifications' : 'Enable push notifications'}
        title={isOn ? 'Notifications on — click to disable' : 'Enable habit reminders'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 9,
          border: `1px solid ${isOn ? 'var(--border-accent)' : 'var(--border-default)'}`,
          background: isOn ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
          color: isOn ? 'var(--accent-primary)' : 'var(--text-secondary)',
          cursor: state === 'requesting' ? 'wait' : 'pointer',
          transition: 'all 0.15s ease',
          position: 'relative',
        }}
      >
        {state === 'requesting'
          ? <Loader2 size={15} className="spin" />
          : isOn
          ? <BellRing size={15} />
          : <Bell size={15} />}

        {/* Live dot when subscribed */}
        {isOn && (
          <span style={{
            position: 'absolute', top: 5, right: 5,
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent-primary)',
          }} className="glow-pulse" />
        )}
      </button>
    );
  }

  // ── Full card variant (Settings page) ────────────────────────────────
  const config: Record<State, { icon: React.ReactNode; title: string; desc: string; cta?: string; ctaFn?: () => void; tone: string }> = {
    idle: {
      icon: <Bell size={18} />,
      title: 'Enable push notifications',
      desc: 'Get reminders when it\'s time to check in on your habits.',
      cta: 'Turn on notifications',
      ctaFn: subscribe,
      tone: 'var(--accent-primary)',
    },
    requesting: {
      icon: <Loader2 size={18} className="spin" />,
      title: 'Requesting permission…',
      desc: 'Check your browser\'s permission prompt.',
      tone: 'var(--text-muted)',
    },
    subscribed: {
      icon: <BellRing size={18} />,
      title: 'Notifications active',
      desc: 'You\'ll receive reminders at your habit\'s scheduled time.',
      cta: 'Turn off',
      ctaFn: unsubscribe,
      tone: 'var(--accent-primary)',
    },
    denied: {
      icon: <BellOff size={18} />,
      title: 'Notifications blocked',
      desc: 'You\'ve blocked notifications for this site. Re-enable them in your browser settings.',
      tone: 'var(--danger)',
    },
    unsupported: {
      icon: <BellOff size={18} />,
      title: 'Not supported',
      desc: 'Your browser doesn\'t support push notifications. Try Chrome or Edge.',
      tone: 'var(--text-muted)',
    },
    error: {
      icon: <AlertCircle size={18} />,
      title: 'Could not enable notifications',
      desc: 'Push notifications require VAPID keys to be configured on the server.',
      cta: 'Try again',
      ctaFn: subscribe,
      tone: 'var(--warm)',
    },
  };

  const c = config[state];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 14,
          padding: '16px 18px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--glass-highlight)',
        }}
      >
        {/* Icon chip */}
        <div style={{
          width: 38, height: 38, borderRadius: 'var(--r-md)', flexShrink: 0,
          background: state === 'subscribed' ? 'var(--accent-glow-md)' : 'var(--bg-tertiary)',
          border: `1px solid ${state === 'subscribed' ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c.tone,
        }}>
          {c.icon}
        </div>

        {/* Text + CTA */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {c.title}
            </p>
            {state === 'subscribed' && (
              <CheckCircle2 size={13} color="var(--accent-primary)" />
            )}
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
            {c.desc}
          </p>
          {c.cta && c.ctaFn && (
            <button
              onClick={c.ctaFn}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: state === 'subscribed' ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                color: state === 'subscribed' ? 'var(--text-secondary)' : 'var(--accent-on-primary)',
                border: state === 'subscribed' ? '1px solid var(--border-default)' : 'none',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {c.cta}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
