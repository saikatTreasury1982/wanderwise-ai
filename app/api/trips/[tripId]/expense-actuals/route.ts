import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';
import { getActualsByTrip } from '@/app/lib/services/expense-actuals';

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

    const actuals = await getActualsByTrip(Number(tripId));

    return NextResponse.json({ actuals });
  } catch (error) {
    console.error('Error fetching actuals:', error);
    return NextResponse.json({ error: 'Failed to fetch actuals' }, { status: 500 });
  }
}