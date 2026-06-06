import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// Shared helpers for /api/trip/* routes — same { data, error } envelope used
// across Productivity Master's API.
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
export function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

/** Resolve the authed Supabase client + user, or null when unauthenticated. */
export async function getAuth(): Promise<
  { supabase: SupabaseClient; user: User } | null
> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}
