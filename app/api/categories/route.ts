import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { categorySchema } from '@/lib/validations/habit';

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// GET /api/categories
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (error) return err(error.message, 500);
    return ok(data ?? []);
  } catch (e) {
    return err(String(e), 500);
  }
}

// POST /api/categories
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.message, 422);
    }



    const { data: maxRow } = await supabase
      .from('categories')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from('categories')
      .insert({ ...parsed.data, user_id: user.id, sort_order: (maxRow?.sort_order ?? -1) + 1 })
      .select()
      .single();

    if (error) return err(error.message, 500);
    return ok(data, 201);
  } catch (e) {
    return err(String(e), 500);
  }
}

// DELETE /api/categories?id=...
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return err('Missing id', 400);

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return err(error.message, 500);
    return ok({ id, deleted: true });
  } catch (e) {
    return err(String(e), 500);
  }
}
