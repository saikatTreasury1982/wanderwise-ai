import { query } from '@/app/lib/db';
import type { AdhocExpense, CreateAdhocExpenseInput, UpdateAdhocExpenseInput } from '@/app/lib/types/adhoc-expense';

export async function getAdhocExpensesByTrip(tripId: number): Promise<AdhocExpense[]> {
  // Single query with LEFT JOINs for travelers
  const rows = await query<{
    adhoc_expense_id: number;
    trip_id: number;
    expense_name: string;
    description: string | null;
    amount: number;
    currency_code: string;
    expense_date: string | null;
    category: string | null;
    is_active: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
    traveler_link_id: number | null;
    traveler_id: number | null;
    traveler_name: string | null;
    is_cost_sharer: number | null;
  }>(
    `SELECT 
      ae.*,
      aet.adhoc_expense_traveler_id as traveler_link_id,
      aet.traveler_id,
      tt.traveler_name,
      tt.is_cost_sharer
     FROM adhoc_expenses ae
     LEFT JOIN adhoc_expense_travelers aet ON ae.adhoc_expense_id = aet.adhoc_expense_id
     LEFT JOIN trip_travelers tt ON aet.traveler_id = tt.traveler_id
     WHERE ae.trip_id = ?
     ORDER BY ae.expense_date DESC NULLS LAST, ae.created_at DESC, aet.adhoc_expense_traveler_id`,
    [tripId]
  );

  const expenseMap = new Map<number, AdhocExpense>();
  const travelersMap = new Map<number, Set<number>>(); // Track which travelers we've added

  for (const row of rows) {
    // Create expense if not exists
    if (!expenseMap.has(row.adhoc_expense_id)) {
      expenseMap.set(row.adhoc_expense_id, {
        adhoc_expense_id: row.adhoc_expense_id,
        trip_id: row.trip_id,
        expense_name: row.expense_name,
        description: row.description,
        amount: row.amount,
        currency_code: row.currency_code,
        expense_date: row.expense_date,
        category: row.category,
        is_active: row.is_active,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
        travelers: [],
      });
      travelersMap.set(row.adhoc_expense_id, new Set());
    }

    const expense = expenseMap.get(row.adhoc_expense_id)!;

    // Add traveler if exists and not already added
    if (row.traveler_id && !travelersMap.get(row.adhoc_expense_id)!.has(row.traveler_id)) {
      expense.travelers!.push({
        adhoc_expense_traveler_id: row.traveler_link_id!,
        adhoc_expense_id: row.adhoc_expense_id,
        traveler_id: row.traveler_id,
        traveler_name: row.traveler_name!,
        is_cost_sharer: row.is_cost_sharer ?? 1,
      });
      travelersMap.get(row.adhoc_expense_id)!.add(row.traveler_id);
    }
  }

  return Array.from(expenseMap.values());
}

export async function getAdhocExpenseById(expenseId: number): Promise<AdhocExpense | null> {
  const rows = await query<AdhocExpense>(
    `SELECT * FROM adhoc_expenses WHERE adhoc_expense_id = ?`,
    [expenseId]
  );

  if (rows.length === 0) return null;

  const travelers = await query<{ 
    adhoc_expense_traveler_id: number; 
    adhoc_expense_id: number; 
    traveler_id: number; 
    traveler_name: string;
    is_cost_sharer: number;
  }>(
    `SELECT aet.adhoc_expense_traveler_id, aet.adhoc_expense_id, aet.traveler_id, tt.traveler_name, tt.is_cost_sharer 
    FROM adhoc_expense_travelers aet
    JOIN trip_travelers tt ON aet.traveler_id = tt.traveler_id
    WHERE aet.adhoc_expense_id = ?`,
    [expenseId]
  );

  return {
    ...rows[0],
    travelers,
  };
}

export async function createAdhocExpense(input: CreateAdhocExpenseInput): Promise<AdhocExpense> {
  // Create main expense
  await query(
    `INSERT INTO adhoc_expenses (trip_id, expense_name, description, amount, currency_code, expense_date, category, is_active, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.trip_id,
      input.expense_name,
      input.description ?? null,
      input.amount,
      input.currency_code,
      input.expense_date ?? null,
      input.category ?? null,
      input.is_active ?? 1,
      input.notes ?? null,
    ]
  );

  const [{ id: expenseId }] = await query<{ id: number }>(`SELECT last_insert_rowid() as id`, []);

  // Create traveler associations
  if (input.traveler_ids?.length) {
    for (const travelerId of input.traveler_ids) {
      await query(
        `INSERT INTO adhoc_expense_travelers (adhoc_expense_id, traveler_id) VALUES (?, ?)`,
        [expenseId, travelerId]
      );
    }
  }

  return (await getAdhocExpenseById(expenseId))!;
}

export async function updateAdhocExpense(
  expenseId: number,
  input: UpdateAdhocExpenseInput
): Promise<AdhocExpense | null> {
  const current = await getAdhocExpenseById(expenseId);
  if (!current) return null;

  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (input.expense_name !== undefined) {
    updates.push('expense_name = ?');
    args.push(input.expense_name);
  }
  if (input.description !== undefined) {
    updates.push('description = ?');
    args.push(input.description);
  }
  if (input.amount !== undefined) {
    updates.push('amount = ?');
    args.push(input.amount);
  }
  if (input.currency_code !== undefined) {
    updates.push('currency_code = ?');
    args.push(input.currency_code);
  }
  if (input.expense_date !== undefined) {
    updates.push('expense_date = ?');
    args.push(input.expense_date);
  }
  if (input.category !== undefined) {
    updates.push('category = ?');
    args.push(input.category);
  }
  if (input.is_active !== undefined) {
    updates.push('is_active = ?');
    args.push(input.is_active);
  }
  if (input.notes !== undefined) {
    updates.push('notes = ?');
    args.push(input.notes);
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    args.push(expenseId);

    await query(
      `UPDATE adhoc_expenses SET ${updates.join(', ')} WHERE adhoc_expense_id = ?`,
      args
    );
  }

  // Update travelers if provided
  if (input.traveler_ids) {
    await query(`DELETE FROM adhoc_expense_travelers WHERE adhoc_expense_id = ?`, [expenseId]);

    for (const travelerId of input.traveler_ids) {
      await query(
        `INSERT INTO adhoc_expense_travelers (adhoc_expense_id, traveler_id) VALUES (?, ?)`,
        [expenseId, travelerId]
      );
    }
  }

  return getAdhocExpenseById(expenseId);
}

export async function deleteAdhocExpense(expenseId: number): Promise<boolean> {
  const expense = await getAdhocExpenseById(expenseId);
  if (!expense) return false;

  // Delete expense (cascades to travelers)
  await query(`DELETE FROM adhoc_expenses WHERE adhoc_expense_id = ?`, [expenseId]);

  return true;
}

export async function duplicateAdhocExpense(expenseId: number): Promise<AdhocExpense | null> {
  const original = await getAdhocExpenseById(expenseId);
  if (!original) return null;

  const input: CreateAdhocExpenseInput = {
    trip_id: original.trip_id,
    expense_name: `${original.expense_name} (Copy)`,
    description: original.description ?? undefined,
    amount: original.amount,
    currency_code: original.currency_code,
    expense_date: original.expense_date ?? undefined,
    category: original.category ?? undefined,
    is_active: original.is_active,
    notes: original.notes ?? undefined,
    traveler_ids: original.travelers?.map(t => t.traveler_id) ?? [],
  };

  return createAdhocExpense(input);
}