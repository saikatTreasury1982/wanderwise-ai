import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { createTrip, getTripsByUserId } from '@/app/lib/services/trip-service';
import { getUserById } from '@/app/lib/services/user-service';
import { createTraveler } from '@/app/lib/services/traveler-service';

export async function GET() {
  try {
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

    const trips = await getTripsByUserId(session.user_id);

    return NextResponse.json({ trips });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
    const { trip_name, trip_description, start_date, end_date, status_code, destinations } = body;

    if (!trip_name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Trip name, start date, and end date are required' },
        { status: 400 }
      );
    }

    const trip = await createTrip({
      user_id: session.user_id,
      trip_name,
      trip_description,
      start_date,
      end_date,
      status_code: status_code || 1,
      destinations: destinations || [], // Pass destinations array
    });

    // Auto-create primary traveler if trip is created with Active status
    if (status_code === 2) {
      console.log('Trip created with Active status, creating primary traveler...');

      // Fetch user details
      const user = await getUserById(session.user_id);

      if (user) {
        // Create primary traveler record for the logged-in user
        const travelerName = [user.first_name, user.middle_name, user.last_name]
          .filter(Boolean)
          .join(' ');

        await createTraveler({
          trip_id: trip.trip_id,
          traveler_name: travelerName,
          traveler_email: user.email,
          relationship: 1, // 1 = Self
          is_primary: true,
          is_cost_sharer: true,
          traveler_currency: user.home_currency,
          is_active: true,
        });

        console.log('Primary traveler created successfully');
      } else {
        console.error('User not found for primary traveler creation');
      }
    }

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}