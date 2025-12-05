import { NextRequest, NextResponse } from 'next/server';
import { getItineraryDaysByTrip, createItineraryDay } from '@/app/lib/services/itinerary';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const days = await getItineraryDaysByTrip(Number(tripId));
    return NextResponse.json(days);
  } catch (error) {
    console.error('Error fetching itinerary days:', error);
    return NextResponse.json({ error: 'Failed to fetch itinerary' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
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
    const day = await createItineraryDay({
      trip_id: Number(tripId),
      day_number: body.day_number,
      day_date: body.day_date,
      description: body.description,
    });

    return NextResponse.json(day, { status: 201 });
  } catch (error) {
    console.error('Error creating itinerary day:', error);
    return NextResponse.json({ error: 'Failed to create itinerary day' }, { status: 500 });
  }
}