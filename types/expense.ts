export interface ExpenseCategory {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  budget: number | null;
  sort_order: number;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  note: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  // joined
  category?: ExpenseCategory | null;
}

export interface MonthlyStats {
  total: number;
  budget: number | null;
  byCategory: { category: ExpenseCategory | null; total: number }[];
  dailyTotals: { date: string; total: number }[];
}
