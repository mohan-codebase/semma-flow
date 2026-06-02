'use client';

import React from 'react';

const ACTIVE_COLOR = '#ffffff';
const MUTED_COLOR  = 'rgba(255, 255, 255,0.45)';

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : MUTED_COLOR;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
        fill={active ? c : 'none'}
        stroke={c}
        strokeWidth={active ? 0 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HabitsIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : MUTED_COLOR;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="15" rx="3" stroke={c} strokeWidth="1.8" fill={active ? 'rgba(255, 255, 255,0.15)' : 'none'} />
      <path d="M8 10h8M8 14h8M8 18h5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16.5" cy="17.5" r="3.5" fill={active ? ACTIVE_COLOR : 'none'} stroke={c} strokeWidth="1.8" />
      <path d="M15.5 17.5l.8.8 1.4-1.4" stroke={active ? '#1f1f1f' : c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AnalyticsIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : MUTED_COLOR;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="14" width="4" height="7" rx="1.5" fill={active ? c : 'none'} stroke={c} strokeWidth="1.8" />
      <rect x="10" y="9" width="4" height="12" rx="1.5" fill={active ? c : 'none'} stroke={c} strokeWidth="1.8" />
      <rect x="17" y="4" width="4" height="17" rx="1.5" fill={active ? c : 'none'} stroke={c} strokeWidth="1.8" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : MUTED_COLOR;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.8" fill={active ? 'rgba(255, 255, 255,0.2)' : 'none'} />
      <path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={c} strokeWidth="1.8" strokeLinecap="round"
      />
    </svg>
  );
}

const TABS = [
  { label: 'Home',      tab: 'home',      Icon: HomeIcon      },
  { label: 'Habits',    tab: 'habits',    Icon: HabitsIcon    },
  { label: 'Analytics', tab: 'analytics', Icon: AnalyticsIcon },
  { label: 'Settings',  tab: 'settings',  Icon: SettingsIcon  },
];

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', background: 'transparent', pointerEvents: 'none' }}
    >
      <div
        style={{
          margin: '0 16px 12px',
          background: '#1f1f1f',
          borderRadius: 26,
          border: '1px solid rgba(85, 85, 85,0.25)',
          display: 'flex',
          height: 64,
          padding: '0 8px',
          pointerEvents: 'auto',
          boxShadow: '0 8px 32px rgba(31, 31, 31,0.35)',
        }}
      >
        {TABS.map(({ label, tab, Icon }) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                height: '100%',
                borderRadius: 20,
                background: active ? 'rgba(85, 85, 85,0.30)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                padding: '0 4px',
              }}
            >
              <Icon active={active} />
              <span style={{
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                color: active ? ACTIVE_COLOR : MUTED_COLOR,
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
