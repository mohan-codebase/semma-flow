export interface HabitEntry {
  id: string;
  habit_id: string;
  user_id: string;
  entry_date: string; // ISO date string 'YYYY-MM-DD'
  is_completed: boolean;
  value: number | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyMood {
  id: string;
  user_id: string;
  entry_date: string;
  mood_score: number; // 1-5
  energy_level: number | null; // 1-5
  note: string | null;
  created_at: string;
}
