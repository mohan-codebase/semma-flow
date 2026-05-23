'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Analytics error]', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
        gap: 14,
        textAlign: 'center',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
      }}
    >
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
        Failed to load analytics data.
      </p>
      <Button variant="secondary" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
