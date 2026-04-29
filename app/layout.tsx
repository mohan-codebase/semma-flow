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
  title: "Semma Flow — Build daily habits that actually stick",
  description: "Premium habit tracker for routines, streaks, and self-growth. Track, analyze, and stay consistent — beautifully.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Semma Flow",
    description: "Premium habit tracker for routines, streaks, and self-growth.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Semma Flow",
  },
};

// NOTE: maximumScale/userScalable=false breaks pinch-zoom for low-vision users
// and is a WCAG 1.4.4 violation. Default initialScale=1 is enough — we don't
// need to lock zoom for a habit tracker.
export const viewport: Viewport = {
  themeColor: "#10E5B0",
  width: "device-width",
  initialScale: 1,
};

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
    >
      <head>
        <script
          // Prevent flash of wrong theme — runs before paint.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='semma_flow_theme';var s=localStorage.getItem(k);var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
        <ServiceWorkerRegistrar />
        <SpeedInsights />
      </body>
    </html>
  );
}
