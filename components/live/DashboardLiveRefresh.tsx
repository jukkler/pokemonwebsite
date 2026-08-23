'use client';

import { startTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveRefresh } from '@/lib/hooks/useLiveRefresh';

const DASHBOARD_TOPICS = ['encounters', 'runs', 'players'] as const;

export default function DashboardLiveRefresh() {
  const router = useRouter();
  const refreshDashboard = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  useLiveRefresh(DASHBOARD_TOPICS, refreshDashboard);
  return null;
}
