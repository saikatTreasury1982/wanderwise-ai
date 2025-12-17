import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { query } from '@/app/lib/db';

export async function PUT(
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

    const body = await request.json();
    const { activityOrders } = body; // Array of { activity_id, display_order }

    if (!activityOrders || !Array.isArray(activityOrders)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Update display orders
    for (const { activity_id, display_order } of activityOrders) {
      await query(
        'UPDATE itinerary_activities SET display_order = ? WHERE activity_id = ? AND category_id = ?',
        [display_order, activity_id, parseInt(categoryId)]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering activities:', error);
    return NextResponse.json({ error: 'Failed to reorder activities' }, { status: 500 });
  }
}