'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Luggage, Plus, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { TextField } from '@/components/trip/fields';
import { tripMutate } from '@/lib/trip/client';
import { useTripRealtime } from '@/lib/trip/useTripRealtime';
import type { TripPackingItem, Trip } from '@/lib/trip/types';

const TABLES = ['trip_packing_items'];

export default function PackingClient({ items, userId, trip }: { items: TripPackingItem[]; userId: string; trip: Trip }) {
  useTripRealtime(TABLES, userId);
  const router = useRouter();
  const { toast } = useToast();

  const [newItem, setNewItem] = useState('');
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const completedCount = items.filter((i) => pending[i.id] ?? i.completed).length;
  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const value = newItem.trim();
    if (!value) return;
    setAdding(true);
    const res = await tripMutate('POST', 'packing', { item: value, trip_id: trip.id });
    setAdding(false);
    if (res.ok) {
      setNewItem('');
      router.refresh();
    } else {
      toast(res.error, 'error');
    }
  }

  async function handleToggle(item: TripPackingItem) {
    const next = !(pending[item.id] ?? item.completed);
    setPending((p) => ({ ...p, [item.id]: next }));
    const res = await tripMutate('PATCH', `packing/${item.id}`, { completed: next });
    if (res.ok) {
      router.refresh();
    } else {
      setPending((p) => ({ ...p, [item.id]: item.completed }));
      toast(res.error, 'error');
    }
  }

  async function handleDelete(id: string) {
    const res = await tripMutate('DELETE', `packing/${id}`);
    if (res.ok) router.refresh();
    else toast(res.error, 'error');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Packing progress</span>
          <span style={{ color: 'var(--text-muted)' }}>{completedCount}/{items.length} · {pct}%</span>
        </div>
        <div style={{ marginTop: 12, height: 8, borderRadius: 'var(--r-pill)', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
        </div>
      </Card>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <TextField value={newItem} onChange={setNewItem} placeholder="Add an item to pack…" />
        </div>
        <Button type="submit" loading={adding} icon={<Plus size={15} />}>Add</Button>
      </form>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Luggage size={26} color="var(--accent-light)" />}
            title="Your packing list is empty"
            description="Add thermals, gloves, power bank, documents… everything for Ladakh."
            compact
          />
        </Card>
      ) : (
        <Card padding="none">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {items.map((item, idx) => {
              const checked = pending[item.id] ?? item.completed;
              return (
                <li
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderTop: idx === 0 ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  <button
                    onClick={() => handleToggle(item)}
                    aria-label={checked ? 'Mark not packed' : 'Mark packed'}
                    style={{
                      width: 22,
                      height: 22,
                      flexShrink: 0,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: checked ? 'var(--accent-primary)' : 'transparent',
                      border: `1.5px solid ${checked ? 'var(--accent-primary)' : 'var(--border-medium)'}`,
                      color: 'var(--accent-on-primary)',
                    }}
                  >
                    {checked && <Check size={14} />}
                  </button>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13.5,
                      color: checked ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: checked ? 'line-through' : 'none',
                    }}
                  >
                    {item.item}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    aria-label="Delete item"
                    style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
