'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker at /sw.js.
 * This component is mounted in the root layout body so it runs on every page.
 * It is a no-op in environments that don't support service workers (e.g., Firefox private, Safari <16).
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] Registered, scope:', reg.scope);
      })
      .catch((err) => {
        // Non-fatal — app still works without SW
        console.warn('[SW] Registration failed:', err);
      });
  }, []);

  return null; // renders nothing
}
