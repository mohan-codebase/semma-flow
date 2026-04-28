import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { todayString } from '@/lib/utils/dates';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const format = req.nextUrl.searchParams.get('format') || 'json';

    if (format === 'csv') {
      const { data: entries } = await supabase
        .from('habit_entries')
        .select('*, habit:habits(name)')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (!entries || entries.length === 0) {
        return new NextResponse('No entries to export yet', { status: 404 });
      }

      const rows = [
        ['habit_name', 'entry_date', 'is_completed', 'value', 'notes'].join(','),
        ...(entries ?? []).map((e) => [
          `"${(e.habit as { name: string } | null)?.name ?? ''}"`,
          e.entry_date,
          e.is_completed,
          e.value ?? '',
          `"${(e.notes ?? '').replace(/"/g, '""')}"`,
        ].join(',')),
      ];

      const csvData = rows.join('\n');
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="habitforge-entries-${todayString()}.csv"`,
        },
      });
    }

    // Default JSON
    const [habitsRes, entriesRes, moodsRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('habit_entries').select('*').eq('user_id', user.id),
      supabase.from('daily_moods').select('*').eq('user_id', user.id),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      habits: habitsRes.data ?? [],
      entries: entriesRes.data ?? [],
      moods: moodsRes.data ?? [],
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="habitforge-export-${todayString()}.json"`,
      },
    });

  } catch (e) {
    return new NextResponse(String(e), { status: 500 });
  }
}
