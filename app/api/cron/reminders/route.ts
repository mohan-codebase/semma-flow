/**
 * POST /api/cron/reminders
 *
 * Sends push notifications for habits whose reminder_time falls within the
 * current 5-minute window AND haven't been completed today.
 *
 * Call this endpoint every 5 minutes via:
 *   - Vercel Cron:  vercel.json → { "crons": [{ "path": "/api/cron/reminders", "schedule": "*/5 * * * *" }] }
 *   - Upstash QStash, GitHub Actions, or any external cron service
 *
 * Protected by CRON_SECRET env var (set it, then pass as Authorization header).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '@/lib/webpush';

function ok<T>(data: T) {
  return NextResponse.json({ data });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Use the service-role key so we can read all users' habits & subscriptions
function getAdminClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role not configured');
  return createClient(url, key);
}

// Build a "HH:MM" string for the current time in a given timezone
function currentTimeInTZ(tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());
  }
}

// Produce all "HH:MM" strings within a ±2-minute window of `nowHHMM`
function timeWindow(nowHHMM: string): string[] {
  const [h, m] = nowHHMM.split(':').map(Number);
  const slots: string[] = [];
  for (let delta = -2; delta <= 2; delta++) {
    let mm = m + delta;
    let hh = h;
    if (mm < 0)  { mm += 60; hh -= 1; }
    if (mm >= 60){ mm -= 60; hh += 1; }
    hh = ((hh % 24) + 24) % 24;
    slots.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  return slots;
}

export async function POST(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${cronSecret}`) {
      return err('Unauthorized', 401);
    }
  }

  let supabase: ReturnType<typeof getAdminClient>;
  try {
    supabase = getAdminClient();
  } catch {
    return err('Supabase service role not configured — skipping cron run.', 503);
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC

  // ── Fetch all active habits that have a reminder_time ────────────────
  const { data: habits, error: habitsErr } = await supabase
    .from('habits')
    .select('id, user_id, name, icon, reminder_time')
    .eq('is_archived', false)
    .not('reminder_time', 'is', null);

  if (habitsErr) {
    console.error('[cron/reminders] habits fetch error:', habitsErr);
    return err('DB error fetching habits', 500);
  }
  if (!habits || habits.length === 0) return ok({ sent: 0 });

  // ── Fetch completions for today ───────────────────────────────────────
  const { data: entries } = await supabase
    .from('habit_entries')
    .select('habit_id')
    .eq('entry_date', today)
    .eq('is_completed', true);

  const doneSet = new Set((entries ?? []).map((e: { habit_id: string }) => e.habit_id));

  // ── Group habits by user_id ───────────────────────────────────────────
  const byUser: Record<string, typeof habits> = {};
  for (const h of habits) {
    if (!byUser[h.user_id]) byUser[h.user_id] = [];
    byUser[h.user_id].push(h);
  }

  const userIds = Object.keys(byUser);

  // ── Fetch all push subscriptions for these users ──────────────────────
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth_key')
    .in('user_id', userIds);

  const subsByUser: Record<string, typeof subs> = {};
  for (const s of subs ?? []) {
    if (!subsByUser[s.user_id]) subsByUser[s.user_id] = [];
    subsByUser[s.user_id]!.push(s);
  }

  // ── Fetch user timezones from profiles ───────────────────────────────
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, timezone')
    .in('id', userIds);

  const tzMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    tzMap[p.id] = p.timezone ?? 'UTC';
  }

  // ── Send notifications ────────────────────────────────────────────────
  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const userId of userIds) {
    const userSubs = subsByUser[userId] ?? [];
    if (userSubs.length === 0) continue;

    const tz = tzMap[userId] ?? 'UTC';
    const nowLocal = currentTimeInTZ(tz);
    const window = timeWindow(nowLocal);

    const dueHabits = (byUser[userId] ?? []).filter(
      (h) => !doneSet.has(h.id) && h.reminder_time && window.includes(h.reminder_time.slice(0, 5))
    );
    if (dueHabits.length === 0) continue;

    // Build notification payload — group multiple habits into one notification
    const names = dueHabits.map((h) => h.name);
    const body =
      names.length === 1
        ? `Time to do: ${names[0]} 🔥`
        : `Time for ${names.length} habits: ${names.slice(0, 2).join(', ')}${names.length > 2 ? '…' : ''}`;

    for (const sub of userSubs) {
      try {
        await sendPushNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          { title: 'HabitForge Reminder', body, url: '/dashboard', tag: 'habitforge-reminder' }
        );
        sent++;
      } catch (e: unknown) {
        // 410 Gone = subscription expired; mark for cleanup
        if ((e as { statusCode?: number }).statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error('[cron/reminders] push send error:', e);
        }
      }
    }
  }

  // ── Cleanup stale subscriptions ───────────────────────────────────────
  if (staleEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', staleEndpoints);
  }

  return ok({ sent, staleRemoved: staleEndpoints.length });
}
