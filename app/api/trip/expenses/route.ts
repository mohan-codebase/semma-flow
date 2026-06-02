import { NextRequest } from 'next/server';
import { ok, err, getAuth } from '@/lib/trip/route-helpers';
import { expenseSchema } from '@/lib/trip/schemas';
import { safeErrorMessage } from '@/lib/utils/api';

// POST /api/trip/expenses — create an expense for the signed-in user.
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) return err('Unauthorized', 401);

    const parsed = expenseSchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Invalid input');

    const v = parsed.data;
    const { error } = await auth.supabase.from('trip_expenses').insert({
      user_id: auth.user.id,
      trip_id: v.trip_id,
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
    });
    if (error) return err(safeErrorMessage(error, 'Failed to add expense'), 500);
    return ok(true, 201);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to add expense'), 500);
  }
}
