import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/services/session-service';
import { getTripById } from '@/lib/services/trip-service';
import { getTravelersByTripId, createTraveler } from '@/lib/services/traveler-service';

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

    // Verify trip belongs to user
    const trip = await getTripById(parseInt(tripId), session.user_id);
    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    const travelers = await getTravelersByTripId(parseInt(tripId));

    return NextResponse.json({ travelers });
  } catch (error) {
    console.error('Error fetching travelers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch travelers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
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

    // Verify trip belongs to user
    const trip = await getTripById(parseInt(tripId), session.user_id);
    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { traveler_name, traveler_email, relationship, is_primary, is_cost_sharer, traveler_currency, is_active } = body;

    if (!traveler_name) {
      return NextResponse.json(
        { error: 'Traveler name is required' },
        { status: 400 }
      );
    }

    const traveler = await createTraveler({
      trip_id: parseInt(tripId),
      traveler_name,
      traveler_email,
      relationship,
      is_primary,
      is_cost_sharer,
      traveler_currency,
      is_active,
    });

    return NextResponse.json({ traveler }, { status: 201 });
  } catch (error) {
    console.error('Error creating traveler:', error);
    return NextResponse.json(
      { error: 'Failed to create traveler' },
      { status: 500 }
    );
  }
}