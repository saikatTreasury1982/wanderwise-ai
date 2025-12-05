import { NextRequest, NextResponse } from 'next/server';
import { getItineraryDayById, updateItineraryDay, deleteItineraryDay } from '@/app/lib/services/itinerary';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; dayId: string }> }
) {
  try {
    const { dayId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const day = await getItineraryDayById(Number(dayId));
    if (!day) {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 });
    }

    return NextResponse.json(day);
  } catch (error) {
    console.error('Error fetching itinerary day:', error);
    return NextResponse.json({ error: 'Failed to fetch itinerary day' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; dayId: string }> }
) {
  try {
    const { dayId } = await params;
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
    const day = await updateItineraryDay(Number(dayId), body);

    if (!day) {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 });
    }

    return NextResponse.json(day);
  } catch (error) {
    console.error('Error updating itinerary day:', error);
    return NextResponse.json({ error: 'Failed to update itinerary day' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; dayId: string }> }
) {
  try {
    const { dayId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteItineraryDay(Number(dayId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting itinerary day:', error);
    return NextResponse.json({ error: 'Failed to delete itinerary day' }, { status: 500 });
  }
}