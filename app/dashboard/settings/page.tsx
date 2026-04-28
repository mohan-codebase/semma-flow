'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Download, LogOut, Save, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { todayString } from '@/lib/utils/dates';
import { useToast } from '@/components/ui/Toast';

interface Profile {
  id: string;
  full_name: string | null;
  timezone: string;
  week_start_day: number;
}

const TIMEZONES = [
  'Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney',
  'Pacific/Auckland',
];

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: '20px',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ color: 'var(--accent-primary)' }}>{icon}</div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [weekStart, setWeekStart] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email ?? '');

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data as Profile);
        setName(data.full_name ?? '');
        setTimezone(data.timezone ?? 'Asia/Kolkata');
        setWeekStart(data.week_start_day ?? 1);
      }
    }
    void load();
  }, [supabase]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveError('');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name.trim() || null,
          timezone,
          week_start_day: weekStart,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        setSaveError(error.message);
        toast(error.message || 'Failed to save', 'error');
      } else {
        setSaved(true);
        setLastSavedAt(new Date());
        toast('Profile updated — check your email if you did not make this change', 'success');
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      setSaveError(String(e));
      toast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportJSON = () => {
    window.location.assign('/api/export?format=json');
  };

  const handleExportCSV = () => {
    window.location.assign('/api/export?format=csv');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    fontFamily: "'IBM Plex Sans', sans-serif",
    transition: 'border-color 0.15s ease',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="hf-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 640 }}
    >
      {/* Header */}
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
          Settings
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile */}
      <SectionCard title="Profile" icon={<User size={18} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Display Name
            </label>
            <input
              style={inputBase}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Email
            </label>
            <input
              style={{ ...inputBase, opacity: 0.6, cursor: 'not-allowed' }}
              value={userEmail}
              readOnly
            />
          </div>

          {saveError && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--danger, #F43F5E)' }}>{saveError}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '-0.005em' }}>
              {lastSavedAt
                ? `Last saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Not saved in this session'}
            </span>
            <Button variant="primary" loading={saving} onClick={handleSave} icon={<Save size={14} />}>
              {saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Preferences */}
      <SectionCard title="Preferences" icon={<Bell size={18} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Timezone
            </label>
            <select
              style={{ ...inputBase, cursor: 'pointer', appearance: 'none' as const }}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz} style={{ background: 'var(--bg-secondary)' }}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
              Week Starts On
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ label: 'Sunday', value: 0 }, { label: 'Monday', value: 1 }].map(({ label, value }) => {
                const active = weekStart === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setWeekStart(value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: active ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border-subtle)',
                      background: active ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" loading={saving} onClick={handleSave} icon={<Save size={14} />}>
              {saved ? 'Saved!' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Data Export */}
      <SectionCard title="Data Export" icon={<Download size={18} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Export all your habit data for backup or analysis.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              variant="secondary"
              icon={<Download size={14} />}
              onClick={handleExportJSON}
            >
              Export JSON
            </Button>
            <Button
              variant="secondary"
              icon={<Download size={14} />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Danger Zone */}
      <SectionCard title="Account" icon={<LogOut size={18} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Sign out */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'var(--bg-tertiary)',
              borderRadius: 12,
            }}
          >
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Sign out
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                Sign out of your account on this device
              </p>
            </div>
            <Button variant="ghost" icon={<LogOut size={14} />} onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );
}
