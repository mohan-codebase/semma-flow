'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Pencil, Archive, Trash2, Flame, Link } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { HabitWithEntry } from '@/types/habit';
import HabitCheckbox from '@/components/habits/HabitCheckbox';
import NextLink from 'next/link';

interface HabitCardProps {
  habit: HabitWithEntry;
  onToggle:  (habitId: string, completed: boolean) => void;
  onEdit:    (habit: HabitWithEntry) => void;
  onArchive: (habitId: string) => void;
  onDelete:  (habitId: string) => void;
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex?.startsWith('#')) return `rgba(16,185,129,${alpha})`;
  const s    = hex.replace('#', '');
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  const n    = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function freqLabel(habit: HabitWithEntry): string {
  const f = habit.frequency;
  if (f.type === 'daily') return 'Daily';
  if (f.type === 'weekly') {
    const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return (f.days ?? []).map((d) => names[d]).join(' · ') || 'Weekly';
  }
  if (f.type === 'x_per_week')  return `${f.count ?? 1}× / week`;
  if (f.type === 'x_per_month') return `${f.count ?? 1}× / month`;
  return '';
}

function DynamicIcon({ name, size = 18, color }: { name: string; size?: number; color: string }) {
  const pascal = name
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }> | undefined>)[pascal];
  return Icon ? (
    <Icon size={size} color={color} />
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" fill={hexToRgba(color, 0.6)} />
    </svg>
  );
}

function MenuItem({ icon, label, onClick, danger = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '7px 10px',
        background: hov ? (danger ? 'rgba(239,68,68,0.10)' : 'var(--bg-elevated)') : 'transparent',
        border: 'none', borderRadius: 8, cursor: 'pointer',
        color: danger ? (hov ? 'var(--danger)' : '#f87171') : 'var(--text-secondary)',
        fontSize: 13, fontWeight: 500, textAlign: 'left',
        transition: 'all 0.12s ease',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export default function HabitCard({ habit, onToggle, onEdit, onArchive, onDelete }: HabitCardProps) {
  const [checked,  setChecked]  = useState(habit.todayEntry?.is_completed ?? false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChecked(habit.todayEntry?.is_completed ?? false);
  }, [habit.todayEntry?.is_completed]);

  const handleToggle = useCallback((val: boolean) => {
    setChecked(val);
    onToggle(habit.id, val);
  }, [habit.id, onToggle]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const color     = habit.color ?? '#10B981';
  const completed = checked;
  const streak    = habit.current_streak ?? 0;

  return (
    <motion.div layout style={{ position: 'relative' }}>
      <motion.div
        style={{
          background:       'var(--bg-card)',
          border:           `1px solid ${completed ? hexToRgba(color, 0.22) : 'var(--border-subtle)'}`,
          borderRadius:     'var(--r-lg)',
          padding:          '13px 16px',
          display:          'flex',
          alignItems:       'center',
          gap:              12,
          position:         'relative',
          overflow:         'visible',
          transition:       'border-color 0.18s ease, opacity 0.18s ease, background 0.18s ease',
          opacity:          completed ? 0.78 : 1,
          boxShadow:        'var(--glass-highlight)',
        }}
        whileHover={{
          y: -1,
          borderColor: completed ? hexToRgba(color, 0.32) : 'var(--border-default)',
          boxShadow: 'var(--glass-highlight), var(--shadow-sm)',
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        {/* Left accent bar when completed */}
        {completed && (
          <div
            style={{
              position: 'absolute', left: 0, top: 8, bottom: 8,
              width: 2,
              background: color,
              borderRadius: 2,
              opacity: 0.72,
            }}
          />
        )}

        {/* Icon */}
        <div
          style={{
            width: 40, height: 40, borderRadius: 11,
            background: hexToRgba(color, 0.12),
            border: `1px solid ${hexToRgba(color, 0.22)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <DynamicIcon name={habit.icon} size={19} color={color} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <NextLink
              href={`/dashboard/habits/${habit.id}`}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: completed ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                transition: 'color 0.2s ease',
                letterSpacing: '-0.1px',
              }}
            >
              {habit.name}
            </NextLink>
            {habit.category && (
              <span
                style={{
                  fontSize: 10.5, fontWeight: 600,
                  padding: '2px 7px', borderRadius: 99,
                  background: `${habit.category.color}18`,
                  border: `1px solid ${habit.category.color}30`,
                  color: habit.category.color,
                  flexShrink: 0,
                }}
              >
                {habit.category.name}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{freqLabel(habit)}</span>
            {streak > 0 && (
              <>
                <span style={{ fontSize: 10, color: 'var(--text-dimmed)' }}>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: streak >= 7 ? '#F59E0B' : 'var(--text-muted)' }}>
                  <Flame size={11} color={streak >= 7 ? '#F59E0B' : 'var(--text-muted)'} />
                  {streak}d
                </span>
              </>
            )}
            {(habit.completionRate ?? 0) > 0 && (
              <>
                <span style={{ fontSize: 10, color: 'var(--text-dimmed)' }}>·</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono'" }}>
                  {habit.completionRate}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: checkbox + menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <HabitCheckbox checked={checked} onChange={handleToggle} color={color} size={34} />

          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              aria-label="Options"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 7, border: 'none',
                background: menuOpen ? 'var(--bg-elevated)' : 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer',
                transition: 'background 0.12s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { if (!menuOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <MoreHorizontal size={15} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -4 }}
                  transition={{ duration: 0.13 }}
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 11,
                    boxShadow: 'var(--shadow-lg)',
                    padding: 5, minWidth: 152, zIndex: 30,
                  }}
                >
                  <MenuItem icon={<Pencil size={13} />} label="Edit"    onClick={() => { setMenuOpen(false); onEdit(habit); }} />
                  <MenuItem icon={<Archive size={13} />} label="Archive" onClick={() => { setMenuOpen(false); onArchive(habit.id); }} />
                  <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 2px' }} />
                  <MenuItem icon={<Trash2 size={13} />} label="Delete"  onClick={() => { setMenuOpen(false); onDelete(habit.id); }} danger />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
