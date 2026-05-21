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

// PATCH /api/expenses/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json();
    const parsed = expenseSchema.partial().safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? 'Invalid payload', 422);
    }

    const { data, error } = await supabase
      .from('expenses')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, category:expense_categories(*)')
      .single();

    if (error) return err(safeErrorMessage(error, 'Failed to update expense'), 500);

    return ok(data);
  } catch (e) {
    return err(safeErrorMessage(e, 'Server error'), 500);
  }
}

// DELETE /api/expenses/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return err(safeErrorMessage(error, 'Failed to delete expense'), 500);

    return ok({ id });
  } catch (e) {
    return err(safeErrorMessage(e, 'Server error'), 500);
  }
}
