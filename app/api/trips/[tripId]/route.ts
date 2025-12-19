import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { getTripById, updateTrip, deleteTrip, deleteTripPlanningData  } from '@/app/lib/services/trip-service';

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { tripId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const trip = await getTripById(parseInt(tripId), session.user_id);

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ trip });
  } catch (error) {
    console.error('Error fetching trip:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { tripId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { delete_planning_data, destinations, ...updateData } = body;

    // If dropping planning with data deletion
    if (delete_planning_data === true) {
      await deleteTripPlanningData(parseInt(tripId));
    }

    const trip = await updateTrip(parseInt(tripId), session.user_id, updateData);

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    // Handle destinations update if provided
    if (destinations !== undefined) {
      const { query } = await import('@/app/lib/db');
      
      // Delete existing destinations
      await query(
        `DELETE FROM trip_destinations WHERE trip_id = ?`,
        [parseInt(tripId)]
      );

      // Insert new destinations
      if (destinations.length > 0) {
        for (let i = 0; i < destinations.length; i++) {
          const dest = destinations[i];
          await query(
            `INSERT INTO trip_destinations (trip_id, country, city, display_order) VALUES (?, ?, ?, ?)`,
            [parseInt(tripId), dest.country, dest.city || null, i]
          );
        }
      }
    }

    return NextResponse.json({ trip });
  } catch (error) {
    console.error('Error updating trip:', error);
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { tripId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    await deleteTrip(parseInt(tripId), session.user_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete trip' },
      { status: 400 }
    );
  }
}