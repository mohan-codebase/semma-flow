'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PieChart, Presentation, CreditCard, Compass, LayoutGrid } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function MobileDock() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeApp, setActiveApp] = useState<'habits' | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // The dock ONLY shows when we have actively entered one of the apps:
  // - Habits dashboard (/dashboard when activeApp is 'habits')
  // - Trip dashboard (/trip)
  // Persistent across the entire app: every dashboard and trip page, including
  // the Hub and all subpages (analytics, settings, achievements, trip subpages).
  // Public pages (landing, login, signup, legal) are excluded — an app nav there
  // would point logged-out visitors into authenticated routes.
  const showDock =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/trip');

  useEffect(() => {
    setIsMounted(true);
    
    const syncState = () => {
      const saved = localStorage.getItem('productivity_master_active_app');
      setActiveApp(saved === 'habits' ? 'habits' : null);
    };

    // Initial sync
    syncState();

    // Listen for custom event from DashboardApp or other components
    window.addEventListener('productivity-master:active-app-changed', syncState);
    return () => {
      window.removeEventListener('productivity-master:active-app-changed', syncState);
    };
  }, []);

  // Dynamically add/remove body class to handle padding-bottom on mobile devices
  useEffect(() => {
    if (isMounted && showDock) {
      document.body.classList.add('has-mobile-dock');
    } else {
      document.body.classList.remove('has-mobile-dock');
    }
    return () => {
      document.body.classList.remove('has-mobile-dock');
    };
  }, [isMounted, showDock]);

  if (!isMounted || !showDock) return null;

  const navigateToHabits = () => {
    localStorage.setItem('productivity_master_active_app', 'habits');
    window.dispatchEvent(new Event('productivity-master:active-app-changed'));
    if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  };

  const navigateToHub = () => {
    localStorage.removeItem('productivity_master_active_app');
    window.dispatchEvent(new Event('productivity-master:active-app-changed'));
    if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  };

  const navigateToTrip = () => {
    router.push('/trip');
  };

  const navigateToCoach = () => {
    router.push('/dashboard/coach');
  };

  const showFinancePlaceholder = () => {
    toast('Coming Soon - Finance & Savings Tracker service', 'info');
  };

  // Determine active tab (path-based so subpages highlight the right tab)
  const isCoachActive = pathname.startsWith('/dashboard/coach');
  const isTripActive = pathname.startsWith('/trip');
  const isHabitsActive = pathname.startsWith('/dashboard') && !isCoachActive && activeApp === 'habits';
  const isHubActive = pathname === '/dashboard' && activeApp === null;

  // Active styling helper
  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: isActive ? 'var(--accent-primary, #ffffff)' : 'transparent',
    color: isActive ? 'var(--accent-on-primary, #000000)' : 'rgba(255, 255, 255, 0.45)',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isActive ? '0 4px 12px rgba(85, 85, 85, 0.35)' : 'none',
    padding: 0,
  });

  return (
    <div
      className="hf-mobile-dock-container"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: '90%',
        maxWidth: '360px',
        height: '62px',
        background: 'rgba(21, 21, 21, 0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '9999px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Habits (Pie Chart) */}
      <button
        type="button"
        title="Habit Tracker"
        onClick={navigateToHabits}
        style={tabStyle(isHabitsActive)}
      >
        <PieChart size={20} />
      </button>

      {/* 2. Coach (Presentation Board / AI Insights) */}
      <button
        type="button"
        title="AI Coach"
        onClick={navigateToCoach}
        style={tabStyle(isCoachActive)}
      >
        <Presentation size={20} />
      </button>

      {/* 3. Finance/Savings (Credit Card - Placeholder) */}
      <button
        type="button"
        title="Finance Tracker (Coming Soon)"
        onClick={showFinancePlaceholder}
        style={tabStyle(false)}
      >
        <CreditCard size={20} />
      </button>

      {/* 4. Trip Planner (Compass) */}
      <button
        type="button"
        title="Trip Planner"
        onClick={navigateToTrip}
        style={tabStyle(isTripActive)}
      >
        <Compass size={20} />
      </button>

      {/* 5. App Hub (Layout Grid) */}
      <button
        type="button"
        title="App Hub"
        onClick={navigateToHub}
        style={tabStyle(isHubActive)}
      >
        <LayoutGrid size={20} />
      </button>

      <style jsx global>{`
        /* Hide mobile dock on desktop devices */
        @media (min-width: 1024px) {
          .hf-mobile-dock-container {
            display: none !important;
          }
        }
        
        /* Ensure layout is not covered by bottom dock on mobile view only when active */
        @media (max-width: 1023px) {
          body.has-mobile-dock {
            padding-bottom: 96px !important;
          }
        }
      `}</style>
    </div>
  );
}
