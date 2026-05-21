'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const GREEN   = '#32D74B';
const GRAY    = 'rgba(255,255,255,0.55)';
const FONT    = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

// ── Apple Fitness-matching SVG icons ──────────────────────────────────────────

function SummaryIcon({ active }: { active: boolean }) {
  const c = active ? GREEN : GRAY;
  // Apple's activity ring: a single thick ring with a gap at the top (like the Move ring)
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle
        cx="14" cy="14" r="10"
        stroke={c}
        strokeWidth="3.5"
        strokeLinecap="round"
        // gap at the top — ~300° arc
        strokeDasharray={`${2 * Math.PI * 10 * 0.82} ${2 * Math.PI * 10}`}
        strokeDashoffset={`${-2 * Math.PI * 10 * 0.09}`}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
      />
      {/* arrow at leading edge */}
      <circle cx="14" cy="4.2" r="3.5" fill={c} />
      <path d="M12.4 4.8 L14 2.6 L15.6 4.8" fill="none" stroke={active ? '#000' : '#1C1C1E'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HabitsIcon({ active }: { active: boolean }) {
  const c = active ? GREEN : GRAY;
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="5" y="5.5" width="18" height="17" rx="3" stroke={c} strokeWidth="1.8" />
      <path d="M9 10h10M9 14h10M9 18h6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 17l1.5 1.5L22 16" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WorkoutIcon({ active }: { active: boolean }) {
  const c = active ? GREEN : GRAY;
  // Running person silhouette — matching Apple Fitness "Workout" icon
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="6" r="2.8" fill={c} />
      {/* body */}
      <path d="M14 9.2 L12.5 15 L10 20" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 9.2 L15.5 15 L18 20" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* arms */}
      <path d="M11 12 L8.5 10.5" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M17 12 L20 11" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SharingIcon({ active }: { active: boolean }) {
  const c = active ? GREEN : GRAY;
  // Two people — matching Apple Fitness "Sharing" icon
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      {/* left person */}
      <circle cx="10" cy="9" r="2.5" fill={c} />
      <path d="M5.5 21c0-3.5 2-5 4.5-5s4.5 1.5 4.5 5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      {/* right person */}
      <circle cx="18.5" cy="9" r="2.5" fill={c} />
      <path d="M14 21c0-3.5 2-5 4.5-5s4.5 1.5 4.5 5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { label: 'Summary',  href: '/dashboard',           exact: true,  Icon: SummaryIcon  },
  { label: 'Habits',   href: '/dashboard/habits',    exact: false, Icon: HabitsIcon   },
  { label: 'Workout',  href: '/dashboard/analytics', exact: false, Icon: WorkoutIcon  },
  { label: 'Sharing',  href: '/dashboard/settings',  exact: false, Icon: SharingIcon  },
];

export default function MobileNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{
        // Safe-area padding at bottom
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        // Transparent outer wrapper — the pill floats
        background: 'transparent',
        pointerEvents: 'none',
      }}
    >
      {/* Floating pill */}
      <div
        style={{
          margin: '0 12px 10px',
          background: 'rgba(38,38,40,0.96)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRadius: 22,
          border: '0.5px solid rgba(255,255,255,0.1)',
          display: 'flex',
          height: 60,
          padding: '0 4px',
          pointerEvents: 'auto',
        }}
      >
        {TABS.map(({ label, href, exact, Icon }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href} style={{ flex: 1, textDecoration: 'none' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  height: '100%',
                  borderRadius: 18,
                  // Active tab gets a lighter pill background
                  background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
                  transition: 'background 0.15s ease',
                }}
              >
                <Icon active={active} />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 600 : 400,
                    color: active ? GREEN : GRAY,
                    fontFamily: FONT,
                    letterSpacing: '-0.01em',
                    lineHeight: 1,
                  }}
                >
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
