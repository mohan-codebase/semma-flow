import { redirect } from 'next/navigation';
import { ensureTrip, getPackingItems } from '@/lib/trip/server';
import PageHeader from '@/components/trip/PageHeader';
import PackingClient from '@/components/trip/PackingClient';

export default async function PackingPage() {
  const ctx = await ensureTrip();
  if (!ctx) redirect('/login');
  const items = await getPackingItems(ctx.trip.id);

  return (
    <>
      <PageHeader title="Packing checklist" description="Tick things off as you pack. High-altitude essentials included." />
      <PackingClient items={items} userId={ctx.userId} trip={ctx.trip} />
    </>
  );
}
