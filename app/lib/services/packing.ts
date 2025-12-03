import { query } from '@/app/lib/db';
import type {
  PackingCategory,
  PackingItem,
  CreatePackingCategoryInput,
  UpdatePackingCategoryInput,
  CreatePackingItemInput,
  UpdatePackingItemInput,
  PackingStats,
  PackingAlert,
} from '@/app/lib/types/packing';

// Categories

export async function getPackingCategoriesByTrip(tripId: number): Promise<PackingCategory[]> {
  const categories = await query<PackingCategory>(
    `SELECT * FROM packing_categories WHERE trip_id = ? ORDER BY display_order, created_at`,
    [tripId]
  );

  const categoriesWithItems: PackingCategory[] = [];

  for (const category of categories) {
    const items = await query<PackingItem>(
      `SELECT * FROM packing_items WHERE category_id = ? ORDER BY display_order, created_at`,
      [category.category_id]
    );

    categoriesWithItems.push({
      ...category,
      items,
    });
  }

  return categoriesWithItems;
}

export async function getPackingCategoryById(categoryId: number): Promise<PackingCategory | null> {
  const rows = await query<PackingCategory>(
    `SELECT * FROM packing_categories WHERE category_id = ?`,
    [categoryId]
  );

  if (rows.length === 0) return null;

  const items = await query<PackingItem>(
    `SELECT * FROM packing_items WHERE category_id = ? ORDER BY display_order, created_at`,
    [categoryId]
  );

  return {
    ...rows[0],
    items,
  };
}

export async function createPackingCategory(input: CreatePackingCategoryInput): Promise<PackingCategory> {
  // Get max display_order for this trip
  const [{ maxOrder }] = await query<{ maxOrder: number | null }>(
    `SELECT MAX(display_order) as maxOrder FROM packing_categories WHERE trip_id = ?`,
    [input.trip_id]
  );

  const displayOrder = input.display_order ?? (maxOrder ?? 0) + 1;

  await query(
    `INSERT INTO packing_categories (trip_id, category_name, display_order) VALUES (?, ?, ?)`,
    [input.trip_id, input.category_name, displayOrder]
  );

  const [{ id: categoryId }] = await query<{ id: number }>(`SELECT last_insert_rowid() as id`, []);

  return (await getPackingCategoryById(categoryId))!;
}

export async function updatePackingCategory(
  categoryId: number,
  input: UpdatePackingCategoryInput
): Promise<PackingCategory | null> {
  const current = await getPackingCategoryById(categoryId);
  if (!current) return null;

  const updates: string[] = [];
  const args: (string | number)[] = [];

  if (input.category_name !== undefined) {
    updates.push('category_name = ?');
    args.push(input.category_name);
  }
  if (input.display_order !== undefined) {
    updates.push('display_order = ?');
    args.push(input.display_order);
  }

  if (updates.length > 0) {
    args.push(categoryId);
    await query(
      `UPDATE packing_categories SET ${updates.join(', ')} WHERE category_id = ?`,
      args
    );
  }

  return getPackingCategoryById(categoryId);
}

export async function deletePackingCategory(categoryId: number): Promise<boolean> {
  const category = await getPackingCategoryById(categoryId);
  if (!category) return false;

  await query(`DELETE FROM packing_categories WHERE category_id = ?`, [categoryId]);
  return true;
}

// Items

export async function getPackingItemById(itemId: number): Promise<PackingItem | null> {
  const rows = await query<PackingItem>(
    `SELECT * FROM packing_items WHERE item_id = ?`,
    [itemId]
  );

  return rows.length > 0 ? rows[0] : null;
}

export async function createPackingItem(input: CreatePackingItemInput): Promise<PackingItem> {
  // Get max display_order for this category
  const [{ maxOrder }] = await query<{ maxOrder: number | null }>(
    `SELECT MAX(display_order) as maxOrder FROM packing_items WHERE category_id = ?`,
    [input.category_id]
  );

  const displayOrder = input.display_order ?? (maxOrder ?? 0) + 1;

  await query(
    `INSERT INTO packing_items (category_id, item_name, display_order) VALUES (?, ?, ?)`,
    [input.category_id, input.item_name, displayOrder]
  );

  const [{ id: itemId }] = await query<{ id: number }>(`SELECT last_insert_rowid() as id`, []);

  return (await getPackingItemById(itemId))!;
}

export async function updatePackingItem(
  itemId: number,
  input: UpdatePackingItemInput
): Promise<PackingItem | null> {
  const current = await getPackingItemById(itemId);
  if (!current) return null;

  const updates: string[] = [];
  const args: (string | number)[] = [];

  if (input.item_name !== undefined) {
    updates.push('item_name = ?');
    args.push(input.item_name);
  }
  if (input.is_packed !== undefined) {
    updates.push('is_packed = ?');
    args.push(input.is_packed);
  }
  if (input.priority !== undefined) {
    updates.push('priority = ?');
    args.push(input.priority);
  }
  if (input.display_order !== undefined) {
    updates.push('display_order = ?');
    args.push(input.display_order);
  }

  if (updates.length > 0) {
    args.push(itemId);
    await query(
      `UPDATE packing_items SET ${updates.join(', ')} WHERE item_id = ?`,
      args
    );
  }

  return getPackingItemById(itemId);
}

export async function deletePackingItem(itemId: number): Promise<boolean> {
  const item = await getPackingItemById(itemId);
  if (!item) return false;

  await query(`DELETE FROM packing_items WHERE item_id = ?`, [itemId]);
  return true;
}

export async function togglePackingItem(itemId: number): Promise<PackingItem | null> {
  const item = await getPackingItemById(itemId);
  if (!item) return null;

  const newStatus = item.is_packed === 1 ? 0 : 1;
  await query(`UPDATE packing_items SET is_packed = ? WHERE item_id = ?`, [newStatus, itemId]);

  return getPackingItemById(itemId);
}

// Stats

export async function getPackingStats(tripId: number): Promise<PackingStats> {
  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*) as total FROM packing_items pi
     JOIN packing_categories pc ON pi.category_id = pc.category_id
     WHERE pc.trip_id = ?`,
    [tripId]
  );

  const [{ packed }] = await query<{ packed: number }>(
    `SELECT COUNT(*) as packed FROM packing_items pi
     JOIN packing_categories pc ON pi.category_id = pc.category_id
     WHERE pc.trip_id = ? AND pi.is_packed = 1`,
    [tripId]
  );

  return {
    totalItems: total,
    packedItems: packed,
    percentage: total > 0 ? Math.round((packed / total) * 100) : 0,
  };
}

export async function getPackingAlerts(userId: string): Promise<PackingAlert[]> {
  // Get active trips within 7 days
  const trips = await query<{
    trip_id: number;
    trip_name: string;
    start_date: string;
  }>(
    `SELECT trip_id, trip_name, start_date 
     FROM trips 
     WHERE user_id = ? 
       AND status_code = 'active'
       AND date(start_date) BETWEEN date('now') AND date('now', '+7 days')
     ORDER BY start_date`,
    [userId]
  );

  const alerts: PackingAlert[] = [];

  for (const trip of trips) {
    // Get unpacked critical items (alert 7 days before)
    const criticalItems = await query<PackingItem>(
      `SELECT pi.* FROM packing_items pi
       JOIN packing_categories pc ON pi.category_id = pc.category_id
       WHERE pc.trip_id = ? AND pi.is_packed = 0 AND pi.priority = 'critical'`,
      [trip.trip_id]
    );

    // Get unpacked important items only if within 3 days
    const daysUntil = Math.ceil(
      (new Date(trip.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    let importantItems: PackingItem[] = [];
    if (daysUntil <= 3) {
      importantItems = await query<PackingItem>(
        `SELECT pi.* FROM packing_items pi
         JOIN packing_categories pc ON pi.category_id = pc.category_id
         WHERE pc.trip_id = ? AND pi.is_packed = 0 AND pi.priority = 'important'`,
        [trip.trip_id]
      );
    }

    if (criticalItems.length > 0 || importantItems.length > 0) {
      alerts.push({
        trip_id: trip.trip_id,
        trip_name: trip.trip_name,
        days_until: daysUntil,
        critical_items: criticalItems,
        important_items: importantItems,
      });
    }
  }

  return alerts;
}