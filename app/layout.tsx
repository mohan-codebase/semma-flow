import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/components/ui/AppProviders";
import ServiceWorkerRegistrar from "@/components/ui/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "HabitForge — Your Personal Performance OS",
  description: "Track habits, build streaks, and analyze your patterns with a premium habit tracking experience.",
  manifest: "/manifest.json",
  openGraph: {
    title: "HabitForge",
    description: "Your Personal Performance OS",
    type: "website",
  },
  // PWA / mobile meta
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HabitForge",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

        {/* PWA */}
        <meta name="theme-color" content="#10E5B0" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

        <script
          // Prevent flash of wrong theme — runs before paint.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='habitforge_theme';var s=localStorage.getItem(k);var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
        {/* Registers /sw.js — safe no-op in browsers that don't support SW */}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
