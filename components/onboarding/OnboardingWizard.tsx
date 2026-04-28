'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, Check, X } from 'lucide-react';
import type { Habit } from '@/types/habit';

/* ─── Types ─────────────────────────────────────────────────── */
interface OnboardingWizardProps {
  userName?: string;
  onComplete: (habit: Habit) => void;
  onDismiss: () => void;
}

interface Template {
  name: string;
  icon: string;
  color: string;
  frequency: { type: 'daily' };
  target_type: 'boolean';
  target_value: 1;
}

/* ─── Data ──────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'health',      label: 'Health',        emoji: '💊', desc: 'Sleep, hydration, vitamins' },
  { id: 'fitness',     label: 'Fitness',        emoji: '🏋️', desc: 'Workouts, steps, stretching' },
  { id: 'mindfulness', label: 'Mindfulness',    emoji: '🧘', desc: 'Meditation, journaling, gratitude' },
  { id: 'learning',    label: 'Learning',       emoji: '📚', desc: 'Reading, courses, practice' },
  { id: 'productivity',label: 'Productivity',   emoji: '🎯', desc: 'Deep work, planning, reviews' },
  { id: 'finance',     label: 'Finance',        emoji: '💰', desc: 'Saving, budgeting, tracking' },
];

const TEMPLATES: Record<string, Template[]> = {
  health:       [
    { name: 'Drink 8 glasses of water', icon: '💧', color: '#5BC7DA', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Take vitamins',             icon: '💊', color: '#10B981', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Sleep 8 hours',            icon: '😴', color: '#8B7FE8', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'No alcohol',               icon: '🚫', color: '#F07272', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
  ],
  fitness:      [
    { name: 'Morning run',              icon: '🏃', color: '#10E5B0', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Workout 30 mins',          icon: '🏋️', color: '#F59E0B', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: '10,000 steps',             icon: '👟', color: '#3B82F6', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Stretch / mobility',       icon: '🤸', color: '#EC4899', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
  ],
  mindfulness:  [
    { name: 'Morning meditation',       icon: '🧘', color: '#8B7FE8', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Gratitude journal',        icon: '📓', color: '#F4B740', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'No phone first hour',      icon: '📵', color: '#6366F1', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Evening reflection',       icon: '🌙', color: '#5BC7DA', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
  ],
  learning:     [
    { name: 'Read 30 minutes',          icon: '📚', color: '#10B981', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Practice a language',      icon: '🌍', color: '#3B82F6', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Write 500 words',          icon: '✍️', color: '#F59E0B', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Watch a tutorial',         icon: '🎓', color: '#EC4899', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
  ],
  productivity: [
    { name: 'Plan the day (5 min)',     icon: '📋', color: '#10E5B0', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: '2-hour deep work block',  icon: '🎯', color: '#6366F1', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Weekly review',           icon: '🔄', color: '#F4B740', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Inbox zero',              icon: '📬', color: '#F07272', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
  ],
  finance:      [
    { name: 'Log daily expenses',      icon: '💸', color: '#10B981', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'No impulse purchases',    icon: '🛑', color: '#F07272', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Transfer to savings',     icon: '🏦', color: '#3B82F6', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Review investments',      icon: '📈', color: '#F4B740', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
  ],
};

const PRESET_COLORS = ['#10E5B0','#3B82F6','#8B7FE8','#EC4899','#F59E0B','#F07272','#5BC7DA','#10B981','#F4B740','#6366F1'];

/* ─── Mini confetti burst (CSS only, no dep) ────────────────── */
function Confetti() {
  const particles = Array.from({ length: 14 }, (_, i) => ({
    color: PRESET_COLORS[i % PRESET_COLORS.length],
    tx: `${(Math.random() - 0.5) * 120}px`,
    ty: `${-(Math.random() * 80 + 20)}px`,
    rot: `${Math.random() * 360}deg`,
    delay: `${i * 0.03}s`,
  }));
  return (
    <div style={{ position: 'absolute', top: '40%', left: '50%', pointerEvents: 'none', zIndex: 10 }}>
      {particles.map((p, i) => (
        <span
          key={i}
          className="confetti-particle"
          style={{
            background: p.color,
            '--tx': p.tx,
            '--ty': p.ty,
            '--rot': p.rot,
            animationDelay: p.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ─── Step indicator ────────────────────────────────────────── */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 20 : 6,
          height: 6,
          borderRadius: 99,
          background: i === current ? 'var(--accent-primary)' : i < current ? 'var(--accent-glow-md)' : 'var(--border-default)',
          transition: 'all 0.3s ease',
          border: i < current && i !== current ? '1px solid var(--accent-primary)' : 'none',
        }} />
      ))}
    </div>
  );
}

/* ─── Shared slide variants ─────────────────────────────────── */
const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 32 : -32 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -32 : 32 }),
};

/* ─── Main component ────────────────────────────────────────── */
export default function OnboardingWizard({ userName, onComplete, onDismiss }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [template, setTemplate] = useState<Template | null>(null);
  const [habitName, setHabitName] = useState('');
  const [habitColor, setHabitColor] = useState('#10E5B0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdHabit, setCreatedHabit] = useState<Habit | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const go = useCallback((next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }, [step]);

  const pickTemplate = (t: Template) => {
    setTemplate(t);
    setHabitName(t.name);
    setHabitColor(t.color);
    go(3);
  };

  const handleSave = async () => {
    if (!habitName.trim()) { setError('Please enter a habit name.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: habitName.trim(),
          icon: template?.icon ?? 'circle-check',
          color: habitColor,
          frequency: { type: 'daily' },
          target_type: 'boolean',
          target_value: 1,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create habit');
      setCreatedHabit(json.data as Habit);
      setShowConfetti(true);
      go(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const finish = () => {
    if (createdHabit) onComplete(createdHabit);
  };

  const STEPS = 5;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to HabitForge"
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{
          position: 'relative',
          width: '100%', maxWidth: 520,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 22,
          boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        {/* Dismiss — skip on final step */}
        {step < 4 && (
          <button
            onClick={onDismiss}
            aria-label="Skip onboarding"
            style={{
              position: 'absolute', top: 14, right: 14, zIndex: 2,
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={15} />
          </button>
        )}

        {/* Top accent line */}
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg, var(--accent-primary), var(--cyan))',
        }} />

        <div style={{ padding: '28px 28px 32px' }}>
          <StepDots current={step} total={STEPS} />

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* ── Step 0: Welcome ───────────────────────────────── */}
              {step === 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 48, marginBottom: 16, lineHeight: 1,
                  }}>⚡</div>
                  <h2 style={{
                    fontSize: 24, fontWeight: 800, fontFamily: "'Outfit'",
                    letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 10px',
                  }}>
                    Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}!
                  </h2>
                  <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 28px', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
                    HabitForge turns daily check-ins into unstoppable streaks. Let&apos;s create your very first habit — it takes about 60 seconds.
                  </p>
                  <button
                    onClick={() => go(1)}
                    style={{
                      width: '100%', padding: '13px',
                      borderRadius: 12, background: 'var(--accent-primary)',
                      color: 'var(--accent-on-primary)', fontSize: 15, fontWeight: 700,
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 0 24px rgba(16,229,176,0.22)',
                    }}
                  >
                    Let&apos;s go <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* ── Step 1: Category ─────────────────────────────── */}
              {step === 1 && (
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Outfit'", letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    What do you want to improve?
                  </h2>
                  <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '0 0 20px' }}>
                    Pick an area — we&apos;ll suggest habits for it.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setCategoryId(cat.id); go(2); }}
                        style={{
                          padding: '14px 12px', borderRadius: 12, cursor: 'pointer',
                          background: categoryId === cat.id ? 'var(--accent-glow-md)' : 'var(--bg-tertiary)',
                          border: `1px solid ${categoryId === cat.id ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                          textAlign: 'left', fontFamily: 'inherit',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontSize: 22, marginBottom: 5 }}>{cat.emoji}</div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>{cat.label}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{cat.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 2: Template ─────────────────────────────── */}
              {step === 2 && (
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Outfit'", letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    Choose a habit to start
                  </h2>
                  <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '0 0 20px' }}>
                    Pick one — you can add more later.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {(TEMPLATES[categoryId] ?? []).map(t => (
                      <button
                        key={t.name}
                        onClick={() => pickTemplate(t)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-subtle)',
                          textAlign: 'left', fontFamily: 'inherit',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                      >
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          background: `${t.color}20`, border: `1px solid ${t.color}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        }}>{t.icon}</div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</span>
                        <ArrowRight size={14} color="var(--text-dimmed)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                  <button onClick={() => go(1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ArrowLeft size={13} /> Back
                  </button>
                </div>
              )}

              {/* ── Step 3: Customize ────────────────────────────── */}
              {step === 3 && (
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Outfit'", letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    Make it yours
                  </h2>
                  <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '0 0 20px' }}>
                    Tweak the name and pick a colour.
                  </p>

                  {/* Name field */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Habit name
                    </label>
                    <input
                      value={habitName}
                      onChange={e => setHabitName(e.target.value)}
                      placeholder="e.g. Morning Run"
                      maxLength={80}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: 10,
                        background: 'var(--bg-tertiary)',
                        border: `1px solid ${error ? 'var(--danger)' : 'var(--border-subtle)'}`,
                        color: 'var(--text-primary)', fontSize: 14,
                        outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; }}
                      onBlur={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border-subtle)'; }}
                    />
                    {error && <p style={{ fontSize: 12, color: 'var(--danger)', margin: '5px 0 0' }}>{error}</p>}
                  </div>

                  {/* Color picker */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Colour
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setHabitColor(c)}
                          style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: c, border: habitColor === c ? '2px solid white' : '2px solid transparent',
                            boxShadow: habitColor === c ? `0 0 0 2px ${c}` : 'none',
                            cursor: 'pointer', transition: 'transform 0.12s ease',
                            transform: habitColor === c ? 'scale(1.18)' : 'scale(1)',
                          }}
                          aria-label={`Color ${c}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12,
                    background: `${habitColor}12`, border: `1px solid ${habitColor}30`,
                    marginBottom: 20,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: `${habitColor}25`, border: `1px solid ${habitColor}50`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>{template?.icon ?? '⚡'}</div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {habitName || 'Your habit'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => go(2)}
                      style={{
                        flex: '0 0 auto', padding: '12px 16px', borderRadius: 10,
                        background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        flex: 1, padding: '12px', borderRadius: 10,
                        background: 'var(--accent-primary)', color: 'var(--accent-on-primary)',
                        fontSize: 14, fontWeight: 700, border: 'none',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', opacity: saving ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      }}
                    >
                      {saving ? 'Creating…' : <><Check size={15} /> Create habit</>}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 4: Celebrate ────────────────────────────── */}
              {step === 4 && (
                <div style={{ textAlign: 'center', position: 'relative' }}>
                  {showConfetti && <Confetti />}
                  <div style={{ fontSize: 52, marginBottom: 16, lineHeight: 1 }}>🎉</div>
                  <h2 style={{
                    fontSize: 24, fontWeight: 800, fontFamily: "'Outfit'",
                    letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 10px',
                  }}>
                    Your first habit is live!
                  </h2>
                  <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 8px' }}>
                    <strong style={{ color: 'var(--accent-primary)' }}>{createdHabit?.name}</strong> has been added to your dashboard.
                  </p>
                  <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '0 0 28px' }}>
                    Check it off today to start your streak! 🔥
                  </p>
                  <div style={{
                    padding: '10px 14px', borderRadius: 12, marginBottom: 24,
                    background: 'var(--accent-glow)', border: '1px solid var(--border-accent)',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}>
                    <Sparkles size={14} color="var(--accent-primary)" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)' }}>
                      Tip: You can add more habits anytime with the + button.
                    </span>
                  </div>
                  <button
                    onClick={finish}
                    style={{
                      width: '100%', padding: '13px',
                      borderRadius: 12, background: 'var(--accent-primary)',
                      color: 'var(--accent-on-primary)', fontSize: 15, fontWeight: 700,
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 0 24px rgba(16,229,176,0.22)',
                    }}
                  >
                    Go to dashboard <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
