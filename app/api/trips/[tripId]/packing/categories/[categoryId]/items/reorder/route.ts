import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { query } from '@/app/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
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
    const { itemOrders } = body;

    if (!itemOrders || !Array.isArray(itemOrders)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    for (const { item_id, display_order } of itemOrders) {
      await query(
        'UPDATE packing_items SET display_order = ? WHERE item_id = ? AND category_id = ?',
        [display_order, item_id, parseInt(categoryId)]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering items:', error);
    return NextResponse.json({ error: 'Failed to reorder items' }, { status: 500 });
  }
}