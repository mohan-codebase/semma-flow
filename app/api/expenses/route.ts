import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { expenseSchema } from '@/lib/validations/expense';
import { safeErrorMessage } from '@/lib/utils/api';

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// GET /api/expenses?month=2025-05
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const month = req.nextUrl.searchParams.get('month'); // e.g. "2025-05"
    let query = supabase
      .from('expenses')
      .select('*, category:expense_categories(*)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      const from = `${year}-${String(mon).padStart(2, '0')}-01`;
      const lastDay = new Date(year, mon, 0).getDate();
      const to = `${year}-${String(mon).padStart(2, '0')}-${lastDay}`;
      query = query.gte('date', from).lte('date', to);
    }

    const { data, error } = await query;
    if (error) return err(safeErrorMessage(error, 'Failed to load expenses'), 500);

    return ok(data ?? []);
  } catch (e) {
    return err(safeErrorMessage(e, 'Server error'), 500);
  }
}

// POST /api/expenses
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? 'Invalid payload', 422);
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({ ...parsed.data, user_id: user.id })
      .select('*, category:expense_categories(*)')
      .single();

    if (error) return err(safeErrorMessage(error, 'Failed to create expense'), 500);

    return ok(expense, 201);
  } catch (e) {
    return err(safeErrorMessage(e, 'Server error'), 500);
  }
}
