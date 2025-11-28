import { NextRequest, NextResponse } from 'next/server';
import { getFlightOptionsByTrip, createFlightOption } from '@/lib/services/flight-options';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const flights = await getFlightOptionsByTrip(Number(tripId));
    return NextResponse.json(flights);
  } catch (error) {
    console.error('Error fetching flights:', error);
    return NextResponse.json({ error: 'Failed to fetch flights' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const flight = await createFlightOption({ ...body, trip_id: Number(tripId) });
    return NextResponse.json(flight, { status: 201 });
  } catch (error) {
    console.error('Error creating flight:', error);
    return NextResponse.json({ error: 'Failed to create flight' }, { status: 500 });
  }
}