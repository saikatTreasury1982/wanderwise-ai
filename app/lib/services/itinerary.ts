import { query } from '@/app/lib/db';
import type {
  ItineraryDay,
  ItineraryDayCategory,
  ItineraryActivity,
  CreateItineraryDayInput,
  UpdateItineraryDayInput,
  CreateItineraryCategoryInput,
  UpdateItineraryCategoryInput,
  CreateItineraryActivityInput,
  UpdateItineraryActivityInput,
} from '@/app/lib/types/itinerary';

// ==================== DAYS ====================

export async function getItineraryDaysByTrip(tripId: number): Promise<ItineraryDay[]> {
  const days = await query<ItineraryDay>(
    `SELECT * FROM itinerary_days WHERE trip_id = ? ORDER BY day_number`,
    [tripId]
  );

  for (const day of days) {
    day.categories = await getItineraryCategoriesByDay(day.day_id);
  }

  return days;
}

export async function getItineraryDayById(dayId: number): Promise<ItineraryDay | null> {
  const rows = await query<ItineraryDay>(
    `SELECT * FROM itinerary_days WHERE day_id = ?`,
    [dayId]
  );

  if (rows.length === 0) return null;

  const day = rows[0];
  day.categories = await getItineraryCategoriesByDay(day.day_id);

  return day;
}

export async function getItineraryDayByNumber(tripId: number, dayNumber: number): Promise<ItineraryDay | null> {
  const rows = await query<ItineraryDay>(
    `SELECT * FROM itinerary_days WHERE trip_id = ? AND day_number = ?`,
    [tripId, dayNumber]
  );

  if (rows.length === 0) return null;

  const day = rows[0];
  day.categories = await getItineraryCategoriesByDay(day.day_id);

  return day;
}

export async function createItineraryDay(input: CreateItineraryDayInput): Promise<ItineraryDay> {
  await query(
    `INSERT INTO itinerary_days (trip_id, day_number, day_date, description)
     VALUES (?, ?, ?, ?)`,
    [input.trip_id, input.day_number, input.day_date, input.description || null]
  );

  const [{ id }] = await query<{ id: number }>(`SELECT last_insert_rowid() as id`, []);
  return (await getItineraryDayById(id))!;
}

export async function updateItineraryDay(dayId: number, input: UpdateItineraryDayInput): Promise<ItineraryDay | null> {
  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (input.day_date !== undefined) {
    updates.push('day_date = ?');
    args.push(input.day_date);
  }
  if (input.description !== undefined) {
    updates.push('description = ?');
    args.push(input.description);
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    args.push(dayId);
    await query(
      `UPDATE itinerary_days SET ${updates.join(', ')} WHERE day_id = ?`,
      args
    );
  }

  return getItineraryDayById(dayId);
}

export async function deleteItineraryDay(dayId: number): Promise<boolean> {
  await query(`DELETE FROM itinerary_days WHERE day_id = ?`, [dayId]);
  return true;
}

// ==================== CATEGORIES ====================

export async function getItineraryCategoriesByDay(dayId: number): Promise<ItineraryDayCategory[]> {
  const categories = await query<ItineraryDayCategory>(
    `SELECT * FROM itinerary_day_categories WHERE day_id = ? ORDER BY display_order, category_id`,
    [dayId]
  );

  for (const category of categories) {
    category.activities = await getItineraryActivitiesByCategory(category.category_id);
  }

  return categories;
}

export async function getItineraryCategoryById(categoryId: number): Promise<ItineraryDayCategory | null> {
  const rows = await query<ItineraryDayCategory>(
    `SELECT * FROM itinerary_day_categories WHERE category_id = ?`,
    [categoryId]
  );

  if (rows.length === 0) return null;

  const category = rows[0];
  category.activities = await getItineraryActivitiesByCategory(category.category_id);

  return category;
}

export async function createItineraryCategory(input: CreateItineraryCategoryInput): Promise<ItineraryDayCategory> {
  const [{ maxOrder }] = await query<{ maxOrder: number | null }>(
    `SELECT MAX(display_order) as maxOrder FROM itinerary_day_categories WHERE day_id = ?`,
    [input.day_id]
  );

  const displayOrder = input.display_order ?? (maxOrder ?? 0) + 1;

  await query(
    `INSERT INTO itinerary_day_categories (day_id, category_name, category_cost, currency_code, display_order)
     VALUES (?, ?, ?, ?, ?)`,
    [input.day_id, input.category_name, input.category_cost ?? null, input.currency_code ?? null, displayOrder]
  );

  const [{ id }] = await query<{ id: number }>(`SELECT last_insert_rowid() as id`, []);
  return (await getItineraryCategoryById(id))!;
}

export async function updateItineraryCategory(categoryId: number, input: UpdateItineraryCategoryInput): Promise<ItineraryDayCategory | null> {
  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (input.category_name !== undefined) {
    updates.push('category_name = ?');
    args.push(input.category_name);
  }
  if (input.category_cost !== undefined) {
    updates.push('category_cost = ?');
    args.push(input.category_cost);
  }
  if (input.currency_code !== undefined) {
    updates.push('currency_code = ?');
    args.push(input.currency_code);
  }
  if (input.display_order !== undefined) {
    updates.push('display_order = ?');
    args.push(input.display_order);
  }
  if (input.is_expanded !== undefined) {
    updates.push('is_expanded = ?');
    args.push(input.is_expanded);
  }

  if (updates.length > 0) {
    args.push(categoryId);
    await query(
      `UPDATE itinerary_day_categories SET ${updates.join(', ')} WHERE category_id = ?`,
      args
    );
  }

  return getItineraryCategoryById(categoryId);
}

export async function deleteItineraryCategory(categoryId: number): Promise<boolean> {
  await query(`DELETE FROM itinerary_day_categories WHERE category_id = ?`, [categoryId]);
  return true;
}

// ==================== ACTIVITIES ====================

export async function getItineraryActivitiesByCategory(categoryId: number): Promise<ItineraryActivity[]> {
  return query<ItineraryActivity>(
    `SELECT * FROM itinerary_activities WHERE category_id = ? ORDER BY display_order, start_time, activity_id`,
    [categoryId]
  );
}

export async function getItineraryActivityById(activityId: number): Promise<ItineraryActivity | null> {
  const rows = await query<ItineraryActivity>(
    `SELECT * FROM itinerary_activities WHERE activity_id = ?`,
    [activityId]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createItineraryActivity(input: CreateItineraryActivityInput): Promise<ItineraryActivity> {
  const [{ maxOrder }] = await query<{ maxOrder: number | null }>(
    `SELECT MAX(display_order) as maxOrder FROM itinerary_activities WHERE category_id = ?`,
    [input.category_id]
  );

  const displayOrder = input.display_order ?? (maxOrder ?? 0) + 1;

  // Auto-calculate duration if start and end time provided
  let durationMinutes = input.duration_minutes ?? null;
  if (input.start_time && input.end_time && !durationMinutes) {
    const [startH, startM] = input.start_time.split(':').map(Number);
    const [endH, endM] = input.end_time.split(':').map(Number);
    durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight
  }

  await query(
    `INSERT INTO itinerary_activities (category_id, activity_name, start_time, end_time, duration_minutes, activity_cost, currency_code, notes, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.category_id,
      input.activity_name,
      input.start_time ?? null,
      input.end_time ?? null,
      durationMinutes,
      input.activity_cost ?? null,
      input.currency_code ?? null,
      input.notes ?? null,
      displayOrder,
    ]
  );

  const [{ id }] = await query<{ id: number }>(`SELECT last_insert_rowid() as id`, []);
  return (await getItineraryActivityById(id))!;
}

export async function createBulkItineraryActivities(categoryId: number, activityNames: string[]): Promise<ItineraryActivity[]> {
  const activities: ItineraryActivity[] = [];

  for (const name of activityNames) {
    if (name.trim()) {
      const activity = await createItineraryActivity({
        category_id: categoryId,
        activity_name: name.trim(),
      });
      activities.push(activity);
    }
  }

  return activities;
}

export async function updateItineraryActivity(activityId: number, input: UpdateItineraryActivityInput): Promise<ItineraryActivity | null> {
  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (input.activity_name !== undefined) {
    updates.push('activity_name = ?');
    args.push(input.activity_name);
  }
  if (input.start_time !== undefined) {
    updates.push('start_time = ?');
    args.push(input.start_time);
  }
  if (input.end_time !== undefined) {
    updates.push('end_time = ?');
    args.push(input.end_time);
  }
  if (input.duration_minutes !== undefined) {
    updates.push('duration_minutes = ?');
    args.push(input.duration_minutes);
  }
  if (input.activity_cost !== undefined) {
    updates.push('activity_cost = ?');
    args.push(input.activity_cost);
  }
  if (input.currency_code !== undefined) {
    updates.push('currency_code = ?');
    args.push(input.currency_code);
  }
  if (input.notes !== undefined) {
    updates.push('notes = ?');
    args.push(input.notes);
  }
  if (input.display_order !== undefined) {
    updates.push('display_order = ?');
    args.push(input.display_order);
  }
  if (input.is_completed !== undefined) {
    updates.push('is_completed = ?');
    args.push(input.is_completed);
  }

  // Auto-calculate duration if times changed
  if ((input.start_time !== undefined || input.end_time !== undefined) && input.duration_minutes === undefined) {
    const current = await getItineraryActivityById(activityId);
    if (current) {
      const startTime = input.start_time ?? current.start_time;
      const endTime = input.end_time ?? current.end_time;
      if (startTime && endTime) {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        let duration = (endH * 60 + endM) - (startH * 60 + startM);
        if (duration < 0) duration += 24 * 60;
        updates.push('duration_minutes = ?');
        args.push(duration);
      }
    }
  }

  if (updates.length > 0) {
    args.push(activityId);
    await query(
      `UPDATE itinerary_activities SET ${updates.join(', ')} WHERE activity_id = ?`,
      args
    );
  }

  return getItineraryActivityById(activityId);
}

export async function deleteItineraryActivity(activityId: number): Promise<boolean> {
  await query(`DELETE FROM itinerary_activities WHERE activity_id = ?`, [activityId]);
  return true;
}

export async function toggleItineraryActivity(activityId: number): Promise<ItineraryActivity | null> {
  const activity = await getItineraryActivityById(activityId);
  if (!activity) return null;

  await query(
    `UPDATE itinerary_activities SET is_completed = ? WHERE activity_id = ?`,
    [activity.is_completed ? 0 : 1, activityId]
  );

  return getItineraryActivityById(activityId);
}