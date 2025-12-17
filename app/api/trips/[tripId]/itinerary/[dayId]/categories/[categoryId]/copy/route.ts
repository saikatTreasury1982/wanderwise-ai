import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { query } from '@/app/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string; dayId: string; categoryId: string }> }
) {
  try {
    const { tripId, dayId, categoryId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get original category
    const categories = await query(
      'SELECT * FROM itinerary_day_categories WHERE category_id = ? AND day_id = ?',
      [parseInt(categoryId), parseInt(dayId)]
    );

    if (categories.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const originalCategory = categories[0] as any;

    // Get max display order
    const maxOrderResult = await query(
      'SELECT MAX(display_order) as max_order FROM itinerary_day_categories WHERE day_id = ?',
      [parseInt(dayId)]
    );
    const nextOrder = ((maxOrderResult[0] as any)?.max_order || 0) + 1;

    // Create new category
    await query(
      `INSERT INTO itinerary_day_categories 
       (day_id, category_name, category_cost, currency_code, cost_type, headcount, is_expanded, is_active, display_order)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)`,
      [
        parseInt(dayId),
        `${originalCategory.category_name} (Copy)`,
        originalCategory.category_cost,
        originalCategory.currency_code,
        originalCategory.cost_type,
        originalCategory.headcount,
        nextOrder,
      ]
    );

    // Get the new category ID
    const newCategories = await query(
      'SELECT * FROM itinerary_day_categories WHERE day_id = ? ORDER BY category_id DESC LIMIT 1',
      [parseInt(dayId)]
    );
    const newCategory = newCategories[0] as any;

    // Copy activities
    const activities = await query(
      'SELECT * FROM itinerary_activities WHERE category_id = ? ORDER BY display_order ASC',
      [parseInt(categoryId)]
    );

    for (const activity of activities as any[]) {
      await query(
        `INSERT INTO itinerary_activities 
         (category_id, activity_name, start_time, end_time, duration_minutes, activity_cost, 
          currency_code, cost_type, headcount, notes, is_completed, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          newCategory.category_id,
          activity.activity_name,
          activity.start_time,
          activity.end_time,
          activity.duration_minutes,
          activity.activity_cost,
          activity.currency_code,
          activity.cost_type,
          activity.headcount,
          activity.notes,
          activity.display_order,
        ]
      );
    }

    // Fetch complete new category with activities
    const newCategoryWithActivities = await query(
      `SELECT c.*, 
              json_group_array(
                json_object(
                  'activity_id', a.activity_id,
                  'activity_name', a.activity_name,
                  'start_time', a.start_time,
                  'end_time', a.end_time,
                  'duration_minutes', a.duration_minutes,
                  'activity_cost', a.activity_cost,
                  'currency_code', a.currency_code,
                  'cost_type', a.cost_type,
                  'headcount', a.headcount,
                  'notes', a.notes,
                  'is_completed', a.is_completed,
                  'display_order', a.display_order
                )
              ) as activities
       FROM itinerary_day_categories c
       LEFT JOIN itinerary_activities a ON c.category_id = a.category_id
       WHERE c.category_id = ?
       GROUP BY c.category_id`,
      [newCategory.category_id]
    );

    return NextResponse.json(newCategoryWithActivities[0], { status: 201 });
  } catch (error) {
    console.error('Error copying category:', error);
    return NextResponse.json({ error: 'Failed to copy category' }, { status: 500 });
  }
}