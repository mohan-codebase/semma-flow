'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PushNotificationToggle from '@/components/settings/PushNotificationToggle';
import SecuritySettings from '@/components/settings/SecuritySettings';
import DevicesModal from '@/components/settings/DevicesModal';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useTheme } from '@/components/ui/ThemeProvider';
import { Shield, Sun, Moon, HelpCircle, LogOut } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Royal Blue', value: '#2563EB' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Sunset', value: '#EA580C' },
  { name: 'Coral', value: '#E11D48' },
  { name: 'Teal', value: '#0D9488' },
];

export default function SettingsPage() {
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const { theme, toggle, lightAccent, darkAccent, setLightAccent, setDarkAccent } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'User';

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div className="hf-page" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 20px' }}>
      <div style={{ minWidth: 0, marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: "'Outfit', sans-serif" }}>
          Settings
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          Manage your user profile, configurations, security preferences, and theme.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
        {/* User Profile Card */}
        {user && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 20px',
              background: 'linear-gradient(155deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--r-xl)',
            }}
          >
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #727272 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Push Notifications Card */}
        <PushNotificationToggle />

        {/* Passcode and Biometric Security Settings */}
        <SecuritySettings />

        {/* Security / Devices Card */}
        <div
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '16px 18px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-xl)',
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 'var(--r-md)', flexShrink: 0,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-primary)',
          }}>
            <Shield size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>
              Devices & Sessions
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
              View and revoke active sessions on other browsers or devices.
            </p>
            <button
              onClick={() => setDevicesOpen(true)}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--accent-primary)',
                color: 'var(--accent-on-primary)',
                border: 'none',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Manage sessions
            </button>
          </div>
        </div>

        {/* Theme Settings Card */}
        <div
          style={{
            display: 'flex', flexDirection: 'column', gap: 18,
            padding: '20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-xl)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--r-md)', flexShrink: 0,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-primary)',
            }}>
              {isDark ? <Moon size={18} /> : <Sun size={18} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>
                Theme Settings
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
                Customize system theme and primary accent colors.
              </p>
              <button
                onClick={toggle}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                }}
              >
                Switch to {isDark ? 'Light' : 'Dark'} Mode
              </button>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--divider)', margin: '4px 0' }} />

          {/* Light Theme Accent Color Settings */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Light Theme Accent Color
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((preset) => {
                const isSelected = lightAccent.toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={preset.value}
                    onClick={() => setLightAccent(preset.value)}
                    title={preset.name}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: preset.value,
                      border: isSelected ? '2px solid var(--text-primary)' : '1px solid var(--border-default)',
                      boxShadow: isSelected ? '0 0 0 2px var(--bg-primary)' : 'none',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0,
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </button>
                );
              })}
              
              {/* Custom Color Wheel */}
              <div 
                style={{ 
                  position: 'relative', width: 28, height: 28, borderRadius: '50%', 
                  border: !PRESET_COLORS.some(p => p.value.toLowerCase() === lightAccent.toLowerCase()) ? '2px solid var(--text-primary)' : '1px solid var(--border-default)',
                  boxShadow: !PRESET_COLORS.some(p => p.value.toLowerCase() === lightAccent.toLowerCase()) ? '0 0 0 2px var(--bg-primary)' : 'none',
                  overflow: 'hidden', cursor: 'pointer',
                  background: 'conic-gradient(from 0deg, red, yellow, green, cyan, blue, magenta, red)',
                  transform: !PRESET_COLORS.some(p => p.value.toLowerCase() === lightAccent.toLowerCase()) ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title="Custom color"
              >
                {!PRESET_COLORS.some(p => p.value.toLowerCase() === lightAccent.toLowerCase()) && (
                  <span style={{ 
                    position: 'absolute', zIndex: 1, pointerEvents: 'none', 
                    width: 6, height: 6, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }} />
                )}
                <input 
                  type="color" 
                  value={lightAccent} 
                  onChange={(e) => setLightAccent(e.target.value)} 
                  style={{ position: 'absolute', inset: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', opacity: 0, cursor: 'pointer' }}
                />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                {lightAccent.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Dark Theme Accent Color Settings */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Dark Theme Accent Color
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((preset) => {
                const isSelected = darkAccent.toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={preset.value}
                    onClick={() => setDarkAccent(preset.value)}
                    title={preset.name}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: preset.value,
                      border: isSelected ? '2px solid var(--text-primary)' : '1px solid var(--border-default)',
                      boxShadow: isSelected ? '0 0 0 2px var(--bg-primary)' : 'none',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0,
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </button>
                );
              })}
              
              {/* Custom Color Wheel */}
              <div 
                style={{ 
                  position: 'relative', width: 28, height: 28, borderRadius: '50%', 
                  border: !PRESET_COLORS.some(p => p.value.toLowerCase() === darkAccent.toLowerCase()) ? '2px solid var(--text-primary)' : '1px solid var(--border-default)',
                  boxShadow: !PRESET_COLORS.some(p => p.value.toLowerCase() === darkAccent.toLowerCase()) ? '0 0 0 2px var(--bg-primary)' : 'none',
                  overflow: 'hidden', cursor: 'pointer',
                  background: 'conic-gradient(from 0deg, red, yellow, green, cyan, blue, magenta, red)',
                  transform: !PRESET_COLORS.some(p => p.value.toLowerCase() === darkAccent.toLowerCase()) ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title="Custom color"
              >
                {!PRESET_COLORS.some(p => p.value.toLowerCase() === darkAccent.toLowerCase()) && (
                  <span style={{ 
                    position: 'absolute', zIndex: 1, pointerEvents: 'none', 
                    width: 6, height: 6, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }} />
                )}
                <input 
                  type="color" 
                  value={darkAccent} 
                  onChange={(e) => setDarkAccent(e.target.value)} 
                  style={{ position: 'absolute', inset: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', opacity: 0, cursor: 'pointer' }}
                />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                {darkAccent.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Help & Support Card */}
        <div
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '16px 18px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-xl)',
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 'var(--r-md)', flexShrink: 0,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-primary)',
          }}>
            <HelpCircle size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>
              Help & Support
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
              Need help or have suggestions? Reach out to our support team.
            </p>
            <a
              href="mailto:support@semmaflow.com?subject=Productivity Master Help"
              style={{
                display: 'inline-block',
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)',
                textDecoration: 'none',
                fontFamily: 'inherit',
              }}
            >
              Contact Support
            </a>
          </div>
        </div>

        {/* Sign Out Card */}
        <div
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '16px 18px',
            background: 'var(--bg-card)',
            border: '1px solid rgba(255, 0, 0, 0.1)',
            borderRadius: 'var(--r-xl)',
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 'var(--r-md)', flexShrink: 0,
            background: 'rgba(255, 0, 0, 0.05)',
            border: '1px solid rgba(255, 0, 0, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--danger)',
          }}>
            <LogOut size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>
              Account Session
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
              Sign out from this session. Active passcode and biometric configurations remain safe.
            </p>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--danger)',
                color: 'var(--accent-on-primary)',
                border: 'none',
                cursor: signingOut ? 'wait' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {signingOut ? 'Signing out...' : 'Sign out of account'}
            </button>
          </div>
        </div>

      </div>

      <DevicesModal isOpen={devicesOpen} onClose={() => setDevicesOpen(false)} />
    </div>
  );
}


