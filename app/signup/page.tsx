'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SocialAuth from '@/components/auth/SocialAuth';
import { getSiteUrl } from '@/lib/utils/url';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get('error') || '');
  const [success, setSuccess] = useState(false);

  // Sync error from URL if it changes
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) setError(urlError);
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${getSiteUrl()}/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1800);
    }
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
            HabitForge
          </span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <span className="eyebrow">Get started</span>
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
            Create your account
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 'var(--space-2)', letterSpacing: '-0.005em' }}>
            Build habits that actually stick.
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--glass-highlight), var(--shadow-lg)',
          }}
        >
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--accent-glow-md)',
                  border: '1px solid var(--border-accent)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <CheckCircle2 size={24} color="var(--accent-primary)" strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, fontFamily: "'Outfit'" }}>
                Account created
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Taking you to your dashboard…</p>
            </motion.div>
          ) : (
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--r-md)',
                    marginBottom: 'var(--space-4)',
                    background: error.includes('already registered') ? 'rgba(76,175,80,0.1)' : 'var(--danger-glow)',
                    border: `1px solid ${error.includes('already registered') ? 'rgba(76,175,80,0.2)' : 'rgba(240,114,114,0.24)'}`,
                    color: error.includes('already registered') ? 'var(--text-primary)' : 'var(--danger)',
                    fontSize: 12.5,
                    fontWeight: 500,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={14} style={{ flexShrink: 0, color: error.includes('already registered') ? 'var(--accent-primary)' : 'inherit' }} />
                    <span>{error}</span>
                  </div>
                  {error.includes('already registered') && (
                    <Link 
                      href="/login" 
                      style={{ 
                        display: 'block', 
                        marginTop: 8, 
                        color: 'var(--accent-primary)', 
                        textDecoration: 'none',
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      Account already exists. Log in instead →
                    </Link>
                  )}
                </motion.div>
              )}

              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Field
                  label="Full name"
                  type="text"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />

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
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
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
                  {loading ? 'Creating account…' : (
                    <>
                      Create account
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
                Already have an account?{' '}
                <Link
                  href="/login"
                  style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Legal */}
        <p
          style={{
            textAlign: 'center',
            marginTop: 'var(--space-5)',
            fontSize: 11.5,
            color: 'var(--text-dimmed)',
            letterSpacing: '-0.005em',
            lineHeight: 1.6,
          }}
        >
          By creating an account you agree to our
          <br />
          Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]" />}>
      <SignupContent />
    </Suspense>
  );
}

/* ── Field primitive — aligns with new token system ─────────────── */
interface FieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  trailing?: React.ReactNode;
}

function Field({ label, type, value, onChange, placeholder, required, minLength, autoComplete, trailing }: FieldProps) {
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
          minLength={minLength}
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
