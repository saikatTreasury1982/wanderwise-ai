import { NextRequest, NextResponse } from 'next/server';
import { getItineraryActivityById, updateItineraryActivity, deleteItineraryActivity } from '@/app/lib/services/itinerary';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';

async function auth() {
  const c = await cookies();
  const t = c.get('session')?.value;
  if (!t) return null;
  return getSession(t);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ tripId: string; rangeId: string; categoryId: string; activityId: string }> }) {
  try {
    const { activityId } = await params;
    if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const activity = await getItineraryActivityById(Number(activityId));
    if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ tripId: string; rangeId: string; categoryId: string; activityId: string }> }) {
  try {
    const { activityId } = await params;
    if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const activity = await updateItineraryActivity(Number(activityId), body);
    if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ tripId: string; rangeId: string; categoryId: string; activityId: string }> }) {
  try {
    const { activityId } = await params;
    if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await deleteItineraryActivity(Number(activityId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 });
  }
}