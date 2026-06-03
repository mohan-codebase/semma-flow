'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Scale, Undo2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { tripMutate } from '@/lib/trip/client';
import { formatINR } from '@/lib/trip/format';
import type { Settlement, TripSettlement } from '@/lib/trip/types';

// Settlement card — shows who owes whom, lets you mark a payment as settled,
// and lists/undoes recorded settle-up payments.
export default function SettlementCard({
  settlement,
  tripId,
  settledPayments = [],
}: {
  settlement: Settlement;
  tripId?: string;
  settledPayments?: TripSettlement[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const settled = settlement.transfers.length === 0;

  // More than one person actually put in money toward the trip's expenses.
  const multiplePayers = Object.values(settlement.payments).filter((p) => p > 0.01).length > 1;

  // Per-person net pending: positive = owed money, negative = owes money.
  const balances = Object.entries(settlement.balances)
    .map(([name, balance]) => ({ name, balance }))
    .sort((a, b) => b.balance - a.balance);

  async function settleUp(t: { from: string; to: string; amount: number }) {
    if (!tripId) return;
    setBusy(`${t.from}-${t.to}`);
    const res = await tripMutate('POST', 'settlements', {
      trip_id: tripId,
      from_person: t.from,
      to_person: t.to,
      amount: t.amount,
    });
    setBusy(null);
    if (res.ok) {
      toast(`Marked ${t.from} → ${t.to} as paid`, 'success');
      router.refresh();
    } else {
      toast(res.error, 'error');
    }
  }

  async function undo(p: TripSettlement) {
    setBusy(`undo-${p.id}`);
    const res = await tripMutate('DELETE', `settlements/${p.id}`);
    setBusy(null);
    if (res.ok) {
      toast('Settlement undone', 'success');
      router.refresh();
    } else {
      toast(res.error, 'error');
    }
  }

  const miniItem = (label: string, value: string, sub?: string) => (
    <div key={label}>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      {sub && <p style={{ margin: '1px 0 0', fontSize: 11.5, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{sub}</p>}
    </div>
  );

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border-accent)',
        background: 'linear-gradient(150deg, var(--accent-glow-md), transparent 70%)',
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: 'var(--accent-light)' }}>
        <Scale size={14} />
        Current Settlement
      </div>

      {/* Who owes / who's owed — clear per-person net balances. */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {balances.map(({ name, balance }) => {
          const owes = balance < -0.01;
          const owed = balance > 0.01;
          return (
            <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span>
              <span
                style={{
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: owes ? 'var(--pending, #ff6b6b)' : owed ? '#adadad' : 'var(--text-muted)',
                }}
              >
                {owes ? `pending -${formatINR(-balance)}` : owed ? `credit +${formatINR(balance)}` : 'settled up'}
              </span>
            </div>
          );
        })}
      </div>

      {settled ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
            All settled up 🎉
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            No pending balances between travelers.
          </p>
        </div>
      ) : (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Suggested Transfers
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {settlement.transfers.map((t, idx) => {
              const isBusy = busy === `${t.from}-${t.to}`;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '8px 8px 8px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', minWidth: 0 }}>
                    <span>{t.from}</span>
                    <ArrowRight size={13} color="var(--accent-light)" />
                    <span>{t.to}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-light)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatINR(t.amount)}
                    </span>
                    {tripId && (
                      <button
                        type="button"
                        onClick={() => settleUp(t)}
                        disabled={isBusy}
                        title="Mark as paid"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '7px 13px',
                          fontSize: 12.5,
                          fontWeight: 600,
                          borderRadius: 999,
                          cursor: isBusy ? 'default' : 'pointer',
                          color: 'var(--accent-on-primary, #fff)',
                          background: 'var(--accent-primary)',
                          border: '1px solid rgba(255, 255, 255,0.14)',
                          boxShadow: '0 1px 3px rgba(48, 48, 48,0.25)',
                          whiteSpace: 'nowrap',
                          opacity: isBusy ? 0.55 : 1,
                          transition: 'opacity 0.15s ease, transform 0.15s ease',
                        }}
                      >
                        <Check size={13} strokeWidth={2.5} /> Settle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recorded settle-up payments, with undo. */}
      {settledPayments.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Settled payments
          </p>
          {settledPayments.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 12.5 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                <Check size={13} color="#adadad" />
                {p.from_person} → {p.to_person}
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formatINR(Number(p.amount))}</span>
              </span>
              <button
                type="button"
                onClick={() => undo(p)}
                disabled={busy === `undo-${p.id}`}
                title="Undo"
                aria-label="Undo settlement"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', fontSize: 11, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <Undo2 size={12} /> Undo
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        {Object.entries(settlement.payments).map(([traveler, paid]) =>
          // Show the per-person "share" only when a single person paid; when the
          // cost was split across multiple payers, just show what each paid.
          miniItem(
            `Paid by ${traveler}`,
            formatINR(paid),
            multiplePayers ? undefined : `share ${formatINR(settlement.owed[traveler] ?? 0)}`,
          )
        )}
        {miniItem('Total expenses', formatINR(settlement.totalExpenses))}
      </div>
    </div>
  );
}
