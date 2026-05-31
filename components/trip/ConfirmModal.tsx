'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function ConfirmModal({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);

  async function handle() {
    setBusy(true);
    await onConfirm();
    setBusy(false);
    onClose();
  }

  return (
    <Modal isOpen={open} onClose={onClose} title={title} size="sm">
      {description && (
        <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" loading={busy} onClick={handle}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
