export interface ExpenseActual {
  actual_id: number;
  expense_id: number;
  traveler_id: number;
  installment_number: number;
  actual_amount: number;
  actual_date: string | null;
  paid_by_traveler_id: number | null;
  payment_method_key: string | null;
  receipt_url: string | null;
  actual_notes: string | null;
  created_at: string;
  
  // Joined data
  expense_description?: string;
  expense_currency?: string;
  estimated_amount?: number;
  traveler_name?: string;
  paid_by_name?: string;
  payment_type?: string;
  payment_provider?: string;
}

export interface SettlementSummary {
  total_estimated: number;
  total_actual: number;
  variance: number;
  travelers: TravelerBalance[];
  settlements: Settlement[];
}

export interface TravelerBalance {
  traveler_id: number;
  traveler_name: string;
  should_pay: number;
  actually_paid: number;
  balance: number;
}

export interface Settlement {
  from_traveler_id: number;
  from_name: string;
  to_traveler_id: number;
  to_name: string;
  amount: number;
}

export interface UpdateActualInput {
  actual_amount?: number;
  actual_date?: string | null;
  paid_by_traveler_id?: number | null;
  payment_method_key?: string | null;
  receipt_url?: string | null;
  actual_notes?: string | null;
}