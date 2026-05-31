import { redirect } from 'next/navigation';
import { ensureTrip } from '@/lib/trip/server';
import PageHeader from '@/components/trip/PageHeader';
import TripSettingsForm from '@/components/trip/TripSettingsForm';

export default async function SettingsPage() {
  const ctx = await ensureTrip();
  if (!ctx) redirect('/login');

  return (
    <>
      <PageHeader title="Settings" description="Trip name, dates and the total budget that drives the dashboard." />
      <TripSettingsForm trip={ctx.trip} />
    </>
  );
}
