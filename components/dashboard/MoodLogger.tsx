'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { DailyMood } from '@/types/entry';
import { todayString } from '@/lib/utils/dates';

const MOODS = [
  { score: 1, emoji: '😞', label: 'Awful',  color: '#EF4444' },
  { score: 2, emoji: '😕', label: 'Bad',    color: '#F97316' },
  { score: 3, emoji: '😐', label: 'Okay',   color: '#EAB308' },
  { score: 4, emoji: '🙂', label: 'Good',   color: '#22C55E' },
  { score: 5, emoji: '😄', label: 'Great',  color: '#10B981' },
];

export default function MoodLogger() {
  const [savedMood,   setSavedMood]   = useState<DailyMood | null>(null);
  const [selected,    setSelected]    = useState<number | null>(null);
  const [energy,      setEnergy]      = useState(0);
  const [note,        setNote]        = useState('');
  const [noteOpen,    setNoteOpen]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [fetching,    setFetching]    = useState(true);

  useEffect(() => {
    fetch(`/api/moods?date=${todayString()}`)
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((json: { data: DailyMood | null }) => {
        const d = json.data;
        if (d && 'mood_score' in d) {
          setSavedMood(d);
          setSelected(d.mood_score);
          setEnergy(d.energy_level ?? 0);
          setNote(d.note ?? '');
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/moods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_date: todayString(),
          mood_score: selected,
          energy_level: energy > 0 ? energy : null,
          note: note.trim() || null,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setSavedMood(json.data as DailyMood);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {}
    finally { setSubmitting(false); }
  }, [selected, energy, note]);

  const alreadySaved =
    savedMood !== null &&
    savedMood.mood_score === selected &&
    (savedMood.energy_level ?? 0) === energy &&
    (savedMood.note ?? '') === note.trim();

  const activeMood = MOODS.find((m) => m.score === selected);

  if (fetching) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '18px 20px' }}>
        <div className="shimmer" style={{ height: 11, width: '45%', borderRadius: 5, marginBottom: 14 }} />
        <div className="shimmer" style={{ height: 44, borderRadius: 10 }} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${activeMood ? `${activeMood.color}25` : 'var(--border-subtle)'}`,
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'border-color 0.3s ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
          Today&apos;s Mood
        </span>
        {savedMood && (
          <span style={{ fontSize: 11, color: 'var(--accent-primary)', background: 'var(--accent-glow)', padding: '2px 9px', borderRadius: 99, border: '1px solid var(--accent-glow-md)' }}>
            Logged
          </span>
        )}
      </div>

      {/* Mood picker */}
      <div style={{ display: 'flex', gap: 4 }}>
        {MOODS.map((mood) => {
          const active = selected === mood.score;
          return (
            <motion.button
              key={mood.score}
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => setSelected(mood.score)}
              title={mood.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '8px 4px',
                borderRadius: 10,
                border: `1px solid ${active ? `${mood.color}40` : 'transparent'}`,
                background: active ? `${mood.color}14` : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{mood.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? mood.color : 'var(--text-muted)', transition: 'color 0.15s' }}>
                {mood.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Energy */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Zap size={12} color="var(--warm)" />
          <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)' }}>Energy</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[1,2,3,4,5].map((lvl) => {
            const on = lvl <= energy;
            return (
              <motion.button
                key={lvl}
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={() => setEnergy(lvl === energy ? 0 : lvl)}
                style={{
                  width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${on ? 'rgba(245,158,11,0.35)' : 'var(--border-subtle)'}`,
                  background: on ? 'rgba(245,158,11,0.12)' : 'var(--bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <Zap size={13} color={on ? '#F59E0B' : 'var(--text-dimmed)'} fill={on ? '#F59E0B' : 'none'} />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <div>
        <button
          type="button"
          onClick={() => setNoteOpen((o) => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: 'none',
            color: 'var(--text-muted)', fontSize: 12,
            cursor: 'pointer', padding: 0,
          }}
        >
          {noteOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {noteOpen ? 'Hide note' : 'Add note'}
        </button>
        <AnimatePresence>
          {noteOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="How's your day going?"
                maxLength={280}
                rows={3}
                style={{
                  width: '100%', marginTop: 8,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 9, padding: '9px 12px',
                  color: 'var(--text-primary)', fontSize: 13,
                  resize: 'none', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--border-accent)'; }}
                onBlur={(e)  => { e.target.style.borderColor = 'var(--border-subtle)'; }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-dimmed)', display: 'block', textAlign: 'right', marginTop: 3 }}>
                {note.length}/280
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save */}
      <motion.button
        type="button"
        disabled={!selected || submitting || alreadySaved}
        whileTap={selected && !alreadySaved ? { scale: 0.97 } : undefined}
        onClick={handleSubmit}
        style={{
          width: '100%', padding: '9px',
          borderRadius: 9, border: 'none',
          background: saved || alreadySaved
            ? 'rgba(16,185,129,0.15)'
            : selected
            ? 'linear-gradient(135deg, #059669, #10B981)'
            : 'var(--bg-tertiary)',
          color: saved || alreadySaved ? 'var(--accent-primary)' : selected ? '#fff' : 'var(--text-dimmed)',
          fontSize: 13.5, fontWeight: 600,
          cursor: !selected || submitting || alreadySaved ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'all 0.2s ease',
          opacity: !selected ? 0.5 : 1,
          boxShadow: selected && !alreadySaved ? '0 1px 10px rgba(16,185,129,0.25)' : 'none',
        }}
      >
        {saved || alreadySaved ? <><Check size={14} /> Saved</> : submitting ? 'Saving…' : 'Log mood'}
      </motion.button>
    </motion.div>
  );
}
