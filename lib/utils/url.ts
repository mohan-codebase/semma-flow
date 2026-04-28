/**
 * Returns the canonical site URL for auth redirects.
 * Priority: NEXT_PUBLIC_SITE_URL → VERCEL_URL → localhost
 * Works on both server and client.
 */
export function getSiteUrl(): string {
  // Explicit override (set this in Vercel env vars for production)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  // Vercel automatic deployment URL (preview/production)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  // Browser fallback (client components)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}
