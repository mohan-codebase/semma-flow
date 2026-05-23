'use client';

import FitnessSummary from '@/components/dashboard/FitnessSummary';
import type { OverviewStats as OverviewStatsType } from '@/types/analytics';
import type { HabitWithEntry } from '@/types/habit';

interface DashboardAppProps {
  stats: OverviewStatsType | null;
  habits: HabitWithEntry[];
  weekData: { date: string; percentage: number; isToday: boolean }[];
  displayName: string;
  initials: string;
  email: string;
  greeting: string;
  heroLine: string;
  heroPct: number;
  dayName: string;
  dateStr: string;
}

export default function DashboardApp({
  stats, habits, weekData, displayName, initials, email,
}: DashboardAppProps) {
  return (
    <FitnessSummary
      stats={stats}
      habits={habits}
      weekData={weekData}
      displayName={displayName}
      initials={initials}
      email={email}
    />
  );
}
