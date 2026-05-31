import { redirect } from 'next/navigation';
import { ensureTrip, getDocuments } from '@/lib/trip/server';
import PageHeader from '@/components/trip/PageHeader';
import DocumentsClient from '@/components/trip/DocumentsClient';

export default async function DocumentsPage() {
  const ctx = await ensureTrip();
  if (!ctx) redirect('/login');
  const documents = await getDocuments(ctx.trip.id);

  return (
    <>
      <PageHeader title="Documents" description="Tickets, hotel confirmations, ID copies and permits — all in one place." />
      <DocumentsClient documents={documents} userId={ctx.userId} trip={ctx.trip} />
    </>
  );
}
