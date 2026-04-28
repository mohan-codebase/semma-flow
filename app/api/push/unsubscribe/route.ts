import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

function ok<T>(data: T) {
  return NextResponse.json({ data }, { status: 200 });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// DELETE — remove a push subscription by endpoint
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  const body = await req.json().catch(() => null);
  const { endpoint } = body ?? {};

  if (typeof endpoint !== 'string') {
    return err('Missing endpoint');
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);

  if (error) {
    console.error('[push/unsubscribe] DB error:', error);
    return err('Failed to remove subscription', 500);
  }

  return ok({ unsubscribed: true });
}
