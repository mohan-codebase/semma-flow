/**
 * Request-level cache for Supabase queries.
 *
 * Uses React's `cache()` to deduplicate identical queries within a single
 * server-component request. This prevents the N+1 problem when multiple
 * server components on the same page call the same Supabase query.
 *
 * For client-side caching (across navigations), use `swrCache` below.
 */

import { cache } from 'react';

// ---------------------------------------------------------------------------
// Server-side request cache (per-request dedup)
// ---------------------------------------------------------------------------

/**
 * Wrap a Supabase query function so it is deduplicated per request.
 *
 * Usage:
 *   const fetchHabits = cachedQuery('habits', async (supabase, userId) => {
 *     return supabase.from('habits').select('*').eq('user_id', userId);
 *   });
 *
 *   // In a server component:
 *   const result = await fetchHabits(supabase, userId);
 */
export function cachedQuery<TKey extends string, TArgs extends unknown[], TResult>(
  key: TKey,
  fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return cache(fn);
}

// ---------------------------------------------------------------------------
// Client-side SWR-style cache (cross-navigation, TTL-based)
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class QueryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private subscribers = new Map<string, Set<() => void>>();

  /**
   * Get cached data if it exists and is not stale.
   */
  get<T>(key: string, ttlMs: number): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.timestamp > ttlMs) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  /**
   * Set cached data and notify subscribers.
   */
  set<T>(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() });
    const subs = this.subscribers.get(key);
    if (subs) {
      for (const fn of subs) fn();
    }
  }

  /**
   * Invalidate a cache entry.
   */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cached data.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Subscribe to changes for a specific key.
   */
  subscribe(key: string, fn: () => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(fn);
    return () => {
      this.subscribers.get(key)?.delete(fn);
    };
  }
}

// Singleton instance — safe for client-side only
let _clientCache: QueryCache | null = null;

function getClientCache(): QueryCache {
  if (typeof window === 'undefined') {
    throw new Error('QueryCache is client-side only');
  }
  if (!_clientCache) {
    _clientCache = new QueryCache();
  }
  return _clientCache;
}

/**
 * Fetch data with client-side caching.
 *
 * Usage in a client component or hook:
 *   const data = await fetchCached('/api/habits', 'habits', 60_000);
 */
export async function fetchCached<T>(
  url: string,
  cacheKey: string,
  ttlMs: number = 60_000
): Promise<T> {
  const cached = getClientCache().get<T>(cacheKey, ttlMs);
  if (cached !== null) return cached;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const json: T = await res.json();
  getClientCache().set(cacheKey, json);
  return json;
}

/**
 * Invalidate a client-side cache entry.
 * Call this after mutations to ensure fresh data on next fetch.
 */
export function invalidateCache(key: string): void {
  if (typeof window !== 'undefined') {
    getClientCache().invalidate(key);
  }
}

/**
 * Clear all client-side caches.
 */
export function clearAllCache(): void {
  if (typeof window !== 'undefined') {
    getClientCache().clear();
  }
}
