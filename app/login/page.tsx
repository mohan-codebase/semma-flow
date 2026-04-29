'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SocialAuth from '@/components/auth/SocialAuth';

function LoginContent() {
  const router   = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(searchParams.get('error') || '');

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) setError(urlError);
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push('/dashboard'); router.refresh(); }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative hf-auth-shell"
      style={{
        background: 'var(--bg-primary)',
        padding: 'var(--space-6)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full"
        style={{ maxWidth: 400, margin: '0 auto' }}
      >
        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-8)' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--r-md)',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--cyan) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(16,229,176,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <Zap size={17} color="var(--accent-on-primary)" fill="var(--accent-on-primary)" />
          </div>
          <span
            className="gradient-text"
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '-0.03em',
            }}
          >
            Semma Flow
          </span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <span className="eyebrow">Welcome back</span>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginTop: 'var(--space-2)',
            }}
          >
            Sign in to your account
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 'var(--space-2)', letterSpacing: '-0.005em' }}>
            Pick up where you left off.
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--glass-highlight), var(--shadow-lg)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--r-md)',
              marginBottom: 'var(--space-4)',
              background: error && error.includes('successfully') ? 'rgba(16,229,176,0.1)' : error ? 'var(--danger-glow)' : 'transparent',
              border: error ? `1px solid ${error.includes('successfully') ? 'rgba(16,229,176,0.25)' : 'rgba(240,114,114,0.24)'}` : 'none',
              color: error && error.includes('successfully') ? 'var(--accent-primary)' : 'var(--danger)',
              fontSize: 12.5,
              fontWeight: 500,
              display: error ? 'block' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {error && error.includes('successfully') ? (
                <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
              ) : (
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
              )}
              <span>{error}</span>
            </div>
            {!error.includes('successfully') && error && (
              <Link 
                href="/signup" 
                style={{ 
                  display: 'block', 
                  marginTop: 8, 
                  color: 'var(--text-primary)', 
                  textDecoration: 'underline',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                No account yet? Create one here →
              </Link>
            )}
          </motion.div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <Field
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              placeholder="Your password"
              autoComplete="current-password"
              required
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    borderRadius: 6,
                  }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
                padding: '11px 18px',
                borderRadius: 'var(--r-md)',
                fontSize: 13.5,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: 'var(--accent-on-primary)',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--cyan) 100%)',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow:
                  '0 1px 0 rgba(255,255,255,0.18) inset, 0 -1px 0 rgba(0,0,0,0.10) inset, 0 2px 8px rgba(16,229,176,0.22)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'filter 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
                marginTop: 'var(--space-1)',
              }}
              onMouseEnter={(e) => {
                if (loading) return;
                (e.currentTarget as HTMLElement).style.filter = 'brightness(1.06)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLElement).style.boxShadow =
                  '0 1px 0 rgba(255,255,255,0.22) inset, 0 6px 20px rgba(16,229,176,0.32)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.filter = '';
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow =
                  '0 1px 0 rgba(255,255,255,0.18) inset, 0 -1px 0 rgba(0,0,0,0.10) inset, 0 2px 8px rgba(16,229,176,0.22)';
              }}
            >
              {loading ? 'Signing in…' : (
                <>
                  Sign in
                  <ArrowRight size={14} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 'var(--space-5) 0 var(--space-4)' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-dimmed)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          {/* Google */}
          <SocialAuth loading={loading} setLoading={setLoading} />

          <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', fontSize: 13, color: 'var(--text-muted)' }}>
            No account?{' '}
            <Link href="/signup" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign up free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]" />}>
      <LoginContent />
    </Suspense>
  );
}

/* ── Field primitive ─────────────────────────────────────────────── */
interface FieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  trailing?: React.ReactNode;
}

function Field({ label, type, value, onChange, placeholder, required, autoComplete, trailing }: FieldProps) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          letterSpacing: '-0.005em',
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-tertiary)',
          border: `1px solid ${focus ? 'var(--border-active)' : 'var(--border-default)'}`,
          borderRadius: 'var(--r-md)',
          padding: '0 10px 0 12px',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          boxShadow: focus ? '0 0 0 3px var(--accent-glow-md)' : 'none',
        }}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          style={{
            flex: 1,
            padding: '11px 0',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 13.5,
            fontFamily: 'inherit',
            letterSpacing: '-0.005em',
          }}
        />
        {trailing}
      </div>
    </label>
  );
}
