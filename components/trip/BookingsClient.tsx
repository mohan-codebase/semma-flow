'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Building2,
  CheckCircle2,
  Clock,
  Pencil,
  Plane,
  Plus,
  Ticket,
  Train,
  Trash2,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/trip/ConfirmModal';
import { Field, Select, TextField } from '@/components/trip/fields';
import { tripMutate } from '@/lib/trip/client';
import { formatINR } from '@/lib/trip/format';
import { useTripRealtime } from '@/lib/trip/useTripRealtime';
import {
  BOOKING_STATUSES,
  BOOKING_TYPES,
  type BookingType,
  type TripBooking,
  type Trip,
} from '@/lib/trip/types';

const TABLES = ['trip_bookings'];

const TYPE_ICON: Record<BookingType, typeof Plane> = {
  Flight: Plane,
  Train: Train,
  Hotel: Building2,
  'Bike Rental': Bike,
};

type FormState = { type: string; booking_name: string; amount: string; paid_by: string; status: string };

export default function BookingsClient({ bookings, userId, trip }: { bookings: TripBooking[]; userId: string; trip: Trip }) {
  useTripRealtime(TABLES, userId);
  const router = useRouter();
  const { toast } = useToast();

  const defaultTraveler = trip.travelers[0] || '';
  const getEmptyForm = (): FormState => ({
    type: 'Flight',
    booking_name: '',
    amount: '',
    paid_by: defaultTraveler,
    status: 'Pending',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TripBooking | null>(null);
  const [deleting, setDeleting] = useState<TripBooking | null>(null);
  const [form, setForm] = useState<FormState>(() => getEmptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const confirmed = bookings.filter((b) => b.status === 'Confirmed').length;
  const totalValue = bookings.reduce((s, b) => s + Number(b.amount), 0);

  useEffect(() => {
    if (!formOpen) return;
    setErrors({});
    if (editing) {
      setForm({
        type: editing.type,
        booking_name: editing.booking_name,
        amount: String(editing.amount),
        paid_by: editing.paid_by,
        status: editing.status,
      });
    } else {
      setForm(getEmptyForm());
    }
  }, [formOpen, editing, defaultTraveler]);

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      trip_id: trip.id,
      ...form,
      amount: form.amount === '' ? 0 : Number(form.amount),
    };
    if (!payload.booking_name.trim()) {
      setErrors({ booking_name: 'Required' });
      return;
    }
    setSaving(true);
    const res = editing
      ? await tripMutate('PATCH', `bookings/${editing.id}`, payload)
      : await tripMutate('POST', 'bookings', payload);
    setSaving(false);
    if (res.ok) {
      toast(editing ? 'Booking updated' : 'Booking added', 'success');
      setFormOpen(false);
      router.refresh();
    } else {
      toast(res.error, 'error');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await tripMutate('DELETE', `bookings/${deleting.id}`);
    if (res.ok) {
      toast('Booking deleted', 'success');
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          {confirmed}/{bookings.length} confirmed · {formatINR(totalValue)} total
        </p>
        <Button size="sm" icon={<Plus size={15} />} onClick={() => { setEditing(null); setFormOpen(true); }}>
          Add booking
        </Button>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ticket size={26} color="var(--accent-light)" />}
            title="No bookings yet"
            description="Track flights, trains, hotels and bike rentals — and their status."
            cta={<Button icon={<Plus size={15} />} onClick={() => { setEditing(null); setFormOpen(true); }}>Add booking</Button>}
            compact
          />
        </Card>
      ) : (
        <div data-responsive-stack="true" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {bookings.map((b) => {
            const Icon = TYPE_ICON[b.type];
            const isConfirmed = b.status === 'Confirmed';
            return (
              <Card key={b.id} padding="sm">
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, background: 'var(--accent-glow)', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.booking_name}
                      </p>
                      <div style={{ display: 'flex', flexShrink: 0 }}>
                        {iconBtn(() => { setEditing(b); setFormOpen(true); }, 'Edit booking')}
                        {iconBtn(() => setDeleting(b), 'Delete booking', true)}
                      </div>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      {b.type} · paid by {b.paid_by}
                    </p>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatINR(Number(b.amount))}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 9px',
                          borderRadius: 'var(--r-pill)',
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: isConfirmed ? '#adadad' : '#c1c1c1',
                          background: isConfirmed ? 'rgba(173, 173, 173,0.14)' : 'rgba(193, 193, 193,0.14)',
                        }}
                      >
                        {isConfirmed ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {b.status}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit booking' : 'Add booking'} size="md" closeOnOutsideClick={false}>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="trip-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Type">
              <Select value={form.type} onChange={set('type')} options={BOOKING_TYPES} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={set('status')} options={BOOKING_STATUSES} />
            </Field>
          </div>
          <Field label="Booking name" required error={errors.booking_name}>
            <TextField value={form.booking_name} onChange={set('booking_name')} placeholder="Delhi → Leh (Vistara UK-621)" />
          </Field>
          <div className="trip-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Amount (₹)">
              <TextField type="number" min={0} step="any" value={form.amount} onChange={set('amount')} placeholder="0" />
            </Field>
            <Field label="Paid by">
              <Select value={form.paid_by} onChange={set('paid_by')} options={trip.travelers} />
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save' : 'Add booking'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this booking?"
        description={deleting?.booking_name}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
