import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/components/ui/AppProviders";

export const metadata: Metadata = {
  title: "HabitForge — Your Personal Performance OS",
  description: "Track habits, build streaks, and analyze your patterns with a premium habit tracking experience.",
  openGraph: {
    title: "HabitForge",
    description: "Your Personal Performance OS",
    type: "website",
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
        <script
          // Prevent flash of wrong theme — runs before paint.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='habitforge_theme';var s=localStorage.getItem(k);var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
