import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { getTripById, updateTrip, deleteTrip } from '@/app/lib/services/trip-service';
import { getUserById } from '@/app/lib/services/user-service';
import { getTravelersByTripId, createTraveler } from '@/app/lib/services/traveler-service';
import { replaceTripDestinations } from '@/app/lib/services/destination-service';
import { query } from '@/app/lib/db';

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
    const { destinations, ...updateData } = body;

    // Get the current trip state before update
    const currentTrip = await getTripById(parseInt(tripId), session.user_id);
    if (!currentTrip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    const trip = await updateTrip(parseInt(tripId), session.user_id, updateData);

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    // Auto-create primary traveler when transitioning to Active status
    console.log('Current trip status:', currentTrip.status_code);
    console.log('Update data status:', updateData.status_code);

    const isTransitioningToActive =
      updateData.status_code === 2 &&
      currentTrip.status_code !== 2;

    console.log('Is transitioning to active?', isTransitioningToActive);

    if (isTransitioningToActive) {
      console.log('Checking for primary traveler...');

      // Check if primary traveler already exists
      const travelers = await getTravelersByTripId(parseInt(tripId));
      console.log('Existing travelers:', travelers);

      const hasPrimaryTraveler = travelers.some(t => t.is_primary === 1);
      console.log('Has primary traveler?', hasPrimaryTraveler);

      if (!hasPrimaryTraveler) {
        console.log('Fetching user details for:', session.user_id);

        // Fetch user details
        const user = await getUserById(session.user_id);

        if (user) {
          // Create primary traveler record for the logged-in user
          const travelerName = [user.first_name, user.middle_name, user.last_name]
            .filter(Boolean)
            .join(' ');

          await createTraveler({
            trip_id: parseInt(tripId),
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
          console.error('User not found!');
        }
      }
    }

    // Handle destinations update if provided
    if (destinations !== undefined) {
      await replaceTripDestinations(parseInt(tripId), destinations);
    }

    // after building/applying the update, before returning:
    // enforce invariant: completed trip with a future end date reverts to active
    const updatedTrip = await getTripById(Number(tripId), session.user_id); // or however you fetch it
    if (updatedTrip && updatedTrip.status_code === 3) {
      const endDate = new Date(updatedTrip.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (endDate >= today) {
        await query(
          `UPDATE trips SET status_code = 2 WHERE trip_id = ?`,
          [Number(tripId)]
        );
        // re-fetch so response reflects the revert
        // (or set updatedTrip.status_code = 2 before returning)
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