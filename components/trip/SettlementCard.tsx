import { ArrowRight, Scale } from 'lucide-react';
import { formatINR } from '@/lib/trip/format';
import type { Settlement } from '@/lib/trip/types';

// Prominent settlement card — "Mohan → Charles  ₹6,250".
export default function SettlementCard({ settlement }: { settlement: Settlement }) {
  const settled = settlement.transfers.length === 0;

  const miniItem = (label: string, value: string) => (
    <div key={label}>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
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
        padding: 22,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--accent-light)' }}>
        <Scale size={15} />
        Current Settlement
      </div>

      {settled ? (
        <div style={{ marginTop: 14 }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
            All settled up 🎉
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Everyone has paid an equal share so far.
          </p>
        </div>
      ) : (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Suggested Transfers
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {settlement.transfers.map((t, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  <span>{t.from}</span>
                  <ArrowRight size={14} color="var(--accent-light)" />
                  <span>{t.to}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-light)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatINR(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 18,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}
      >
        {Object.entries(settlement.payments).map(([traveler, paid]) =>
          miniItem(`Paid by ${traveler}`, formatINR(paid))
        )}
        {miniItem('Total expenses', formatINR(settlement.totalExpenses))}
        {miniItem('Share / person', formatINR(settlement.sharePerPerson))}
      </div>
    </div>
  );
}
