'use client';

import React from 'react';

export default function PrintButton() {
  return (
    <button
      className="no-print"
      onClick={() => window.print()}
      style={{
        padding: '10px 18px', borderRadius: 12, border: 'none',
        background: 'var(--accent-primary)', color: 'var(--accent-on-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
      }}
    >
      Save as PDF
    </button>
  );
}
