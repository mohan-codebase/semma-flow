'use client';

import React, { useEffect } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, DollarSign, Calendar, Tag, FileText, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { expenseSchema, type ExpenseFormValues } from '@/lib/validations/expense';
import type { Expense, ExpenseCategory } from '@/types/expense';

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ExpenseFormValues) => Promise<void>;
  categories: ExpenseCategory[];
  expense?: Expense | null;
}

export default function ExpenseForm({ open, onClose, onSave, categories, expense }: ExpenseFormProps) {
  const isEdit = !!expense;

  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as Resolver<ExpenseFormValues>,
    defaultValues: {
      amount: expense?.amount ?? ('' as unknown as number),
      description: expense?.description ?? '',
      note: expense?.note ?? '',
      category_id: expense?.category_id ?? null,
      date: expense?.date ?? today,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        amount: expense?.amount ?? ('' as unknown as number),
        description: expense?.description ?? '',
        note: expense?.note ?? '',
        category_id: expense?.category_id ?? null,
        date: expense?.date ?? today,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expense]);

  const onSubmit = async (data: ExpenseFormValues) => {
    await onSave(data);
    onClose();
  };

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
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 50,
            }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%', maxWidth: 460,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 20,
              padding: 28,
              zIndex: 51,
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {isEdit ? 'Edit Expense' : 'Add Expense'}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {isEdit ? 'Update expense' : 'Record a new expense'}
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Amount */}
              <div>
                <label style={labelStyle}>
                  <DollarSign size={12} /> Amount
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', fontSize: 15, fontWeight: 600, pointerEvents: 'none',
                  }}>₹</span>
                  <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    style={{ ...inputStyle, paddingLeft: 32 }}
                    autoFocus
                  />
                </div>
                {errors.amount && <p style={errorStyle}>{errors.amount.message}</p>}
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>
                  <FileText size={12} /> Description
                </label>
                <input
                  {...register('description')}
                  type="text"
                  placeholder="What did you spend on?"
                  style={inputStyle}
                />
                {errors.description && <p style={errorStyle}>{errors.description.message}</p>}
              </div>

              {/* Category + Date row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>
                    <Tag size={12} /> Category
                  </label>
                  <Controller
                    name="category_id"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        style={selectStyle}
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    <Calendar size={12} /> Date
                  </label>
                  <input
                    {...register('date')}
                    type="date"
                    style={selectStyle}
                  />
                  {errors.date && <p style={errorStyle}>{errors.date.message}</p>}
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={labelStyle}>
                  <StickyNote size={12} /> Note <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
                </label>
                <textarea
                  {...register('note')}
                  placeholder="Any extra details…"
                  rows={2}
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 10,
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {isSubmitting ? 'Saving…' : isEdit ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
  letterSpacing: '0.06em', textTransform: 'uppercase',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  background: 'var(--bg-glass)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 10,
  padding: '0 14px',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  fontSize: 11, color: '#f87171', marginTop: 4, margin: 0,
};

const cancelBtnStyle: React.CSSProperties = {
  width: 96, height: 42, borderRadius: 10,
  background: 'var(--bg-glass)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-secondary)',
  fontWeight: 600, fontSize: 14,
  cursor: 'pointer',
};
