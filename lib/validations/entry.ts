import { z } from 'zod';

export const entrySchema = z.object({
  habit_id: z.string().uuid(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_completed: z.boolean(),
  value: z.number().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export type EntryFormValues = z.infer<typeof entrySchema>;

