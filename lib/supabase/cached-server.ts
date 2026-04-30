import { createClient } from '@supabase/supabase-js';

// Used inside `'use cache'` functions where cookies() is not available.
// Safe to use because:
//  - RLS is enforced via .eq('user_id', userId) on every query
//  - The userId arg is always validated by the non-cached auth check in the page component
export function createCachedClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
