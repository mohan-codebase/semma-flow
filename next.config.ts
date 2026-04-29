import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

// Content-Security-Policy — strict in prod, relaxed in dev for Next/Turbopack
// inline scripts + HMR. This was previously defined but never returned from
// headers(), leaving the app without any CSP at all.
const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-inline' is needed for Next/Tailwind injected styles + the theme
  // bootstrap script in app/layout.tsx. Tighten by adopting nonces if/when
  // the inline footprint is reduced.
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''}`.trim(),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  // ws:/wss: only needed in dev for HMR
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://fonts.googleapis.com https://vitals.vercel-insights.com${isDev ? ' ws: wss: http://localhost:*' : ''}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  // CI guard re-enabled: typecheck failures now block production builds.
  // Run `npm run lint` as a separate CI step (Next 16 dropped the integrated
  // `eslint` config block — `next build` no longer runs ESLint inline).
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
