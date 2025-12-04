import { NextRequest, NextResponse } from 'next/server';
import { getAlertTypesByUser, createAlertType } from '@/app/lib/services/alert';
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

    const alertTypes = await getAlertTypesByUser(session.user_id);
    return NextResponse.json(alertTypes);
  } catch (error) {
    console.error('Error fetching alert types:', error);
    return NextResponse.json({ error: 'Failed to fetch alert types' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const alertType = await createAlertType(session.user_id, body);
    return NextResponse.json(alertType, { status: 201 });
  } catch (error) {
    console.error('Error creating alert type:', error);
    return NextResponse.json({ error: 'Failed to create alert type' }, { status: 500 });
  }
}