import { z } from 'zod';
import {
  BOOKING_STATUSES,
  BOOKING_TYPES,
  DOCUMENT_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '@/lib/trip/types';

// Matches ASCII control characters (0x00–0x1F and 0x7F). Built from char codes
// so no raw control bytes live in this source file.
const CONTROL_CHARS = new RegExp(
  '[' + String.fromCharCode(0) + '-' + String.fromCharCode(31) + String.fromCharCode(127) + ']',
  'g',
);

// Mirror the sanitisation used across Productivity Master's validations: strip HTML tags
// and control chars, collapse whitespace, before length checks.
function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const safeText = (max: number, min = 0) =>
  z
    .string()
    .max(max + 200)
    .transform(sanitizeText)
    .pipe(z.string().min(min, min ? 'Required' : undefined).max(max));

const traveler = z.string().min(1, 'Traveler name is required');

export const expenseSchema = z.object({
  trip_id: z.string().uuid('Trip ID is required'),
  category: z.enum(EXPENSE_CATEGORIES),
  item: safeText(120, 1),
  amount: z.coerce.number().min(0, 'Amount must be >= 0'),
  paid_by: traveler,
  // When >1 person paid: { name: amount } that must sum to `amount`. null/absent = single payer.
  paid_by_amounts: z.record(traveler, z.coerce.number().min(0)).optional().nullable(),
  split_between: z.array(traveler).min(1, 'Pick at least one person to split with').optional(),
  source_url: z.string().trim().url('Must be a valid URL').optional().or(z.literal('')),
  notes: safeText(500).optional().or(z.literal('')),
  receipt_path: z.string().trim().optional().nullable(),
  expense_date: z.string().min(1, 'Date is required'),
}).superRefine((v, ctx) => {
  const m = v.paid_by_amounts;
  if (!m || Object.keys(m).length < 2) return;
  const sum = Object.values(m).reduce((s, n) => s + n, 0);
  if (Math.abs(sum - v.amount) > 0.01) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['paid_by_amounts'], message: 'Payer amounts must add up to the total' });
  }
  if (!(v.paid_by in m)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['paid_by'], message: 'Payer must be one of the people who paid' });
  }
});
export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const bookingSchema = z.object({
  trip_id: z.string().uuid('Trip ID is required'),
  type: z.enum(BOOKING_TYPES),
  booking_name: safeText(120, 1),
  amount: z.coerce.number().min(0),
  paid_by: traveler,
  status: z.enum(BOOKING_STATUSES),
});
export type BookingFormValues = z.infer<typeof bookingSchema>;

export const itinerarySchema = z.object({
  trip_id: z.string().uuid('Trip ID is required'),
  day: z.coerce.number().int().min(1, 'Day must be >= 1'),
  title: safeText(120, 1),
  description: safeText(1000).optional().or(z.literal('')),
  location: safeText(120).optional().or(z.literal('')),
});
export type ItineraryFormValues = z.infer<typeof itinerarySchema>;

export const tripSchema = z.object({
  name: safeText(120, 1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  total_budget: z.coerce.number().min(0),
  travelers: z.array(z.string().min(1, 'Name cannot be empty')).min(1, 'At least one traveler is required').optional(),
});
export type TripFormValues = z.infer<typeof tripSchema>;

export const settlementSchema = z.object({
  trip_id: z.string().uuid('Trip ID is required'),
  from_person: traveler,
  to_person: traveler,
  amount: z.coerce.number().min(0),
});

export const packingSchema = z.object({
  trip_id: z.string().uuid('Trip ID is required'),
  item: safeText(120, 1),
});

export const packingPatchSchema = z.object({
  completed: z.boolean(),
});

export const documentMetaSchema = z.object({
  trip_id: z.string().uuid('Trip ID is required'),
  name: safeText(200, 1),
  category: z.enum(DOCUMENT_CATEGORIES),
  file_path: z.string().min(1).max(400),
  size_bytes: z.coerce.number().int().min(0),
  mime_type: z.string().max(200).optional().nullable(),
});
