import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  
  // Use headers to determine the correct origin, especially on Vercel
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') ?? 'http';
  const origin = `${protocol}://${host}`;

  if (code) {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && user) {
      const from = searchParams.get('from') ?? '';
      
      const createdAt = new Date(user.created_at).getTime();
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : createdAt;
      const isNewUser = lastSignIn - createdAt < 10000;

      // 1. REJECT: New user trying to LOGIN
      if (from.includes('/login') && isNewUser) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/signup?error=No account found. Please sign up first to create your profile.`);
      }

      // 2. FLOW: New user trying to SIGNUP
      if (from.includes('/signup') && isNewUser) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=Account created successfully! Please sign in with Google now.`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Authentication failed. Please try again.`);
}
