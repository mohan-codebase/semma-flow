'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Field, TextField } from '@/components/trip/fields';
import { tripSchema } from '@/lib/trip/schemas';
import { tripMutate } from '@/lib/trip/client';
import type { Trip } from '@/lib/trip/types';

function TravelerItem({
  name,
  onRemove,
  onEdit,
}: {
  name: string;
  onRemove: () => void;
  onEdit: (newName: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            flex: 1,
            background: 'var(--input-bg)',
            border: '1.5px solid var(--accent-primary)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 14,
            color: 'var(--text-primary)',
            outline: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onEdit(value);
              setEditing(false);
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            onEdit(value);
            setEditing(false);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--accent-primary)',
            color: 'var(--accent-on-primary)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setValue(name);
            setEditing(false);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid var(--border-default)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'var(--bg-tertiary)',
        borderRadius: 12,
        border: '1px solid var(--border-default)',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-light)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--danger)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function TripSettingsForm({ trip }: { trip: Trip }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: trip.name,
    start_date: trip.start_date.slice(0, 10),
    end_date: trip.end_date.slice(0, 10),
    total_budget: String(trip.total_budget),
  });
  const [travelers, setTravelers] = useState<string[]>(trip.travelers || ['Mohan', 'Charles']);
  const [newTraveler, setNewTraveler] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const addTraveler = () => {
    const name = newTraveler.trim();
    if (!name) return;
    if (travelers.includes(name)) {
      toast('Traveler already exists', 'error');
      return;
    }
    setTravelers([...travelers, name]);
    setNewTraveler('');
  };

  const removeTraveler = (name: string) => {
    if (travelers.length <= 1) {
      toast('A trip must have at least one traveler', 'error');
      return;
    }
    setTravelers(travelers.filter((t) => t !== name));
  };

  const editTraveler = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (trimmed === oldName) return;
    if (travelers.includes(trimmed)) {
      toast('Traveler already exists', 'error');
      return;
    }
    setTravelers(travelers.map((t) => (t === oldName ? trimmed : t)));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = tripSchema.safeParse({
      ...form,
      total_budget: form.total_budget === '' ? 0 : form.total_budget,
      travelers,
    });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !fe[key]) fe[key] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setSaving(true);
    const res = await tripMutate('PATCH', 'trip', { id: trip.id, ...parsed.data });
    setSaving(false);
    if (res.ok) {
      toast('Trip updated', 'success');
      router.refresh();
    } else {
      toast(res.error, 'error');
    }
  }

  const handleDeleteTrip = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete the trip "${trip.name}"? This will permanently delete all associated expenses, bookings, itinerary days, documents, and packing items.`
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/trip/trip?id=${trip.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete trip');

      // Clear active trip cookie
      await fetch('/api/trip/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: '' }),
      });

      toast('Trip deleted', 'success');
      router.push('/trip');
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete trip', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card padding="lg" className="trip-settings-card">
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 460 }}>
          <Field label="Trip name" required error={errors.name}>
            <TextField value={form.name} onChange={set('name')} />
          </Field>
          <div className="trip-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Start date" error={errors.start_date}>
              <TextField type="date" value={form.start_date} onChange={set('start_date')} />
            </Field>
            <Field label="End date" error={errors.end_date}>
              <TextField type="date" value={form.end_date} onChange={set('end_date')} />
            </Field>
          </div>
          <Field label="Total budget (₹)" error={errors.total_budget}>
            <TextField type="number" min={0} step="any" value={form.total_budget} onChange={set('total_budget')} />
          </Field>

          <Field label="Travelers / Persons">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {travelers.map((t) => (
                <TravelerItem
                  key={t}
                  name={t}
                  onRemove={() => removeTraveler(t)}
                  onEdit={(newName) => editTraveler(t, newName)}
                />
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <input
                  type="text"
                  placeholder="e.g. Alice"
                  value={newTraveler}
                  onChange={(e) => setNewTraveler(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTraveler();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addTraveler}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </Field>

          <div style={{ marginTop: 8 }}>
            <Button type="submit" loading={saving}>Save changes</Button>
          </div>
        </form>
      </Card>

      <Card padding="lg" style={{ border: '1px solid rgba(104, 104, 104,0.2)', background: 'var(--danger-glow)' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>Danger Zone</h3>
        <p style={{ margin: '8px 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
          Permanently delete this trip and all its expenses, bookings, documents, itinerary days, and packing items. This cannot be undone.
        </p>
        <button
          onClick={handleDeleteTrip}
          disabled={deleting}
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            border: 'none',
            background: '#6a6a6a',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {deleting ? 'Deleting...' : 'Delete Trip'}
        </button>
      </Card>
    </div>
  );
}
