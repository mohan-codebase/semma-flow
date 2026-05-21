import { z } from 'zod';

const sanitize = (s: string) => s.trim().replace(/\s+/g, ' ');

export const milestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  completed: z.boolean(),
  completed_at: z.string().nullable().optional(),
});

export const goalSchema = z.object({
  title: z.string().transform(sanitize).pipe(z.string().min(1, 'Title required').max(200)),
  description: z.string().max(1000).nullable().optional(),
  category: z.enum(['health', 'finance', 'career', 'learning', 'relationships', 'personal', 'fitness', 'mindfulness']),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.enum(['active', 'completed', 'paused', 'abandoned']).default('active'),
  progress: z.number().int().min(0).max(100).default(0),
  milestones: z.array(milestoneSchema).default([]),
  linked_habit_ids: z.array(z.string().uuid()).default([]),
});

export const goalUpdateSchema = goalSchema.partial();

export type GoalFormValues = z.input<typeof goalSchema>;
