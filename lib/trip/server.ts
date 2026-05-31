import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import type {
  Trip,
  TripBooking,
  TripDocument,
  TripExpense,
  TripItineraryDay,
  TripPackingItem,
  TripSettlement,
} from '@/lib/trip/types';

// Starter packing list seeded the first time a user opens the planner.
const STARTER_PACKING = [
  'Thermal wear', 'Down jacket', 'Gloves', 'Woolen cap', 'Sunglasses',
  'Power bank', 'Phone charger', 'Aadhaar card', 'Driving license',
  'Sunscreen (SPF 50)', 'Lip balm', 'Diamox / altitude meds',
  'First-aid kit', 'Reusable water bottle', 'Trekking shoes',
];

/**
 * Fetch the signed-in user's active trip, lazily creating a default one (and seeding a
 * starter packing list) on first visit. Returns null only when unauthenticated.
 */
export async function ensureTrip(): Promise<{ userId: string; trip: Trip } | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Check active trip ID from cookies
  const cookieStore = await cookies();
  const activeTripId = cookieStore.get('active_trip_id')?.value;

  if (activeTripId) {
    const { data: trip } = await supabase
      .from('trip_trips')
      .select('*')
      .eq('id', activeTripId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (trip) return { userId: user.id, trip: trip as Trip };
  }

  // 2. Fallback: get the most recently created trip for this user
  const { data: trips } = await supabase
    .from('trip_trips')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (trips && trips.length > 0) {
    return { userId: user.id, trip: trips[0] as Trip };
  }

  // 3. Fallback: Create a default trip for this user.
  const start = new Date();
  start.setMonth(start.getMonth() + 3);
  const end = new Date(start);
  end.setDate(end.getDate() + 9);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const { data: created } = await supabase
    .from('trip_trips')
    .insert({
      user_id: user.id,
      name: 'Ladakh Trip',
      start_date: iso(start),
      end_date: iso(end),
      total_budget: 80000,
      travelers: ['Mohan', 'Charles'],
    })
    .select('*')
    .single();

  // Seed starter packing list (ignore failures — non-critical).
  if (created) {
    await supabase
      .from('trip_packing_items')
      .insert(STARTER_PACKING.map((item) => ({ user_id: user.id, trip_id: created.id, item })));
  }

  return created ? { userId: user.id, trip: created as Trip } : null;
}

export async function getTrips(userId: string): Promise<Trip[]> {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('trip_trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return (data as Trip[]) ?? [];
  } catch {
    return [];
  }
}

export async function getExpenses(tripId: string): Promise<TripExpense[]> {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('trip_expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });
    return (data as TripExpense[]) ?? [];
  } catch {
    return [];
  }
}

export async function getBookings(tripId: string): Promise<TripBooking[]> {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('trip_bookings')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });
    return (data as TripBooking[]) ?? [];
  } catch {
    return [];
  }
}

export async function getItinerary(tripId: string): Promise<TripItineraryDay[]> {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('trip_itinerary')
      .select('*')
      .eq('trip_id', tripId)
      .order('day', { ascending: true });
    return (data as TripItineraryDay[]) ?? [];
  } catch {
    return [];
  }
}

export async function getPackingItems(tripId: string): Promise<TripPackingItem[]> {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('trip_packing_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });
    return (data as TripPackingItem[]) ?? [];
  } catch {
    return [];
  }
}

export async function getSettlements(tripId: string): Promise<TripSettlement[]> {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('trip_settlements')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });
    return (data as TripSettlement[]) ?? [];
  } catch {
    return [];
  }
}

export async function getDocuments(tripId: string): Promise<TripDocument[]> {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('trip_documents')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });
    return (data as TripDocument[]) ?? [];
  } catch {
    return [];
  }
}
