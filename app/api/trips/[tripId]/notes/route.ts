import { NextRequest, NextResponse } from 'next/server';
import { getTripNotesByTrip, createTripNote } from '@/lib/services/trip-notes';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const notes = await getTripNotesByTrip(Number(tripId));
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching trip notes:', error);
    return NextResponse.json({ error: 'Failed to fetch trip notes' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const note = await createTripNote({ ...body, trip_id: Number(tripId) });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating trip note:', error);
    return NextResponse.json({ error: 'Failed to create trip note' }, { status: 500 });
  }
}