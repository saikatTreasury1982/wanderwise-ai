import { NextRequest, NextResponse } from 'next/server';
import { getItineraryActivitiesByCategory, createItineraryActivity, createBulkItineraryActivities } from '@/app/lib/services/itinerary';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';

export async function GET(
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activities = await getItineraryActivitiesByCategory(Number(categoryId));
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if bulk add
    if (body.bulk && body.activities) {
      const activities = await createBulkItineraryActivities(Number(categoryId), body.activities);
      return NextResponse.json(activities, { status: 201 });
    }

    // Single activity
    const activity = await createItineraryActivity({
      category_id: Number(categoryId),
      activity_name: body.activity_name,
      start_time: body.start_time,
      end_time: body.end_time,
      duration_minutes: body.duration_minutes,
      activity_cost: body.activity_cost,
      currency_code: body.currency_code,
      notes: body.notes,
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}