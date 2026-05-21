'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Target, Plus, Trophy, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import type { Goal, GoalStatus, GoalCategory } from '@/types/goal';
import type { GoalFormValues } from '@/lib/validations/goal';
import GoalCard from '@/components/goals/GoalCard';
import GoalForm from '@/components/goals/GoalForm';

type FilterStatus = 'all' | GoalStatus;
type FilterCategory = 'all' | GoalCategory;

const CATEGORY_OPTIONS: { value: FilterCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'health', label: '🏥 Health' },
  { value: 'fitness', label: '💪 Fitness' },
  { value: 'finance', label: '💰 Finance' },
  { value: 'career', label: '🚀 Career' },
  { value: 'learning', label: '📚 Learning' },
  { value: 'relationships', label: '❤️ Relationships' },
  { value: 'mindfulness', label: '🧘 Mindfulness' },
  { value: 'personal', label: '⭐ Personal' },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/goals');
      const json = await res.json();
      if (json.data) setGoals(json.data);
    } catch {
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return goals.filter((g) => {
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && g.category !== categoryFilter) return false;
      return true;
    });
  }, [goals, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const active = goals.filter((g) => g.status === 'active').length;
    const completed = goals.filter((g) => g.status === 'completed').length;
    const avgProgress = goals.length
      ? Math.round(goals.filter((g) => g.status === 'active').reduce((s, g) => s + g.progress, 0) / Math.max(1, goals.filter((g) => g.status === 'active').length))
      : 0;
    const overdue = goals.filter((g) => {
      if (g.status !== 'active' || !g.target_date) return false;
      return new Date(g.target_date) < new Date();
    }).length;
    return { active, completed, avgProgress, overdue };
  }, [goals]);

  async function handleSave(data: GoalFormValues) {
    setSaving(true);
    try {
      const url = editGoal ? `/api/goals/${editGoal.id}` : '/api/goals';
      const method = editGoal ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setGoals((prev) =>
        editGoal
          ? prev.map((g) => g.id === editGoal.id ? json.data : g)
          : [json.data, ...prev]
      );
      setShowForm(false);
      setEditGoal(null);
    } catch {
      setError('Failed to save goal');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this goal?')) return;
    const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    if (res.ok) setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  async function handleToggleMilestone(goalId: string, milestoneId: string, completed: boolean) {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const milestones = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed, completed_at: completed ? new Date().toISOString() : null } : m
    );
    const completedCount = milestones.filter((m) => m.completed).length;
    const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : goal.progress;

    setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, milestones, progress } : g));
    await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestones, progress }),
    });
  }

  async function handleProgressChange(goalId: string, progress: number) {
    setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, progress } : g));
    await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    });
  }

  const chip = (active: boolean, onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500,
        border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-default)'}`,
        background: active ? 'var(--accent-glow-md)' : 'var(--bg-elevated)',
        color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Target size={22} color="var(--accent-primary)" /> Goal Tracker
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Set intentions, track milestones, achieve more
          </p>
        </div>
        <button
          onClick={() => { setEditGoal(null); setShowForm(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: 'var(--accent-primary)', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          <Plus size={15} /> New Goal
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Active Goals', value: stats.active, icon: <Target size={16} />, color: '#10B981' },
          { label: 'Completed', value: stats.completed, icon: <Trophy size={16} />, color: '#6366F1' },
          { label: 'Avg Progress', value: `${stats.avgProgress}%`, icon: <TrendingUp size={16} />, color: '#F59E0B' },
          { label: 'Overdue', value: stats.overdue, icon: <Clock size={16} />, color: stats.overdue > 0 ? '#EF4444' : '#6B7280' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.color, marginBottom: 8 }}>
              {s.icon}
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'IBM Plex Mono'" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {(['all', 'active', 'completed', 'paused', 'abandoned'] as FilterStatus[]).map((s) =>
          chip(statusFilter === s, () => setStatusFilter(s), s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1))
        )}
        <div style={{ width: 1, background: 'var(--border-subtle)', margin: '0 4px' }} />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as FilterCategory)}
          style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#EF444420', border: '1px solid #EF4444', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#EF4444', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Goals list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 120, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border-default)', animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Target size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 15, margin: 0 }}>
            {goals.length === 0 ? 'No goals yet. Create your first goal!' : 'No goals match the current filters.'}
          </p>
          {goals.length === 0 && (
            <button
              onClick={() => { setEditGoal(null); setShowForm(true); }}
              style={{ marginTop: 16, padding: '9px 20px', borderRadius: 10, border: 'none', background: 'var(--accent-primary)', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Create First Goal
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Active goals with progress ring summary */}
          {statusFilter === 'all' && goals.filter((g) => g.status === 'active').length > 0 && categoryFilter === 'all' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '14px 18px', marginBottom: 4 }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Progress</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {goals.filter((g) => g.status === 'active').map((g) => (
                  <div key={g.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 60 }}>
                    <div style={{ position: 'relative', width: 44, height: 44 }}>
                      <svg width={44} height={44} style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={22} cy={22} r={17} fill="none" stroke="var(--bg-elevated)" strokeWidth={4} />
                        <circle cx={22} cy={22} r={17} fill="none"
                          stroke={g.progress >= 100 ? '#10B981' : g.progress >= 60 ? '#6366F1' : g.progress >= 30 ? '#F59E0B' : '#EF4444'}
                          strokeWidth={4}
                          strokeDasharray={`${2 * Math.PI * 17}`}
                          strokeDashoffset={`${2 * Math.PI * 17 * (1 - g.progress / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {g.progress}%
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filtered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={(g) => { setEditGoal(g); setShowForm(true); }}
              onDelete={handleDelete}
              onToggleMilestone={handleToggleMilestone}
              onProgressChange={handleProgressChange}
            />
          ))}
        </div>
      )}

      {/* Completed goals section */}
      {statusFilter === 'all' && goals.filter((g) => g.status === 'completed').length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle2 size={14} color="#6366F1" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Completed ({goals.filter((g) => g.status === 'completed').length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: 0.65 }}>
            {goals.filter((g) => g.status === 'completed').map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={(g) => { setEditGoal(g); setShowForm(true); }}
                onDelete={handleDelete}
                onToggleMilestone={handleToggleMilestone}
                onProgressChange={handleProgressChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <GoalForm
          goal={editGoal}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditGoal(null); }}
          saving={saving}
        />
      )}
    </div>
  );
}
