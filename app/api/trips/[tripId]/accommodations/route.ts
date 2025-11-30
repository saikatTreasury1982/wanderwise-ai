import { NextRequest, NextResponse } from 'next/server';
import { getAccommodationOptionsByTrip, createAccommodationOption } from '@/lib/services/accommodation-options';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const accommodations = await getAccommodationOptionsByTrip(Number(tripId));
    return NextResponse.json(accommodations);
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    return NextResponse.json({ error: 'Failed to fetch accommodations' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const accommodation = await createAccommodationOption({ ...body, trip_id: Number(tripId) });
    return NextResponse.json(accommodation, { status: 201 });
  } catch (error) {
    console.error('Error creating accommodation:', error);
    return NextResponse.json({ error: 'Failed to create accommodation' }, { status: 500 });
  }
}