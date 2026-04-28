import type { HabitEntry } from '@/types/entry';
export type { HabitEntry };

export type FrequencyType = 'daily' | 'weekly' | 'x_per_week' | 'x_per_month';

export interface Frequency {
  type: FrequencyType;
  days?: number[];   // 0=Sun, 1=Mon ... 6=Sat (for 'weekly')
  count?: number;    // for 'x_per_week' | 'x_per_month'
}

export type TargetType = 'boolean' | 'numeric' | 'duration';

export interface Habit {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  frequency: Frequency;
  target_type: TargetType;
  target_value: number;
  target_unit: string | null;
  reminder_time: string | null;
  is_archived: boolean;
  sort_order: number;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  created_at: string;
  updated_at: string;
  // joined
  category?: Category | null;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface HabitWithEntry extends Habit {
  todayEntry?: HabitEntry | null;
  completionRate?: number;
}
