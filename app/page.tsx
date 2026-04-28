import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Hero from '@/components/landing/Hero';
import Navbar from '@/components/landing/Navbar';

export default async function LandingPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

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
