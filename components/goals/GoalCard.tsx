'use client';

import { useState } from 'react';
import { Target, Calendar, CheckCircle2, Circle, Edit2, Trash2, ChevronDown, ChevronUp, Pause, Ban } from 'lucide-react';
import type { Goal, GoalStatus } from '@/types/goal';

const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  health:        { emoji: '🏥', color: '#EF4444' },
  fitness:       { emoji: '💪', color: '#F97316' },
  finance:       { emoji: '💰', color: '#10B981' },
  career:        { emoji: '🚀', color: '#6366F1' },
  learning:      { emoji: '📚', color: '#F59E0B' },
  relationships: { emoji: '❤️', color: '#EC4899' },
  mindfulness:   { emoji: '🧘', color: '#8B5CF6' },
  personal:      { emoji: '⭐', color: '#06B6D4' },
};

const STATUS_META: Record<GoalStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active:    { label: 'Active',     color: '#10B981', icon: <Target size={10} /> },
  completed: { label: 'Completed',  color: '#6366F1', icon: <CheckCircle2 size={10} /> },
  paused:    { label: 'Paused',     color: '#F59E0B', icon: <Pause size={10} /> },
  abandoned: { label: 'Abandoned',  color: '#6B7280', icon: <Ban size={10} /> },
};

interface GoalCardProps {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
  onToggleMilestone: (goalId: string, milestoneId: string, completed: boolean) => void;
  onProgressChange: (goalId: string, progress: number) => void;
}

function daysLeft(targetDate: string | null) {
  if (!targetDate) return null;
  const diff = Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000);
  return diff;
}

export default function GoalCard({ goal, onEdit, onDelete, onToggleMilestone, onProgressChange }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [localProgress, setLocalProgress] = useState(goal.progress);

  const cat = CATEGORY_META[goal.category] ?? { emoji: '⭐', color: '#10B981' };
  const status = STATUS_META[goal.status];
  const days = daysLeft(goal.target_date);
  const completedMilestones = goal.milestones.filter((m) => m.completed).length;
  const totalMilestones = goal.milestones.length;

  const progressPct = localProgress;
  const progressColor = progressPct >= 100 ? '#10B981' : progressPct >= 60 ? '#6366F1' : progressPct >= 30 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid var(--border-default)`,
      borderLeft: `3px solid ${cat.color}`,
      borderRadius: 12,
      padding: '16px 18px',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: `${cat.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          {cat.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {goal.title}
            </span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: `${status.color}18`, color: status.color,
              padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700,
            }}>
              {status.icon} {status.label}
            </div>
          </div>

          {goal.description && (
            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {goal.description}
            </p>
          )}

          {/* Progress bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Progress</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: progressColor, fontFamily: "'IBM Plex Mono'" }}>{progressPct}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progressPct}%`, borderRadius: 99,
                background: `linear-gradient(90deg, ${progressColor}88, ${progressColor})`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* Meta chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {goal.target_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: days !== null && days < 0 ? 'var(--danger)' : days !== null && days <= 7 ? '#F59E0B' : 'var(--text-muted)' }}>
                <Calendar size={11} />
                {days === null ? '' : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
              </div>
            )}
            {totalMilestones > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <CheckCircle2 size={11} />
                {completedMilestones}/{totalMilestones} milestones
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {totalMilestones > 0 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 6 }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <button
            onClick={() => onEdit(goal)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 6 }}
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 6, borderRadius: 6 }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Progress slider (quick update) */}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>Quick update:</span>
        <input
          type="range" min={0} max={100} step={5}
          value={localProgress}
          onChange={(e) => setLocalProgress(Number(e.target.value))}
          onMouseUp={() => onProgressChange(goal.id, localProgress)}
          onTouchEnd={() => onProgressChange(goal.id, localProgress)}
          style={{ flex: 1, accentColor: progressColor }}
        />
      </div>

      {/* Milestones (expanded) */}
      {expanded && totalMilestones > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Milestones</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {goal.milestones.map((ms) => (
              <div
                key={ms.id}
                onClick={() => onToggleMilestone(goal.id, ms.id, !ms.completed)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}
              >
                {ms.completed
                  ? <CheckCircle2 size={15} color="#10B981" />
                  : <Circle size={15} color="var(--text-muted)" />
                }
                <span style={{
                  fontSize: 13, color: ms.completed ? 'var(--text-muted)' : 'var(--text-secondary)',
                  textDecoration: ms.completed ? 'line-through' : 'none',
                }}>
                  {ms.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
