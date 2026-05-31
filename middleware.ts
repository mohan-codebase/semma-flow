import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // We wrap this in a try-catch to prevent the entire middleware from crashing if
  // the Supabase configuration is invalid or if there's a network error.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (e) {
    console.error('Middleware: Supabase auth check failed', e);
  }

  const { pathname } = request.nextUrl;

  // Allow auth logic and callback to proceed without redirection
  if (pathname.startsWith('/auth')) {
    return supabaseResponse;
  }

  const authPaths = ['/login', '/signup', '/charttest'];
  const isAuthPath = authPaths.some(p => pathname.startsWith(p));

  // If no user and trying to access a protected route, send to login
  if (!user && !isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user is logged in, don't let them stay on login/signup
  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Exclude Next internals, static assets, and PWA files (sw.js, manifest,
    // icons) so the service worker script is served directly (200) instead of
    // being redirected — a redirected SW script fails registration.
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons/|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|json|webmanifest)$).*)',
  ],
};
