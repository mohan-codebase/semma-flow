'use client';

import React, { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { expenseCategorySchema, type ExpenseCategoryFormValues } from '@/lib/validations/expense';
import type { ExpenseCategory } from '@/types/expense';

const PRESET_COLORS = [
  '#10B981', '#6366F1', '#F59E0B', '#EF4444', '#EC4899',
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16', '#64748B',
];

const PRESET_ICONS = [
  'tag', 'utensils', 'car', 'home', 'heart', 'shopping-bag',
  'zap', 'wifi', 'film', 'book', 'plane', 'gift',
];

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  onCreate: (data: ExpenseCategoryFormValues) => Promise<void>;
  onUpdate: (id: string, data: Partial<ExpenseCategoryFormValues>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CategoryManager({
  open, onClose, categories, onCreate, onUpdate, onDelete,
}: CategoryManagerProps) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 50 }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%', maxWidth: 440,
              maxHeight: '80vh', overflow: 'auto',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 20, padding: 24, zIndex: 51,
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Categories</h2>
              <button onClick={onClose} style={iconBtnStyle}><X size={15} /></button>
            </div>

            {/* Category list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {categories.map((cat) =>
                editId === cat.id ? (
                  <CategoryForm
                    key={cat.id}
                    defaultValues={{ name: cat.name, color: cat.color, icon: cat.icon, budget: cat.budget }}
                    onSave={async (data) => { await onUpdate(cat.id, data); setEditId(null); }}
                    onCancel={() => setEditId(null)}
                  />
                ) : (
                  <div
                    key={cat.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
                      borderRadius: 12, padding: '10px 14px',
                    }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</span>
                    {cat.budget && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        ₹{cat.budget.toLocaleString('en-IN')}/mo
                      </span>
                    )}
                    <button onClick={() => setEditId(cat.id)} style={iconBtnStyle}><Pencil size={12} /></button>
                    <button
                      onClick={() => onDelete(cat.id)}
                      style={{ ...iconBtnStyle, color: '#f87171', background: 'rgba(239,68,68,0.1)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              )}
              {categories.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  No categories yet. Add one below.
                </p>
              )}
            </div>

            {/* Add form */}
            {adding ? (
              <CategoryForm
                onSave={async (data) => { await onCreate(data); setAdding(false); }}
                onCancel={() => setAdding(false)}
              />
            ) : (
              <button
                onClick={() => setAdding(true)}
                style={{
                  width: '100%', height: 40, borderRadius: 10,
                  background: 'var(--bg-glass)',
                  border: '1px dashed var(--border-default)',
                  color: 'var(--accent-primary)',
                  fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Add Category
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CategoryForm({
  defaultValues,
  onSave,
  onCancel,
}: {
  defaultValues?: Partial<ExpenseCategoryFormValues>;
  onSave: (data: ExpenseCategoryFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<ExpenseCategoryFormValues>({
    resolver: zodResolver(expenseCategorySchema) as Resolver<ExpenseCategoryFormValues>,
    defaultValues: {
      name: defaultValues?.name ?? '',
      color: defaultValues?.color ?? '#10B981',
      icon: defaultValues?.icon ?? 'tag',
      budget: defaultValues?.budget ?? undefined,
    },
  });

  const selectedColor = watch('color');

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 12, padding: 14,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={miniLabel}>Name</label>
          <input {...register('name')} placeholder="e.g. Food" style={miniInput} autoFocus />
        </div>
        <div>
          <label style={miniLabel}>Monthly Budget (₹)</label>
          <input {...register('budget', { valueAsNumber: true })} type="number" min="0" placeholder="Optional" style={miniInput} />
        </div>
      </div>

      {/* Color swatches */}
      <div>
        <label style={miniLabel}>Color</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('color', c)}
              style={{
                width: 22, height: 22, borderRadius: '50%', background: c, border: 'none',
                cursor: 'pointer', outline: selectedColor === c ? `2px solid ${c}` : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ ...iconBtnStyle, width: 'auto', padding: '0 14px', fontSize: 12 }}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            height: 34, padding: '0 16px', borderRadius: 8,
            background: 'var(--accent-primary)', color: '#fff',
            fontSize: 12, fontWeight: 700, border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <Check size={12} /> {isSubmitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7,
  background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
  color: 'var(--text-muted)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0,
};

const miniLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
  letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5,
};

const miniInput: React.CSSProperties = {
  width: '100%', height: 36,
  background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
  borderRadius: 8, padding: '0 10px',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
};
