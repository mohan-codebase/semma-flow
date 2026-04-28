import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn('Middleware/Server: Supabase environment variables are missing!');
    return createSSRServerClient(
      'https://placeholder.supabase.co',
      'placeholder',
      {
        cookies: {
          getAll() { return []; },
          setAll() { },
        },
      }
    );
  }

  return createSSRServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookies will be set by middleware
          }
        },
      },
    }
  );
}
