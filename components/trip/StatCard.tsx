import React from 'react';
import Card from '@/components/ui/Card';

type Accent = 'default' | 'green' | 'red' | 'amber';

const accentColor: Record<Accent, string> = {
  default: 'var(--text-primary)',
  green: '#34D399',
  red: 'var(--danger)',
  amber: '#FBBF24',
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
    <Card padding="md">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
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
              margin: '6px 0 0',
              fontSize: 23,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              color: accentColor[accent],
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {value}
          </p>
          {sub && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{sub}</p>}
        </div>
        {icon && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
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
