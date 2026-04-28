import { z } from 'zod';

export const entrySchema = z.object({
  habit_id: z.string().uuid(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_completed: z.boolean(),
  value: z.number().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export type EntryFormValues = z.infer<typeof entrySchema>;

export const moodSchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood_score: z.number().min(1).max(5),
  energy_level: z.number().min(1).max(5).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
});

export type MoodFormValues = z.infer<typeof moodSchema>;
