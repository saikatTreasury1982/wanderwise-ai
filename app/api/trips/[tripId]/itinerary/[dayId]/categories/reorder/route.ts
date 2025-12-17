import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { query } from '@/app/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tripId: string; dayId: string }> }
) {
  try {
    const { tripId, dayId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryOrders } = body; // Array of { category_id, display_order }

    if (!categoryOrders || !Array.isArray(categoryOrders)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Update display orders
    for (const { category_id, display_order } of categoryOrders) {
      await query(
        'UPDATE itinerary_day_categories SET display_order = ? WHERE category_id = ? AND day_id = ?',
        [display_order, category_id, parseInt(dayId)]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering categories:', error);
    return NextResponse.json({ error: 'Failed to reorder categories' }, { status: 500 });
  }
}