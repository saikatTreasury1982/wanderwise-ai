import { query } from '@/app/lib/db';

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

export interface TransferForecastInput {
  trip_id: number;
}

export interface UpdateActualInput {
  actual_amount?: number;
  actual_date?: string | null;
  paid_by_traveler_id?: number | null;
  payment_method_key?: string | null;
  receipt_url?: string | null;
  actual_notes?: string | null;
}

/**
 * Transfer all forecasted expenses to actuals for a trip
 */
export async function transferForecastToActuals(tripId: number): Promise<number> {
  // Get all expense splits for this trip
  const splits = await query<{
    expense_id: number;
    traveler_id: number;
    estimated_split_amount: number;
  }>(
    `SELECT es.expense_id, es.traveler_id, es.estimated_split_amount
     FROM expense_splits es
     JOIN expenses e ON es.expense_id = e.expense_id
     WHERE e.trip_id = ?`,
    [tripId]
  );

  let transferredCount = 0;

  for (const split of splits) {
    // Check if actual already exists
    const existing = await query<{ actual_id: number }>(
      `SELECT actual_id FROM expense_actuals 
       WHERE expense_id = ? AND traveler_id = ? AND installment_number = 1`,
      [split.expense_id, split.traveler_id]
    );

    if (existing.length === 0) {
      // Create actual record
      await query(
        `INSERT INTO expense_actuals (
          expense_id, traveler_id, installment_number, actual_amount
        ) VALUES (?, ?, 1, ?)`,
        [split.expense_id, split.traveler_id, split.estimated_split_amount]
      );
      transferredCount++;
    }
  }

  return transferredCount;
}

/**
 * Reset (delete) all actuals for a trip
 */
export async function resetActuals(tripId: number): Promise<number> {
  // Get count before deleting
  const [{ count }] = await query<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM expense_actuals ea
     JOIN expenses e ON ea.expense_id = e.expense_id
     WHERE e.trip_id = ?`,
    [tripId]
  );

  // Delete all actuals for this trip
  await query(
    `DELETE FROM expense_actuals
     WHERE expense_id IN (
       SELECT expense_id FROM expenses WHERE trip_id = ?
     )`,
    [tripId]
  );

  return count;
}

/**
 * Get all actuals for a trip with expense details
 */
export async function getActualsByTrip(tripId: number): Promise<ExpenseActual[]> {
  return query<ExpenseActual>(
    `SELECT 
      ea.*,
      e.expense_description,
      e.expense_currency,
      e.estimated_amount,
      tt.traveler_name,
      tt_paid.traveler_name as paid_by_name,
      pm.payment_type,
      pm.issuer as payment_provider
     FROM expense_actuals ea
     JOIN expenses e ON ea.expense_id = e.expense_id
     JOIN trip_travelers tt ON ea.traveler_id = tt.traveler_id
     LEFT JOIN trip_travelers tt_paid ON ea.paid_by_traveler_id = tt_paid.traveler_id
     LEFT JOIN payment_methods pm ON ea.payment_method_key = pm.payment_method_key
     WHERE e.trip_id = ?
     ORDER BY e.expense_description, ea.traveler_id, ea.installment_number`,
    [tripId]
  );
}

/**
 * Get actuals grouped by traveler (who owes)
 */
export async function getActualsByTraveler(tripId: number, travelerId: number): Promise<ExpenseActual[]> {
  return query<ExpenseActual>(
    `SELECT 
      ea.*,
      e.expense_description,
      e.expense_currency,
      e.estimated_amount,
      tt.traveler_name,
      tt_paid.traveler_name as paid_by_name,
      pm.payment_type,
      pm.issuer as payment_provider
     FROM expense_actuals ea
     JOIN expenses e ON ea.expense_id = e.expense_id
     JOIN trip_travelers tt ON ea.traveler_id = tt.traveler_id
     LEFT JOIN trip_travelers tt_paid ON ea.paid_by_traveler_id = tt_paid.traveler_id
     LEFT JOIN payment_methods pm ON ea.payment_method_key = pm.payment_method_key
     WHERE e.trip_id = ? AND ea.traveler_id = ?
     ORDER BY e.expense_description, ea.installment_number`,
    [tripId, travelerId]
  );
}

/**
 * Get actuals grouped by who paid
 */
export async function getActualsByPayer(tripId: number, payerId: number): Promise<ExpenseActual[]> {
  return query<ExpenseActual>(
    `SELECT 
      ea.*,
      e.expense_description,
      e.expense_currency,
      e.estimated_amount,
      tt.traveler_name,
      tt_paid.traveler_name as paid_by_name,
      pm.payment_type,
      pm.issuer as payment_provider
     FROM expense_actuals ea
     JOIN expenses e ON ea.expense_id = e.expense_id
     JOIN trip_travelers tt ON ea.traveler_id = tt.traveler_id
     LEFT JOIN trip_travelers tt_paid ON ea.paid_by_traveler_id = tt_paid.traveler_id
     LEFT JOIN payment_methods pm ON ea.payment_method_key = pm.payment_method_key
     WHERE e.trip_id = ? AND ea.paid_by_traveler_id = ?
     ORDER BY e.expense_description, ea.installment_number`,
    [tripId, payerId]
  );
}

/**
 * Get single actual by ID
 */
export async function getActualById(actualId: number): Promise<ExpenseActual | null> {
  const results = await query<ExpenseActual>(
    `SELECT 
      ea.*,
      e.expense_description,
      e.expense_currency,
      e.estimated_amount,
      tt.traveler_name,
      tt_paid.traveler_name as paid_by_name,
      pm.payment_type,
      pm.issuer as payment_provider
     FROM expense_actuals ea
     JOIN expenses e ON ea.expense_id = e.expense_id
     JOIN trip_travelers tt ON ea.traveler_id = tt.traveler_id
     LEFT JOIN trip_travelers tt_paid ON ea.paid_by_traveler_id = tt_paid.traveler_id
     LEFT JOIN payment_methods pm ON ea.payment_method_key = pm.payment_method_key
     WHERE ea.actual_id = ?`,
    [actualId]
  );

  return results.length > 0 ? results[0] : null;
}

/**
 * Update an actual record
 */
export async function updateActual(actualId: number, input: UpdateActualInput): Promise<ExpenseActual | null> {
  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (input.actual_amount !== undefined) {
    updates.push('actual_amount = ?');
    args.push(input.actual_amount);
  }
  if (input.actual_date !== undefined) {
    updates.push('actual_date = ?');
    args.push(input.actual_date);
  }
  if (input.paid_by_traveler_id !== undefined) {
    updates.push('paid_by_traveler_id = ?');
    args.push(input.paid_by_traveler_id);
  }
  if (input.payment_method_key !== undefined) {
    updates.push('payment_method_key = ?');
    args.push(input.payment_method_key);
  }
  if (input.receipt_url !== undefined) {
    updates.push('receipt_url = ?');
    args.push(input.receipt_url);
  }
  if (input.actual_notes !== undefined) {
    updates.push('actual_notes = ?');
    args.push(input.actual_notes);
  }

  if (updates.length === 0) {
    return getActualById(actualId);
  }

  args.push(actualId);

  await query(
    `UPDATE expense_actuals SET ${updates.join(', ')} WHERE actual_id = ?`,
    args
  );

  return getActualById(actualId);
}

/**
 * Calculate settlement summary for a trip
 */
export async function getSettlementSummary(tripId: number): Promise<{
  total_estimated: number;
  total_actual: number;
  variance: number;
  travelers: {
    traveler_id: number;
    traveler_name: string;
    should_pay: number;
    actually_paid: number;
    balance: number;
  }[];
  settlements: {
    from_traveler_id: number;
    from_name: string;
    to_traveler_id: number;
    to_name: string;
    amount: number;
  }[];
}> {
  // Get total estimated
  const [{ total_estimated }] = await query<{ total_estimated: number }>(
    `SELECT COALESCE(SUM(es.estimated_split_amount), 0) as total_estimated
     FROM expense_splits es
     JOIN expenses e ON es.expense_id = e.expense_id
     WHERE e.trip_id = ?`,
    [tripId]
  );

  // Get total actual (only count items that have been paid)
  const [{ total_actual }] = await query<{ total_actual: number }>(
    `SELECT COALESCE(SUM(ea.actual_amount), 0) as total_actual
     FROM expense_actuals ea
     JOIN expenses e ON ea.expense_id = e.expense_id
     WHERE e.trip_id = ? AND ea.paid_by_traveler_id IS NOT NULL`,
    [tripId]
  );

  // Get per-traveler breakdown
  const travelers = await query<{
    traveler_id: number;
    traveler_name: string;
    should_pay: number;
    actually_paid: number;
  }>(
    `SELECT 
      tt.traveler_id,
      tt.traveler_name,
      COALESCE(SUM(CASE WHEN ea.paid_by_traveler_id IS NOT NULL THEN ea.actual_amount ELSE 0 END), 0) as should_pay,
      COALESCE((
        SELECT SUM(ea2.actual_amount)
        FROM expense_actuals ea2
        JOIN expenses e2 ON ea2.expense_id = e2.expense_id
        WHERE e2.trip_id = ? AND ea2.paid_by_traveler_id = tt.traveler_id
      ), 0) as actually_paid
     FROM trip_travelers tt
     LEFT JOIN expense_actuals ea ON tt.traveler_id = ea.traveler_id
     LEFT JOIN expenses e ON ea.expense_id = e.expense_id AND e.trip_id = ?
     WHERE tt.trip_id = ? AND tt.is_cost_sharer = 1
     GROUP BY tt.traveler_id, tt.traveler_name
     ORDER BY tt.is_primary DESC, tt.traveler_name`,
    [tripId, tripId, tripId]
  );

  // Calculate balances (negative = owes money, positive = is owed money)
  const travelersWithBalance = travelers.map(t => ({
    ...t,
    balance: t.actually_paid - t.should_pay,
  }));

  // Calculate settlements (simplified greedy algorithm)
  const settlements: {
    from_traveler_id: number;
    from_name: string;
    to_traveler_id: number;
    to_name: string;
    amount: number;
  }[] = [];

  const debtors = travelersWithBalance.filter(t => t.balance < 0).map(t => ({ ...t }));
  const creditors = travelersWithBalance.filter(t => t.balance > 0).map(t => ({ ...t }));

  for (const debtor of debtors) {
    let remaining = Math.abs(debtor.balance);
    
    for (const creditor of creditors) {
      if (remaining <= 0.01) break;
      if (creditor.balance <= 0.01) continue;

      const settleAmount = Math.min(remaining, creditor.balance);
      
      settlements.push({
        from_traveler_id: debtor.traveler_id,
        from_name: debtor.traveler_name,
        to_traveler_id: creditor.traveler_id,
        to_name: creditor.traveler_name,
        amount: Math.round(settleAmount * 100) / 100,
      });

      remaining -= settleAmount;
      creditor.balance -= settleAmount;
    }
  }

  return {
    total_estimated,
    total_actual,
    variance: total_actual - total_estimated,
    travelers: travelersWithBalance,
    settlements,
  };
}