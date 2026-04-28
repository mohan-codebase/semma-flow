import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Hero from '@/components/landing/Hero';
import Navbar from '@/components/landing/Navbar';

export default async function LandingPage() {
  let user = null;
  try {
    const supabase = await createServerClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (err) {
    console.error('Failed to fetch user:', err);
  }

  // If user is logged in, skip the landing page entirely
  if (user) {
    redirect('/dashboard');
  }

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Hero />
      </main>
    </>
  );
}
