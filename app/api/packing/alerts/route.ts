import { NextResponse } from 'next/server';
import { getPackingAlerts } from '@/app/lib/services/packing';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alerts = await getPackingAlerts(session.user_id);
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching packing alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}