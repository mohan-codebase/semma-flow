// Domain types for the Trip Planner (merged into Productivity Master).
// Tables are prefixed `trip_` and scoped to the signed-in user (user_id).

export type Traveler = string;

export const EXPENSE_CATEGORIES = [
  'Travel',
  'Hotel',
  'Food',
  'Fuel',
  'Clothing',
  'Accessories',
  'Medicine',
  'Booking',
  'Miscellaneous',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const BOOKING_TYPES = ['Flight', 'Train', 'Hotel', 'Bike Rental'] as const;
export type BookingType = (typeof BOOKING_TYPES)[number];

export const BOOKING_STATUSES = ['Pending', 'Confirmed'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const DOCUMENT_CATEGORIES = [
  'Ticket',
  'Hotel Confirmation',
  'ID Copy',
  'Permit',
  'Other',
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export interface Trip {
  id: string;
  user_id: string;
  name: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  total_budget: number;
  created_at: string;
  travelers: string[];
}

export interface TripExpense {
  id: string;
  user_id: string;
  trip_id: string;
  category: ExpenseCategory;
  item: string;
  amount: number;
  paid_by: Traveler;
  // When >1 person paid, how much each paid (sums to `amount`). null = single payer (`paid_by`).
  paid_by_amounts: Record<string, number> | null;
  // Travelers who share this expense's cost. null/empty = split among everyone.
  split_between: string[] | null;
  // Whether this expense's debt has been reimbursed (drops out of the pending balance).
  settled: boolean;
  source_url: string | null;
  notes: string | null;
  receipt_path: string | null;
  expense_date: string;
  created_at: string;
}

export interface TripBooking {
  id: string;
  user_id: string;
  trip_id: string;
  type: BookingType;
  booking_name: string;
  amount: number;
  paid_by: Traveler;
  status: BookingStatus;
  created_at: string;
}

export interface TripItineraryDay {
  id: string;
  user_id: string;
  trip_id: string;
  day: number;
  title: string;
  description: string | null;
  location: string | null;
  created_at: string;
}

export interface TripPackingItem {
  id: string;
  user_id: string;
  trip_id: string;
  item: string;
  completed: boolean;
  created_at: string;
}

export interface TripDocument {
  id: string;
  user_id: string;
  trip_id: string;
  name: string;
  category: DocumentCategory;
  file_path: string;
  size_bytes: number;
  mime_type: string | null;
  created_at: string;
}

// A recorded payment from one traveler to another to clear a pending balance.
export interface TripSettlement {
  id: string;
  user_id: string;
  trip_id: string;
  from_person: string;
  to_person: string;
  amount: number;
  created_at: string;
}

// Computed settlement between travelers.
export interface Settlement {
  totalExpenses: number;
  // Average share across travelers (totalExpenses / traveler count). With
  // per-expense splits, individual shares live in `owed`.
  sharePerPerson: number;
  payments: Record<string, number>; // amount each person actually paid
  owed: Record<string, number>;     // each person's share of consumed expenses
  balances: Record<string, number>; // paid − owed (positive = creditor)
  transfers: Array<{
    from: string;
    to: string;
    amount: number;
  }>;
}
