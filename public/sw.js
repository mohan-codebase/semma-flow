/**
 * HabitForge Service Worker
 * Handles: Web Push notifications + basic offline shell caching
 */

const CACHE_NAME = 'habitforge-v1';

// Cache the app shell so the install prompt works
const SHELL_URLS = [
  '/',
  '/dashboard',
  '/manifest.json',
];

// ── Install: pre-cache shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Use cache-then-network for shell; ignore individual failures
      Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

// ── Activate: delete old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first, fall back to cache ──────────────────────────────
self.addEventListener('fetch', (event) => {
  // Only intercept same-origin GET requests (skip API calls, supabase, etc.)
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Clone and store successful navigation responses
        if (res.ok && event.request.mode === 'navigate') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Push: show notification ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: 'HabitForge',
    body: "Time to check in on today's habits! 🔥",
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    url: '/dashboard',
    tag: 'habitforge-reminder',
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // If JSON parse fails, use defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      renotify: true,
      data: { url: data.url },
      actions: [
        { action: 'open', title: '✅ Check in now' },
        { action: 'dismiss', title: 'Later' },
      ],
    })
  );
});

// ── Notification click: open dashboard ───────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url ?? '/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing tab if already open
        const existing = clients.find(
          (c) => new URL(c.url).pathname === new URL(targetUrl, self.location.origin).pathname
        );
        if (existing) return existing.focus();
        return self.clients.openWindow(targetUrl);
      })
  );
});
