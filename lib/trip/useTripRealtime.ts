'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Refresh the current route when one of the given trip_* tables changes for the
 * signed-in user. Keeps the two travelers in sync across devices.
 */
export function useTripRealtime(tables: string[], userId: string | null) {
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channels = tables.map((table) =>
      supabase
        .channel(`trip:${table}:${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
          () => router.refresh(),
        )
        .subscribe(),
    );
    return () => {
      channels.forEach((c) => supabase.removeChannel(c));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, tables.join(','), router]);
}
