import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { getTripById } from '@/app/lib/services/trip-service';
import { getTravelerById, updateTraveler, deleteTraveler } from '@/app/lib/services/traveler-service';

interface RouteParams {
  params: Promise<{ tripId: string; travelerId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { tripId, travelerId } = await params;
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

    // Verify trip belongs to user
    const trip = await getTripById(parseInt(tripId), session.user_id);
    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    const traveler = await getTravelerById(parseInt(travelerId), parseInt(tripId));

    if (!traveler) {
      return NextResponse.json(
        { error: 'Traveler not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ traveler });
  } catch (error) {
    console.error('Error fetching traveler:', error);
    return NextResponse.json(
      { error: 'Failed to fetch traveler' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { tripId, travelerId } = await params;
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

    // Verify trip belongs to user
    const trip = await getTripById(parseInt(tripId), session.user_id);
    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    const traveler = await updateTraveler(parseInt(travelerId), parseInt(tripId), body);

    if (!traveler) {
      return NextResponse.json(
        { error: 'Traveler not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ traveler });
  } catch (error) {
    console.error('Error updating traveler:', error);
    return NextResponse.json(
      { error: 'Failed to update traveler' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { tripId, travelerId } = await params;
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

    // Verify trip belongs to user
    const trip = await getTripById(parseInt(tripId), session.user_id);
    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    await deleteTraveler(parseInt(travelerId), parseInt(tripId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting traveler:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete traveler' },
      { status: 400 }
    );
  }
}