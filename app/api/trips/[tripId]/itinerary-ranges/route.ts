import { NextRequest, NextResponse } from 'next/server';
import { getItineraryRangesByTrip, createItineraryRange } from '@/app/lib/services/itinerary';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await getSession(sessionToken);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ranges = await getItineraryRangesByTrip(Number(tripId));
    return NextResponse.json(ranges);
  } catch (error) {
    console.error('Error fetching itinerary ranges:', error);
    return NextResponse.json({ error: 'Failed to fetch ranges' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await getSession(sessionToken);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const range = await createItineraryRange({
      trip_id: Number(tripId),
      start_day: body.start_day,
      end_day: body.end_day,
      range_name: body.range_name,
      description: body.description,
    });
    return NextResponse.json(range, { status: 201 });
  } catch (error) {
    console.error('Error creating itinerary range:', error);
    return NextResponse.json({ error: 'Failed to create range' }, { status: 500 });
  }
}