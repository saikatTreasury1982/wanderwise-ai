export interface AdhocExpense {
  adhoc_expense_id: number;
  trip_id: number;
  expense_name: string;
  description: string | null;
  amount: number;
  currency_code: string;
  expense_date: string | null; // TEXT format 'YYYY-MM-DD'
  category: string | null;
  is_active: number; // 1 = active, 0 = inactive
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  travelers?: AdhocExpenseTraveler[];
}

export interface AdhocExpenseTraveler {
  adhoc_expense_traveler_id: number;
  adhoc_expense_id: number;
  traveler_id: number;
  traveler_name: string;
  is_cost_sharer: number;
}

export interface CreateAdhocExpenseInput {
  trip_id: number;
  expense_name: string;
  description?: string | null;
  amount: number;
  currency_code: string;
  expense_date?: string | null;
  category?: string | null;
  is_active?: number;
  notes?: string | null;
  traveler_ids: number[];
}

export interface UpdateAdhocExpenseInput {
  expense_name?: string;
  description?: string | null;
  amount?: number;
  currency_code?: string;
  expense_date?: string | null;
  category?: string | null;
  is_active?: number;
  notes?: string | null;
  traveler_ids?: number[];
}