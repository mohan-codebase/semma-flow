import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';
import CTABanner from '@/components/landing/CTABanner';

export const metadata: Metadata = {
  title: 'HabitForge — Build habits that actually stick.',
  description:
    'The performance-grade habit tracker for builders, athletes, and lifelong learners. Streaks, analytics, mood tracking, and achievements — all in one place.',
  openGraph: {
    title: 'HabitForge — Build habits that actually stick.',
    description: 'Track habits with precision. Analyse your patterns. Level up your life.',
    type: 'website',
  },
};

export default async function LandingPage() {
  // Redirect authenticated users straight to the dashboard
  let user = null;
  try {
    const supabase = await createServerClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    // Supabase not configured in this environment — show landing page
  }

  if (user) redirect('/dashboard');

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <CTABanner />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
