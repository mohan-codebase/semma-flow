export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';

export type GoalCategory =
  | 'health'
  | 'finance'
  | 'career'
  | 'learning'
  | 'relationships'
  | 'personal'
  | 'fitness'
  | 'mindfulness';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completed_at?: string | null;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  target_date: string | null;
  status: GoalStatus;
  progress: number;
  milestones: Milestone[];
  linked_habit_ids: string[];
  created_at: string;
  updated_at: string;
}
