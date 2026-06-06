'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function ResetPasswordContent() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Automatically sign out so user is forced to log in with new password
        await supabase.auth.signOut();
        setTimeout(() => {
          router.push('/login?error=Password reset successfully! Please sign in with your new password.');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
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
              boxShadow: 'none',
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
            Productivity Master
          </span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <span className="eyebrow">Security</span>
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
            Set new password
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 'var(--space-2)', letterSpacing: '-0.005em' }}>
            Choose a strong password containing at least 8 characters.
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: 'var(--glass-bg)',
            boxShadow: 'var(--glass-shadow)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--space-6)',
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
                Password Updated
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Taking you back to the login page…
              </p>
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
                    background: 'var(--danger-glow)',
                    border: '1px solid rgba(140, 140, 140, 0.24)',
                    color: 'var(--danger)',
                    fontSize: 12.5,
                    fontWeight: 500,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Field
                  label="New Password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={setPassword}
                  placeholder="At least 8 characters"
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

                <Field
                  label="Confirm Password"
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Repeat new password"
                  required
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw((v) => !v)}
                      aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
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
                      {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
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
                    background: 'var(--accent-primary)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    boxShadow: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'transform 0.15s ease, filter 0.15s ease, background 0.15s ease, opacity 0.15s ease, border-color 0.15s ease',
                    marginTop: 'var(--space-1)',
                  }}
                  onMouseEnter={(e) => {
                    if (loading) return;
                    (e.currentTarget as HTMLElement).style.filter = 'brightness(1.06)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.filter = '';
                    (e.currentTarget as HTMLElement).style.transform = '';
                  }}
                >
                  {loading ? 'Updating password…' : (
                    <>
                      Update password
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]" />}>
      <ResetPasswordContent />
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
  trailing?: React.ReactNode;
}

function Field({ label, type, value, onChange, placeholder, required, trailing }: FieldProps) {
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
          transition: 'transform 0.15s ease, filter 0.15s ease, background 0.15s ease, opacity 0.15s ease, border-color 0.15s ease',
          boxShadow: 'none',
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
