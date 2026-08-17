import { NextRequest, NextResponse } from 'next/server';
import { getItineraryRangeById, updateItineraryRange, deleteItineraryRange } from '@/app/lib/services/itinerary';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';

async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return getSession(token);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ tripId: string; rangeId: string }> }) {
  try {
    const { rangeId } = await params;
    if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const range = await getItineraryRangeById(Number(rangeId));
    if (!range) return NextResponse.json({ error: 'Range not found' }, { status: 404 });
    return NextResponse.json(range);
  } catch (error) {
    console.error('Error fetching range:', error);
    return NextResponse.json({ error: 'Failed to fetch range' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ tripId: string; rangeId: string }> }) {
  try {
    const { rangeId } = await params;
    if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const range = await updateItineraryRange(Number(rangeId), {
      start_day: body.start_day,
      end_day: body.end_day,
      range_name: body.range_name,
      description: body.description,
    });
    return NextResponse.json(range);
  } catch (error) {
    console.error('Error updating range:', error);
    return NextResponse.json({ error: 'Failed to update range' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ tripId: string; rangeId: string }> }) {
  try {
    const { rangeId } = await params;
    if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await deleteItineraryRange(Number(rangeId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting range:', error);
    return NextResponse.json({ error: 'Failed to delete range' }, { status: 500 });
  }
}