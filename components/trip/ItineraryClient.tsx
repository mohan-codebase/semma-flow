'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarRange, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/trip/ConfirmModal';
import { Field, TextField, TextArea } from '@/components/trip/fields';
import { tripMutate } from '@/lib/trip/client';
import { useTripRealtime } from '@/lib/trip/useTripRealtime';
import { itinerarySchema } from '@/lib/trip/schemas';
import type { TripItineraryDay, Trip } from '@/lib/trip/types';

const TABLES = ['trip_itinerary'];

type FormState = { day: string; title: string; description: string; location: string };

export default function ItineraryClient({ days, userId, trip }: { days: TripItineraryDay[]; userId: string; trip: Trip }) {
  useTripRealtime(TABLES, userId);
  const router = useRouter();
  const { toast } = useToast();

  const nextDay = days.length > 0 ? Math.max(...days.map((d) => d.day)) + 1 : 1;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TripItineraryDay | null>(null);
  const [deleting, setDeleting] = useState<TripItineraryDay | null>(null);
  const [form, setForm] = useState<FormState>({ day: String(nextDay), title: '', description: '', location: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!formOpen) return;
    setErrors({});
    if (editing) {
      setForm({
        day: String(editing.day),
        title: editing.title,
        description: editing.description ?? '',
        location: editing.location ?? '',
      });
    } else {
      setForm({ day: String(nextDay), title: '', description: '', location: '' });
    }
  }, [formOpen, editing, nextDay]);

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = itinerarySchema.safeParse({ ...form, day: form.day === '' ? 0 : form.day, trip_id: trip.id });
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
    const res = editing
      ? await tripMutate('PATCH', `itinerary/${editing.id}`, parsed.data)
      : await tripMutate('POST', 'itinerary', parsed.data);
    setSaving(false);
    if (res.ok) {
      toast(editing ? 'Day updated' : 'Day added', 'success');
      setFormOpen(false);
      router.refresh();
    } else {
      toast(res.error, 'error');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await tripMutate('DELETE', `itinerary/${deleting.id}`);
    if (res.ok) {
      toast('Day removed', 'success');
      router.refresh();
    } else {
      toast(res.error, 'error');
    }
  }

  const iconBtn = (onClick: () => void, label: string, danger = false) => (
    <button onClick={onClick} aria-label={label} style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'transparent', border: 'none', color: danger ? 'var(--danger)' : 'var(--text-muted)', cursor: 'pointer' }}>
      {label.startsWith('Edit') ? <Pencil size={14} /> : <Trash2 size={14} />}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="sm" icon={<Plus size={15} />} onClick={() => { setEditing(null); setFormOpen(true); }}>
          Add day
        </Button>
      </div>

      {days.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarRange size={26} color="var(--accent-light)" />}
            title="No itinerary yet"
            description="Plan the trip day by day — Delhi, Leh, Nubra, Pangong…"
            cta={<Button icon={<Plus size={15} />} onClick={() => { setEditing(null); setFormOpen(true); }}>Add day</Button>}
            compact
          />
        </Card>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: '0 0 0 26px', position: 'relative', borderLeft: '2px dashed var(--border-default)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {days.map((d) => (
            <li key={d.id} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: -37, top: 2, width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-primary)', color: 'var(--accent-on-primary)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {d.day}
              </span>
              <Card padding="sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-light)' }}>
                      Day {d.day}
                    </p>
                    <h3 style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
                      {d.title}
                    </h3>
                    {d.location && (
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {d.location}
                      </p>
                    )}
                    {d.description && (
                      <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {d.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexShrink: 0 }}>
                    {iconBtn(() => { setEditing(d); setFormOpen(true); }, 'Edit day')}
                    {iconBtn(() => setDeleting(d), 'Delete day', true)}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit day' : 'Add day'} size="md" closeOnOutsideClick={false}>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 14 }}>
            <Field label="Day" error={errors.day}>
              <TextField type="number" min={1} value={form.day} onChange={set('day')} />
            </Field>
            <Field label="Title" required error={errors.title}>
              <TextField value={form.title} onChange={set('title')} placeholder="Leh to Nubra Valley" />
            </Field>
          </div>
          <Field label="Location" error={errors.location}>
            <TextField value={form.location} onChange={set('location')} placeholder="Nubra Valley" />
          </Field>
          <Field label="Description" error={errors.description}>
            <TextArea rows={3} value={form.description} onChange={set('description')} placeholder="Khardung La pass, sand dunes…" />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save' : 'Add day'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Remove this day?"
        description={deleting ? `Day ${deleting.day} — ${deleting.title}` : undefined}
        confirmLabel="Remove"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
