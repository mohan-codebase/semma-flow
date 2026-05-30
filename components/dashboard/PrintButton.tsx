'use client';

import React from 'react';

export default function PrintButton() {
  return (
    <button
      className="no-print"
      onClick={() => window.print()}
      style={{
        padding: '10px 18px', borderRadius: 12, border: 'none',
        background: '#7C3AED', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
      }}
    >
      Save as PDF
    </button>
  );
}
