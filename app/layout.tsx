import type { Metadata, Viewport } from "next";
import { Inter, Outfit, IBM_Plex_Mono } from 'next/font/google';
import "./globals.css";
import AppProviders from "@/components/ui/AppProviders";
import ServiceWorkerRegistrar from "@/components/ui/ServiceWorkerRegistrar";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Productivity Master — Build daily habits that actually stick",
  description: "Premium habit tracker for routines, streaks, and self-growth. Track, analyze, and stay consistent — beautifully.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Productivity Master",
    description: "Premium habit tracker for routines, streaks, and self-growth.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Productivity Master",
  },
};

// NOTE: maximumScale/userScalable=false breaks pinch-zoom for low-vision users
// and is a WCAG 1.4.4 violation. Default initialScale=1 is enough — we don't
// need to lock zoom for a habit tracker.
export const viewport: Viewport = {
  themeColor: "#555555",
  width: "device-width",
  initialScale: 1,
};

import { Suspense } from 'react';

function ProvidersFallback() {
  return null; // Minimal fallback for providers
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${plexMono.variable} h-full`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon.png" />
        <link rel="shortcut icon" href="/icon.png" />
        <script
          // Prevent flash of wrong theme — runs before paint.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='productivity_master_theme';var s=localStorage.getItem(k);var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;var la=localStorage.getItem('productivity_master_light_accent')||'#7C3AED';var da=localStorage.getItem('productivity_master_dark_accent')||'#7C3AED';document.documentElement.style.setProperty('--accent-primary',t==='light'?la:da);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full">
        <Suspense fallback={<ProvidersFallback />}>
          <AppProviders>{children}</AppProviders>
        </Suspense>
        <ServiceWorkerRegistrar />
        <SpeedInsights />
      </body>
    </html>
  );
}
