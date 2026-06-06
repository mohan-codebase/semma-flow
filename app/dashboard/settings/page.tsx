'use client';

import React, { useState } from 'react';
import PushNotificationToggle from '@/components/settings/PushNotificationToggle';
import DevicesModal from '@/components/settings/DevicesModal';
import { Shield } from 'lucide-react';

export default function SettingsPage() {
  const [devicesOpen, setDevicesOpen] = useState(false);

  return (
    <div className="hf-page" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 20px' }}>
      <div style={{ minWidth: 0, marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: "'Outfit', sans-serif" }}>
          Settings
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          Configure push notifications and manage active login sessions.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
        {/* Push Notifications Card */}
        <PushNotificationToggle />

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
      </div>

      <DevicesModal isOpen={devicesOpen} onClose={() => setDevicesOpen(false)} />
    </div>
  );
}
