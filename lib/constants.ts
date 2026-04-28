import type { AchievementDef } from '@/types/achievement';

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { type: 'streak_7',       title: '7-Day Streak',        description: 'Maintain a streak of 7 consecutive days',       icon: 'flame',       color: '#F59E0B', rarity: 'common' },
  { type: 'streak_14',      title: '14-Day Streak',       description: '14 days of consistent habit completion',         icon: 'flame',       color: '#F97316', rarity: 'common' },
  { type: 'streak_30',      title: '30-Day Streak',       description: 'A full month of dedication',                     icon: 'zap',         color: '#8B5CF6', rarity: 'rare' },
  { type: 'streak_60',      title: '60-Day Streak',       description: 'Two months of unstoppable momentum',             icon: 'zap',         color: '#6366F1', rarity: 'rare' },
  { type: 'streak_100',     title: '100-Day Streak',      description: 'Triple digits — extraordinary discipline',       icon: 'crown',       color: '#EC4899', rarity: 'epic' },
  { type: 'streak_365',     title: 'Year Warrior',        description: '365 days — you are legendary',                   icon: 'trophy',      color: '#EAB308', rarity: 'legendary' },
  { type: 'total_10',       title: 'Getting Started',     description: 'Complete 10 habit entries',                      icon: 'star',        color: '#10B981', rarity: 'common' },
  { type: 'total_50',       title: 'Building Momentum',   description: 'Complete 50 habit entries',                      icon: 'star',        color: '#10B981', rarity: 'common' },
  { type: 'total_100',      title: 'Centurion',           description: 'Reach 100 total completions',                    icon: 'award',       color: '#8B5CF6', rarity: 'rare' },
  { type: 'total_500',      title: 'Five Hundred',        description: '500 habits completed — remarkable',              icon: 'award',       color: '#6366F1', rarity: 'epic' },
  { type: 'total_1000',     title: 'Thousand Club',       description: '1,000 completions — elite status',               icon: 'gem',         color: '#EC4899', rarity: 'epic' },
  { type: 'total_5000',     title: 'Grandmaster',         description: '5,000 completions — absolute legend',            icon: 'gem',         color: '#EAB308', rarity: 'legendary' },
  { type: 'perfect_week',   title: 'Perfect Week',        description: 'Complete all habits for 7 consecutive days',     icon: 'calendar-check', color: '#10B981', rarity: 'rare' },
  { type: 'perfect_month',  title: 'Perfect Month',       description: 'Flawless 30-day execution',                      icon: 'calendar',    color: '#8B5CF6', rarity: 'epic' },
  { type: 'early_bird',     title: 'Early Bird',          description: 'Complete all habits before noon for 7 days',     icon: 'sunrise',     color: '#F59E0B', rarity: 'rare' },
  { type: 'consistency_king', title: 'Consistency King',  description: '90%+ completion rate for 30 days',               icon: 'crown',       color: '#EAB308', rarity: 'epic' },
  { type: 'category_master', title: 'Category Master',    description: '100% in a category for 30 days',                 icon: 'layers',      color: '#10B981', rarity: 'rare' },
  { type: 'comeback_kid',   title: 'Comeback Kid',        description: 'Resumed a habit after 7+ days and built a 7-day streak', icon: 'refresh-cw', color: '#6366F1', rarity: 'rare' },
];

export const HABIT_ICONS = [
  'circle-check', 'dumbbell', 'book-open', 'droplets', 'brain', 'heart', 'zap',
  'moon', 'sun', 'coffee', 'pencil', 'music', 'camera', 'bike', 'running',
  'meditation', 'leaf', 'star', 'fire', 'timer', 'apple', 'bed', 'code',
  'palette', 'globe', 'shopping-bag', 'utensils', 'activity',
];

export const CATEGORY_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899',
  '#6366F1', '#14B8A6', '#F97316', '#EF4444', '#84CC16',
];

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LABELS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
