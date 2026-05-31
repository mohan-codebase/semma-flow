import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
      <Link
        href="/trip"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontSize: 13.5,
          fontWeight: 700,
          color: 'var(--accent-light)',
          textDecoration: 'none',
          width: '100%',
          padding: '12px 16px',
          borderRadius: 12,
          background: 'var(--accent-glow)',
          border: '1px solid var(--border-accent)',
          transition: 'all 0.15s ease',
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {title}
          </h1>
          {description && (
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>{description}</p>
          )}
        </div>
        {action && <div style={{ display: 'flex', gap: 8 }}>{action}</div>}
      </div>
    </div>
  );
}

