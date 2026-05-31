'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/trip/ConfirmModal';
import { Select } from '@/components/trip/fields';
import { createClient } from '@/lib/supabase/client';
import { tripMutate } from '@/lib/trip/client';
import { formatDate, humanBytes } from '@/lib/trip/format';
import { useTripRealtime } from '@/lib/trip/useTripRealtime';
import { DOCUMENT_CATEGORIES, type DocumentCategory, type TripDocument, type Trip } from '@/lib/trip/types';

const TABLES = ['trip_documents'];

export default function DocumentsClient({ documents, userId, trip }: { documents: TripDocument[]; userId: string; trip: Trip }) {
  useTripRealtime(TABLES, userId);
  const router = useRouter();
  const { toast } = useToast();

  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<DocumentCategory>('Ticket');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<TripDocument | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        const safe = file.name.replace(/[^\w.\-]+/g, '_');
        const path = `${userId}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage.from('trip-documents').upload(path, file, { upsert: false });
        if (upErr) {
          toast(`Upload failed: ${upErr.message}`, 'error');
          continue;
        }
        const res = await tripMutate('POST', 'documents', {
          trip_id: trip.id,
          name: file.name,
          category,
          file_path: path,
          size_bytes: file.size,
          mime_type: file.type || null,
        });
        if (!res.ok) toast(res.error, 'error');
        else toast(`Uploaded ${file.name}`, 'success');
      }
      router.refresh();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDownload(doc: TripDocument) {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from('trip-documents').createSignedUrl(doc.file_path, 60);
    if (error || !data) {
      toast('Could not generate download link.', 'error');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await tripMutate('DELETE', `documents/${deleting.id}`);
    if (res.ok) {
      toast('Document deleted', 'success');
      router.refresh();
    } else {
      toast(res.error, 'error');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card padding="md">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 180 }}>
            <Select value={category} onChange={(v) => setCategory(v as DocumentCategory)} options={DOCUMENT_CATEGORIES} />
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.heic"
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button loading={uploading} icon={<Upload size={15} />} onClick={() => fileRef.current?.click()}>
            {uploading ? 'Uploading…' : 'Upload files'}
          </Button>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            Tickets, hotel confirmations, ID copies, permits (PDF/JPG/PNG).
          </p>
        </div>
      </Card>

      {documents.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText size={26} color="var(--accent-light)" />}
            title="No documents yet"
            description="Upload tickets, permits and ID copies so they're handy on the trip."
            compact
          />
        </Card>
      ) : (
        <Card padding="none">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {documents.map((doc, idx) => (
              <li
                key={doc.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: idx === 0 ? 'none' : '1px solid var(--border-subtle)' }}
              >
                <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, background: 'var(--accent-glow)', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.name}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    {humanBytes(doc.size_bytes)} · {doc.category} · {formatDate(doc.created_at)}
                  </p>
                </div>
                <button onClick={() => handleDownload(doc)} aria-label="Download" style={{ width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <Download size={15} />
                </button>
                <button onClick={() => setDeleting(doc)} aria-label="Delete" style={{ width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this document?"
        description={deleting?.name}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
