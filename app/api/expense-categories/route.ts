import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { expenseCategorySchema } from '@/lib/validations/expense';
import { safeErrorMessage } from '@/lib/utils/api';

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// GET /api/expense-categories
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (error) return err(safeErrorMessage(error, 'Failed to load categories'), 500);

    return ok(data ?? []);
  } catch (e) {
    return err(safeErrorMessage(e, 'Server error'), 500);
  }
}

// POST /api/expense-categories
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json();
    const parsed = expenseCategorySchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? 'Invalid payload', 422);
    }

    const { data: maxRow } = await supabase
      .from('expense_categories')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const sort_order = (maxRow?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('expense_categories')
      .insert({ ...parsed.data, user_id: user.id, sort_order })
      .select('*')
      .single();

    if (error) return err(safeErrorMessage(error, 'Failed to create category'), 500);

    return ok(data, 201);
  } catch (e) {
    return err(safeErrorMessage(e, 'Server error'), 500);
  }
}
