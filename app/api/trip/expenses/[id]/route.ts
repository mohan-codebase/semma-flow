import { NextRequest } from 'next/server';
import { ok, err, getAuth } from '@/lib/trip/route-helpers';
import { expenseSchema } from '@/lib/trip/schemas';
import { safeErrorMessage } from '@/lib/utils/api';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/trip/expenses/[id] — update. The edit form submits all fields;
// a `{ settled }`-only body just toggles the settled flag.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const body = await req.json();

    // Lightweight settled-only toggle (no full-expense payload).
    if (typeof body?.settled === 'boolean' && body.item === undefined) {
      const { error } = await auth.supabase
        .from('trip_expenses')
        .update({ settled: body.settled })
        .eq('id', id)
        .eq('user_id', auth.user.id);
      if (error) return err(safeErrorMessage(error, 'Failed to update expense'), 500);
      return ok(true);
    }

    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Invalid input');

    const v = parsed.data;
    const { error } = await auth.supabase
      .from('trip_expenses')
      .update({
        category: v.category,
        item: v.item,
        amount: v.amount,
        paid_by: v.paid_by,
        paid_by_amounts: v.paid_by_amounts ?? null,
        split_between: v.split_between && v.split_between.length > 0 ? v.split_between : null,
        source_url: v.source_url || null,
        notes: v.notes || null,
        receipt_path: v.receipt_path || null,
        expense_date: v.expense_date,
      })
      .eq('id', id)
      .eq('user_id', auth.user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to update expense'), 500);
    return ok(true);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to update expense'), 500);
  }
}

// DELETE /api/trip/expenses/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const { data: exp } = await auth.supabase
      .from('trip_expenses')
      .select('receipt_path')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (exp?.receipt_path) {
      await auth.supabase.storage.from('trip-documents').remove([exp.receipt_path]);
    }

    const { error } = await auth.supabase
      .from('trip_expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id);
    if (error) return err(safeErrorMessage(error, 'Failed to delete expense'), 500);
    return ok(true);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to delete expense'), 500);
  }
}
