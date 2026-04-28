export interface DailyTrend {
  date: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface HeatmapCell {
  date: string;
  count: number;
  percentage: number;
}

export interface CategoryStat {
  category: string;
  color: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface WeekdayPattern {
  day: string; // 'Mon', 'Tue', etc.
  dayIndex: number;
  completionRate: number;
  totalEntries: number;
}

export interface OverviewStats {
  todayCompleted: number;
  todayTotal: number;
  todayPercentage: number;
  bestStreak: number;
  bestStreakHabitName: string;
  weekPercentage: number;
  totalCompletions: number;
}

export interface HabitLeaderboardItem {
  habitId: string;
  habitName: string;
  habitIcon: string;
  habitColor: string;
  completionRate: number;
  streak: number;
}
