import React from 'react';
import Card from '@/components/ui/Card';

type Accent = 'default' | 'green' | 'red' | 'amber';

const accentColor: Record<Accent, string> = {
  default: 'var(--text-primary)',
  green: '#adadad',
  red: 'var(--danger)',
  amber: '#c1c1c1',
};

export default function StatCard({
  label,
  value,
  sub,
  icon,
  accent = 'default',
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: Accent;
}) {
  return (
    <Card padding="sm" style={{ height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, height: '100%' }}>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            {label}
          </p>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 18,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              color: accentColor[accent],
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {value}
          </p>
          {sub && <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-muted)' }}>{sub}</p>}
        </div>
        {icon && (
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--accent-glow)',
              color: 'var(--accent-light)',
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
