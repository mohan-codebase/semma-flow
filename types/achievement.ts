export type AchievementType =
  | 'streak_7' | 'streak_14' | 'streak_30' | 'streak_60' | 'streak_100' | 'streak_365'
  | 'total_10' | 'total_50' | 'total_100' | 'total_500' | 'total_1000' | 'total_5000'
  | 'perfect_week' | 'perfect_month'
  | 'early_bird' | 'consistency_king'
  | 'category_master' | 'comeback_kid';

export interface Achievement {
  id: string;
  user_id: string;
  type: AchievementType;
  habit_id: string | null;
  unlocked_at: string;
  metadata: Record<string, unknown>;
}

export interface AchievementDef {
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}
